// /app/api/wallet/get-all/route.js
import dbConnect from '@/db/connect'
import IncreaseGrowth from '@/models/increaseGrowth.model'
import User from '@/models/user.model'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const body = await req.json()
    const email = String(body?.email || '').trim().toLowerCase()
    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 })
    }

    await dbConnect()

    const user = await User.findOne({ email }).select('wallet currency').lean()
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    const main = Number(user.wallet?.main || 0)
    const bonus = Number(user.wallet?.bonus || 0)
    const referral = Number(user.wallet?.referral || 0)
    const bank = Number(user.wallet?.bank?.amount || 0)
    const requestTime = user.wallet?.bank?.requestTime || null   // ✅ নতুন
    const currency = String(user.currency || 'BDT')

    const growth = await IncreaseGrowth.findOne().sort({ createdAt: -1 }).lean()
    const rate = Number(growth?.rate ?? 1.2) // fallback 1.2

    return NextResponse.json({
      success: true,
      data: { main, bonus, referral, bank, currency, rate, requestTime }, // ✅ requestTime পাঠালাম
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Server error', error: String(err?.message || err) },
      { status: 500 }
    )
  }
}
