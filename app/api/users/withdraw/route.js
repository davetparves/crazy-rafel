import dbConnect from '@/db/connect'
import Transaction from '@/models/transaction.model'
import User from '@/models/user.model'
import Withdraw from '@/models/withdraw.model'
import { NextResponse } from 'next/server'


// body: { userEmail, agentEmail, method, paymentNumber, amount }
export async function POST(req) {
  try {
    const body = await req.json()

    const userEmail = String(body?.userEmail || '').trim().toLowerCase()
    const agentEmail = String(body?.agentEmail || '').trim().toLowerCase()
    const method = String(body?.method || '').trim()
    const paymentNumber = String(body?.paymentNumber || '').trim()
    const amount = Number(body?.amount || 0)

    // ✅ Basic validations
    if (!userEmail || !agentEmail || !method || !paymentNumber || !Number.isFinite(amount)) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 },
      )
    }
    if (amount < 300) {
      return NextResponse.json(
        { success: false, message: 'Minimum withdraw amount is 300' },
        { status: 400 },
      )
    }

    await dbConnect()



    // ✅ 1) Agent email must exist and be role === 'agent'
    const agent = await User.findOne({ email:agentEmail })

    if (!agent || String(agent.role || '').toLowerCase() !== 'agent') {
      return NextResponse.json(
        { success: false, message: 'Invalid agent email (এজেন্ট ইমেইল সঠিক নয়)' },
        { status: 400 },
      )
    }

    // ✅ 2) Load user & check balance
    const user = await User.findOne({ email: userEmail })
      .select('_id wallet currency transactions withdrawCount')
      .lean()

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    const mainBal = Number(user?.wallet?.main || 0)
    if (mainBal < amount) {
      return NextResponse.json(
        { success: false, message: 'Insufficient balance' },
        { status: 400 },
      )
    }

    // ✅ 3) Create transaction (negative amount for withdraw)
    const tx = await Transaction.create({
      userId: user._id,
      type: 'withdraw',
      amount: -Math.abs(amount), // ensure negative
      currency: user?.currency || 'BDT',
      referenceId: null,
      note: `Withdraw request of ${amount} ${user?.currency || 'BDT'} via ${method} to ${paymentNumber} (agent: ${agentEmail})`,
    })

    // ✅ 4) Deduct from wallet.main + push tx + increase withdrawCount
    const updated = await User.findByIdAndUpdate(
      user._id,
      {
        $inc: {
          'wallet.main': -Math.abs(amount),
          withdrawCount: 1,
        },
        $push: {
          transactions: {
            transactionId: tx._id,
            createdAt: new Date(),
          },
        },
      },
      { new: true, runValidators: true },
    ).select('wallet currency withdrawCount')

    // ✅ 5) Create Withdraw record (status: pending)
    const withdrawDoc = await Withdraw.create({
      agentEmail,
      method,
      paymentNumber,
      amount: Math.abs(amount),
      userEmail,            // মূল ইউজারের ইমেইল
      status: 'pending',    // ডিফল্টই pending, তবে স্পষ্ট করে দিলাম
    })

    return NextResponse.json({
      success: true,
      message: 'Withdraw request recorded',
      data: {
        transactionId: String(tx._id),
        withdrawId: String(withdrawDoc._id),  // ✅ নতুন আইডি রিটার্ন
        balance: Number(updated?.wallet?.main || 0),
        currency: updated?.currency || 'BDT',
      },
    })
  } catch (e) {
    return NextResponse.json(
      { success: false, message: e?.message || 'Server error' },
      { status: 500 },
    )
  }
}
