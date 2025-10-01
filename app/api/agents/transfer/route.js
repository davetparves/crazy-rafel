// /app/api/agent/transfer/route.js
import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/db/connect'
import User from '@/models/user.model'
import Transaction from '@/models/transaction.model'

export async function POST(req) {
  try {
    const body = await req.json()
    const agentEmail = String(body?.agentEmail || '')
      .trim()
      .toLowerCase()
    const userEmail = String(body?.userEmail || '')
      .trim()
      .toLowerCase()
    const amount = Number(body?.amount)

    if (!agentEmail || !userEmail || !Number.isFinite(amount)) {
      return NextResponse.json(
        { success: false, message: 'agentEmail, userEmail এবং amount দরকার' },
        { status: 400 },
      )
    }
    if (amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Amount অবশ্যই পজিটিভ হতে হবে' },
        { status: 400 },
      )
    }
    if (agentEmail === userEmail) {
      return NextResponse.json(
        { success: false, message: 'একই এজেন্ট ও ইউজার ইমেইল দেওয়া যাবে না' },
        { status: 400 },
      )
    }

    await dbConnect()

    // ফেচ ইউজাররা
    const [agent, user] = await Promise.all([
      User.findOne({ email: agentEmail }).select('_id email role walletBalance').lean(),
      User.findOne({ email: userEmail }).select('_id email walletBalance').lean(),
    ])

    if (!agent) {
      return NextResponse.json({ success: false, message: 'Agent পাওয়া যায়নি' }, { status: 404 })
    }
    if (!user) {
      return NextResponse.json({ success: false, message: 'User পাওয়া যায়নি' }, { status: 404 })
    }

    // চাইলে এজেন্ট রোল চেক (ঐচ্ছিক)
    // if (agent.role !== 'agent') {
    //   return NextResponse.json({ success: false, message: 'এই অ্যাকাউন্ট agent নয়' }, { status: 403 })
    // }

    // এজেন্টের ব্যালেন্স যথেষ্ট কিনা
    if (Number(agent.walletBalance || 0) < amount) {
      return NextResponse.json(
        { success: false, message: 'এজেন্টের ব্যালেন্স অপর্যাপ্ত' },
        { status: 400 },
      )
    }

    // 🔐 Transaction (atomic)
    const session = await mongoose.startSession()
    try {
      let newAgentBal = Number(agent.walletBalance || 0)
      let newUserBal = Number(user.walletBalance || 0)

      await session.withTransaction(async () => {
        // 1) এজেন্ট থেকে কাটবে (+ এজেন্ট ট্রানজেকশন)
        const dec = await User.findOneAndUpdate(
          { _id: agent._id, walletBalance: { $gte: amount } },
          { $inc: { walletBalance: -amount } },
          { new: true, session, projection: 'walletBalance' },
        )
        if (!dec) throw new Error('Agent balance insufficient (race)')

        const tAgent = await Transaction.create([{ userId: agent._id, amount: -amount }], {
          session,
        })
        // এজেন্টের transactions-এ ট্রানজেকশন আইডি পুশ
        await User.updateOne(
          { _id: agent._id },
          { $push: { transactions: { transactionId: tAgent[0]._id, createdAt: new Date() } } },
          { session },
        )
        newAgentBal = Number(dec.walletBalance || 0)

        // 2) ইউজারের ব্যালেন্সে যোগ (+ ইউজার ট্রানজেকশন)
        const inc = await User.findOneAndUpdate(
          { _id: user._id },
          { $inc: { walletBalance: amount } },
          { new: true, session, projection: 'walletBalance' },
        )
        const tUser = await Transaction.create([{ userId: user._id, amount: amount }], { session })
        await User.updateOne(
          { _id: user._id },
          { $push: { transactions: { transactionId: tUser[0]._id, createdAt: new Date() } } },
          { session },
        )
        newUserBal = Number(inc.walletBalance || 0)
      })

      return NextResponse.json(
        {
          success: true,
          message: 'Deposit successful ✅',
          data: {
            agent: { email: agent.email, walletBalance: newAgentBal },
            user: { email: user.email, walletBalance: newUserBal },
          },
        },
        { status: 200 },
      )
    } finally {
      await session.endSession()
    }
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Server error', error: String(err?.message || err) },
      { status: 500 },
    )
  }
}
