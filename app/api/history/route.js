// /app/api/history/route.js
import { NextResponse } from 'next/server'
import dbConnect from '@/db/connect'
import User from '@/models/user.model'
import ResultList from '@/models/resultList.model'
import UserNumberList from '@/models/userNumberList.model'

export async function POST(req) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Valid email is required' },
        { status: 400 },
      )
    }

    await dbConnect()

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('_id email')
      .lean()

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    // Latest 10 results (global results history)
    const results = await ResultList.find({}).sort({ createdAt: -1 }).limit(10).lean()

    // User's own bets (latest first)
    const bets = await UserNumberList.find({ userId: user._id }).sort({ createdAt: -1 }).lean()

    return NextResponse.json(
      {
        success: true,
        data: { results, bets },
      },
      { status: 200 },
    )
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to load history',
        error: String(err?.message || err),
      },
      { status: 500 },
    )
  }
}
