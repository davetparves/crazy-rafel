// /app/api/open-api/topbar/user-data-post-api/route.js
import { NextResponse } from 'next/server'
import dbConnect from '@/db/connect'
import User from '@/models/user.model'

export async function POST(req) {
  try {
    const body = await req.json()
    const email = body?.email?.toLowerCase()?.trim()
    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 })
    }

    await dbConnect()
    const user = await User.findOne({ email })
      .select('fullName role wallet currency')
      .lean()

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        fullName: user.fullName || 'User',
        role: user.role || 'user',
        currency: user.currency || 'BDT',
        wallet: {
          main: Number(user.wallet?.main ?? 0),
          bonus: Number(user.wallet?.bonus ?? 0),
          referral: Number(user.wallet?.referral ?? 0),
        },
      },
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Server error', error: err?.message || String(err) },
      { status: 500 }
    )
  }
}
