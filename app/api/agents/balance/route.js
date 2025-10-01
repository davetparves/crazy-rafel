// /app/api/agent/balance/route.js
import { NextResponse } from 'next/server'
import dbConnect from '@/db/connect'
import User from '@/models/user.model'

export async function POST(req) {
  try {
    const body = await req.json()
    const email = String(body?.email || '')
      .trim()
      .toLowerCase()

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required.' }, { status: 400 })
    }

    await dbConnect()

    const user = await User.findOne({ email }).select('_id email walletBalance').lean()
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 })
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Balance fetched.',
        data: { walletBalance: Number(user.walletBalance || 0) },
      },
      { status: 200 },
    )
  } catch (err) {

    return NextResponse.json(
      { success: false, message: 'Server error', error: String(err?.message || err) },
      { status: 500 },
    )
  }
}
