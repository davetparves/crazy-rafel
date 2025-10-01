// /app/api/open-api/homepage/balance-by-email/route.js
import { NextResponse } from 'next/server'
import dbConnect from '@/db/connect'
import User from '@/models/user.model'


export async function POST(req) {
  try {
    const body = await req.json()
    const email = String(body?.email || '').trim().toLowerCase()
    if (!email) {
      return NextResponse.json({ success:false, message:'ইমেইল প্রয়োজন' }, { status:400 })
    }
    await dbConnect()
    const user = await User.findOne({ email }).select('wallet.main currency').lean()
    if (!user) {
      return NextResponse.json({ success:false, message:'User পাওয়া যায়নি' }, { status:404 })
    }
    return NextResponse.json({
      success: true,
      data: {
        balance: Number(user.wallet?.main ?? 0),
        currency: String(user.currency || 'BDT'),
      },
    })
  } catch (err) {
    return NextResponse.json(
      { success:false, message:'Server error', error: err?.message || String(err) },
      { status:500 }
    )
  }
}
