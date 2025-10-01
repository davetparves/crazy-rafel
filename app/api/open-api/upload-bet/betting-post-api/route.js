// /app/api/open-api/upload-bet/betting-post-api/route.js
import dbConnect from '@/db/connect'
import Multiplier from '@/models/multiplier.model'
import Transaction from '@/models/transaction.model'
import User from '@/models/user.model'
import UserNumberList from '@/models/userNumberList.model'
import { NextResponse } from 'next/server'


export async function POST(req) {
  try {
    const body = await req.json()
    const email = String(body?.email || '').trim().toLowerCase()
    const number = Number(body?.number)
    const amount = Number(body?.amount)
    const betType = String(body?.betType || '').trim().toLowerCase() // 'single'|'double'|'triple'

    if (!email)  return NextResponse.json({ success:false, message:'ইমেইল প্রয়োজন' }, { status:400 })
    if (!Number.isFinite(number)) return NextResponse.json({ success:false, message:'number সঠিক নয়' }, { status:400 })
    if (!(Number.isFinite(amount) && amount > 0)) return NextResponse.json({ success:false, message:'amount সঠিক নয়' }, { status:400 })
    if (!['single','double','triple'].includes(betType))
      return NextResponse.json({ success:false, message:'betType single/double/triple হতে হবে' }, { status:400 })

    await dbConnect()

    const user = await User.findOne({ email }).select('_id wallet currency totalBets').lean()
    if (!user) return NextResponse.json({ success:false, message:'User পাওয়া যায়নি' }, { status:404 })

    const main = Number(user?.wallet?.main ?? 0)
    if (main < amount) {
      return NextResponse.json({ success:false, message:'আপনার ব্যালেন্স পর্যাপ্ত নয়' }, { status:400 })
    }

    const multDoc = await Multiplier.findOne({ name: betType }).select('value').lean()
    if (!multDoc || !Number.isFinite(Number(multDoc.value))) {
      return NextResponse.json({ success:false, message:'Multiplier পাওয়া যায়নি' }, { status:500 })
    }
    const prize = amount * Number(multDoc.value)

    // bet create
    const betDoc = await UserNumberList.create({
      userId: user._id,
      betType,
      number,
      amount,
      prize,
      status: 'pending',
    })

    // transaction create (negative)
    const trx = await Transaction.create({
      userId: user._id,
      type: 'bet',
      amount: -Math.abs(amount),
      currency: String(user.currency || 'BDT').toUpperCase(),
      referenceId: String(betDoc._id),
      note: `Bet ${betType} on ${number} (-${amount})`,
    })

    // user update: wallet.main -= amount, totalBets += 1, push trx
    await User.updateOne(
      { _id: user._id },
      {
        $inc: { 'wallet.main': -Math.abs(amount), totalBets: 1 },
        $push: { transactions: { transactionId: trx._id, createdAt: new Date() } },
      }
    )

    const fresh = await User.findById(user._id).select('wallet.main currency').lean()

    return NextResponse.json({
      success: true,
      message: 'Bet placed successfully',
      data: {
        betId: String(betDoc._id),
        transactionId: String(trx._id),
        newBalance: Number(fresh?.wallet?.main ?? (main - amount)),
        currency: String(fresh?.currency || 'BDT'),
        prize,
      },
    })
  } catch (err) {
    console.log(err);
    
    return NextResponse.json(
      { success:false, message:'Server error', error: err?.message || String(err) },
      { status:500 }
    )
  }
}
