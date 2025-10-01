// /app/api/nav-balance-get/route.js
import { NextResponse } from 'next/server'
import dbConnect from '@/db/connect'
import User from '@/models/user.model'
import Notice from '@/models/notice.model'
import IncreaseGrowth from '@/models/increaseGrowth.model'

export async function POST(req) {
  try {
    const body = await req.json()
    const email = body?.email?.toLowerCase()?.trim()

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 })
    }

    await dbConnect()

    const [user, notices, growth] = await Promise.all([
      User.findOne({ email })
        .select('fullName role wallet currency')
        .lean(),
      Notice.find({})
        .sort({ createdAt: -1 }) // latest first
        .select('message createdAt')
        .lean(),
      IncreaseGrowth.findOne({})
        .sort({ createdAt: -1 })
        .select('rate createdAt')
        .lean(),
    ])

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    const bank = user.wallet?.bank || {}
    const payload = {
      success: true,
      data: {
        fullName: user.fullName || 'User',
        role: user.role || 'user',
        wallet: {
          main: user.wallet?.main ?? 0,
          bonus: user.wallet?.bonus ?? 0,
          referral: user.wallet?.referral ?? 0,
          bank: {
            amount: bank?.amount ?? 0,
            requestTime: bank?.requestTime ?? null,
            validTransferTime: bank?.validTransferTime ?? null,
          },
        },
        currency: user.currency || 'BDT',

        // NEW: all notices (latest first)
        notices: Array.isArray(notices) ? notices : [],

        // NEW: growth rate (percentage per 24h)
        growthRate: Number(growth?.rate ?? 0),
      },
    }

    return NextResponse.json(payload)
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Server error', error: err?.message || String(err) },
      { status: 500 }
    )
  }
}
