// /app/api/users/referrals/route.js
import dbConnect from '@/db/connect'
import User from '@/models/user.model'
import { NextResponse } from 'next/server'


/*
  body: { email }
  - ইমেইল দিয়ে ইউজার খুঁজে বের করবে
  - referralCode + myReferList(populate) নিয়ে আসবে
  - myReferList থেকে প্রত্যেক রেফার্ড ইউজারের {id, name, email, joined} বানিয়ে রিটার্ন করবে
*/

export async function POST(req) {
  try {
    const body = await req.json()
    const email = String(body?.email || '').trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ success: false, message: 'ইমেইল দিন' }, { status: 400 })
    }

    await dbConnect()

    // ইউজার + রেফারাল লিস্ট (populate)
    const user = await User.findOne({ email })
      .select('referralCode myReferList')
      .populate({
        path: 'myReferList',
        select: 'fullName email createdAt',
        options: { sort: { createdAt: -1 } }, // নতুনরা আগে
      })
      .lean()

    if (!user) {
      return NextResponse.json({ success: false, message: 'ইউজার পাওয়া যায়নি' }, { status: 404 })
    }

    const list = Array.isArray(user.myReferList) ? user.myReferList : []
    const referrals = list.map((u) => ({
      id: String(u._id),
      name: u.fullName || (u.email ? u.email.split('@')[0] : 'Unknown'),
      email: u.email || '--',
      joined: u.createdAt, // FE-তে format হবে
    }))

    return NextResponse.json(
      {
        success: true,
        message: 'রেফারেল ডাটা',
        data: {
          referralCode: user.referralCode || '',
          total: referrals.length,
          referrals,
        },
      },
      { status: 200 },
    )
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'সার্ভার ত্রুটি', error: String(err?.message || err) },
      { status: 500 },
    )
  }
}
