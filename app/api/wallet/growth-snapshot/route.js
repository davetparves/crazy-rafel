// /app/api/wallet/growth-snapshot/route.js
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

    // Latest day-rate from IncreaseGrowth
    const growth = await IncreaseGrowth.findOne({}).sort({ createdAt: -1 }).lean()
    const rate = Number(growth?.rate ?? 0) // % per 24h

    // User bank snapshot
    const user = await User.findOne({ email }).select('wallet.currency wallet.bank currency').lean()
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    const bank = user?.wallet?.bank || {}
    const amount = Number(bank?.amount || 0)
    const requestTime = bank?.requestTime || null
    const validTransferTime = bank?.validTransferTime || null
    const currency = String(user?.currency || 'BDT')

    return NextResponse.json({
      success: true,
      data: {
        rate,
        currency,
        bank: { amount, requestTime, validTransferTime },
      },
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Server error', error: String(err?.message || err) },
      { status: 500 }
    )
  }
}
