import { NextResponse } from 'next/server'
import dbConnect from '@/db/connect'
import Withdraw from '@/models/withdraw.model'
import User from '@/models/user.model'
import Transaction from '@/models/transaction.model'
import mongoose from 'mongoose'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request) {
  await dbConnect()
  try {
    const { agentEmail, withdrawId } = await request.json().catch(() => ({}))

    if (!agentEmail || !withdrawId) {
      return NextResponse.json(
        { success: false, message: 'agentEmail & withdrawId required' },
        { status: 400 },
      )
    }

    const agent = await User.findOne({ email: String(agentEmail).trim().toLowerCase() })
      .select('_id email role walletBalance')
    if (!agent) {
      return NextResponse.json({ success: false, message: 'Agent not found' }, { status: 404 })
    }
    if (!['agent', 'admin'].includes(agent.role)) {
      return NextResponse.json({ success: false, message: 'Not an agent' }, { status: 403 })
    }

    const wd = await Withdraw.findById(withdrawId).select('_id userEmail amount status')
    if (!wd) {
      return NextResponse.json({ success: false, message: 'Withdraw not found' }, { status: 404 })
    }
    if (wd.status !== 'pending') {
      return NextResponse.json({ success: false, message: 'Already processed' }, { status: 409 })
    }

    const user = await User.findOne({ email: wd.userEmail }).select('_id email walletBalance')
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    const amount = Number(wd.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid amount on withdraw' },
        { status: 400 },
      )
    }

    // NOTE: এজেন্টে এখন প্লাস হচ্ছে, তাই আগের "agent balance check" প্রয়োজন নেই।

    // ---- Transaction-safe block
    let usedTxn = false
    const session = await mongoose.startSession()
    try {
      await session.withTransaction(async () => {
        usedTxn = true

        // 1) Agent balance CREDIT (atomic) — আগে ছিল -amount, এখন +amount
        const updAgent = await User.findOneAndUpdate(
          { _id: agent._id },
          { $inc: { walletBalance: +amount } },
          { new: true, session, select: 'walletBalance' },
        )
        if (!updAgent) throw new Error('AGENT_UPDATE_FAILED')

        // 2) Transactions: agent +amount, user -amount
        const [tAgent, tUser] = await Transaction.insertMany(
          [
            { userId: agent._id, amount: +amount }, // agent credited
            { userId: user._id,  amount: -amount }, // user withdraw ledger
          ],
          { session, ordered: true },
        )

        // 3) Link transactions to users
        await User.updateOne(
          { _id: agent._id },
          { $push: { transactions: { transactionId: tAgent._id } } },
          { session },
        )
        await User.updateOne(
          { _id: user._id },
          { $push: { transactions: { transactionId: tUser._id } } },
          { session },
        )

        // 4) Approve withdraw
        wd.status = 'approved'
        await wd.save({ session })
      })
    } finally {
      await session.endSession()
    }

    if (!usedTxn) {
      // Fallback (no txn): best-effort
      const updAgent = await User.findOneAndUpdate(
        { _id: agent._id },
        { $inc: { walletBalance: +amount } }, // +amount here too
        { new: true, select: 'walletBalance' },
      )
      if (!updAgent) {
        return NextResponse.json(
          { success: false, message: 'Agent update failed' },
          { status: 500 },
        )
      }

      const tAgent = await Transaction.create({ userId: agent._id, amount: +amount }) // +amount
      const tUser  = await Transaction.create({ userId: user._id,  amount: -amount }) // -amount

      await User.updateOne(
        { _id: agent._id },
        { $push: { transactions: { transactionId: tAgent._id } } },
      )
      await User.updateOne(
        { _id: user._id },
        { $push: { transactions: { transactionId: tUser._id } } },
      )

      wd.status = 'approved'
      await wd.save()
    }

    return NextResponse.json(
      { success: true, message: 'Withdraw approved & credited to agent' },
      { status: 200 },
    )
  } catch (e) {
    const msg = String(e?.message || e)
    if (msg === 'AGENT_UPDATE_FAILED') {
      return NextResponse.json(
        { success: false, message: 'Agent update failed' },
        { status: 500 },
      )
    }
    return NextResponse.json(
      { success: false, message: 'Approve failed', error: msg },
      { status: 500 },
    )
  }
}
