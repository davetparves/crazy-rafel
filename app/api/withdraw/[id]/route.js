// /app/api/withdraw/[id]/route.js
import { NextResponse } from 'next/server'
import dbConnect from '@/db/connect'
import Withdraw from '@/models/withdraw.model'
import User from '@/models/user.model'
import Transaction from '@/models/transaction.model'
import mongoose from 'mongoose'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function PATCH(request, { params }) {
  await dbConnect()
  const id = params?.id
  if (!id) return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 })

  try {
    const { action } = await request.json().catch(() => ({}))
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 })
    }

    const wd = await Withdraw.findById(id)
    if (!wd) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 })
    if (wd.status !== 'pending') {
      return NextResponse.json({ success: false, message: 'Already processed' }, { status: 409 })
    }

    // ====== APPROVE ======
    if (action === 'approve') {
      wd.status = 'approved'
      await wd.save()
      return NextResponse.json({ success: true, message: 'Approved' }, { status: 200 })
    }

    // ====== REJECT + refund to user ======
    const user = await User.findOne({ email: wd.userEmail }).select('_id email walletBalance')
    if (!user)
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    const amount = Number(wd.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid amount on withdraw' },
        { status: 400 },
      )
    }

    let usedTxn = false
    const session = await mongoose.startSession()
    try {
      await session.withTransaction(async () => {
        usedTxn = true

        // 1) Refund: user's balance increment
        const updUser = await User.findOneAndUpdate(
          { _id: user._id },
          { $inc: { walletBalance: amount } },
          { new: true, session, select: 'walletBalance' },
        )
        if (!updUser) throw new Error('USER_NOT_FOUND')

        // 2) Create refund transaction (+amount)
        const refundTx = await Transaction.create([{ userId: user._id, amount: +amount }], {
          session,
        })
        const refundId = refundTx?.[0]?._id

        // 3) Link refund transaction to user
        await User.updateOne(
          { _id: user._id },
          { $push: { transactions: { transactionId: refundId } } },
          { session },
        )

        // 4) (Optional cleanup) try to delete prior debit tx (-amount) if any
        const oldDebit = await Transaction.findOneAndDelete(
          { userId: user._id, amount: -amount },
          { sort: { createdAt: -1 }, session },
        )
        if (oldDebit?._id) {
          await User.updateOne(
            { _id: user._id },
            { $pull: { transactions: { transactionId: oldDebit._id } } },
            { session },
          )
        }

        // 5) Mark withdraw rejected
        wd.status = 'rejected'
        await wd.save({ session })
      })
    } finally {
      await session.endSession()
    }

    if (!usedTxn) {
      // Fallback (no session support)
      await User.findOneAndUpdate(
        { _id: user._id },
        { $inc: { walletBalance: amount } },
        { new: true },
      )
      const refund = await Transaction.create({ userId: user._id, amount: +amount })
      await User.updateOne(
        { _id: user._id },
        { $push: { transactions: { transactionId: refund._id } } },
      )

      const oldDebit = await Transaction.findOneAndDelete(
        { userId: user._id, amount: -amount },
        { sort: { createdAt: -1 } },
      )
      if (oldDebit?._id) {
        await User.updateOne(
          { _id: user._id },
          { $pull: { transactions: { transactionId: oldDebit._id } } },
        )
      }

      wd.status = 'rejected'
      await wd.save()
    }

    return NextResponse.json({ success: true, message: 'Rejected & refunded' }, { status: 200 })
  } catch (e) {
    const msg = String(e?.message || e)
    if (msg === 'USER_NOT_FOUND') {
      return NextResponse.json(
        { success: false, message: 'User not found for refund' },
        { status: 404 },
      )
    }
    return NextResponse.json(
      { success: false, message: 'Failed to update', error: msg },
      { status: 500 },
    )
  }
}
