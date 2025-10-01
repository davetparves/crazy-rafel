import dbConnect from '@/db/connect'
import User from '@/models/user.model'
import { NextResponse } from 'next/server'


// body: { email }
// response: { balance: user.wallet.main, currency: user.currency }
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

    return NextResponse.json({
      success: true,
      data: {
        balance: Number(user?.wallet?.main || 0),
        currency: user?.currency || 'BDT',
      },
    })
  } catch (e) {
    return NextResponse.json(
      { success: false, message: e?.message || 'Server error' },
      { status: 500 },
    )
  }
}
