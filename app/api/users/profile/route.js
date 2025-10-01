// /app/api/users/profile/route.js
import dbConnect from '@/db/connect'
import User from '@/models/user.model'
import { NextResponse } from 'next/server'


// VIP থ্রেশোল্ড ⇒ লেভেল ক্যালকুলেটর
function computeVipLevel(txCount = 0) {
  if (txCount >= 2000) return 10
  if (txCount >= 1000) return 9
  if (txCount >= 750) return 8
  if (txCount >= 500) return 7
  if (txCount >= 300) return 6
  if (txCount >= 200) return 5
  if (txCount >= 100) return 4
  if (txCount >= 50) return 3
  if (txCount >= 30) return 2
  if (txCount >= 10) return 1
  return 0
}

export async function POST(req) {
  try {
    const body = await req.json()
    const email = String(body?.email || '').trim().toLowerCase()
    if (!email) {
      return NextResponse.json({ success: false, message: 'ইমেইল দিন' }, { status: 400 })
    }

    await dbConnect()

    // ⚡ aggregate দিয়ে প্রয়োজনীয় ফিল্ড + trx length
    const rows = await User.aggregate([
      { $match: { email } },
      {
        $project: {
          // ব্যক্তিগত সংবেদনশীল ফিল্ড বাদ
          fullName: 1,
          email: 1,
          username: 1,
          referralCode: 1,
          phoneNumber: 1,
          profileImage: 1,
          role: 1,
          gender: 1,
          bio: 1,

          // Wallet
          walletBalance: '$wallet.main', // ✅ FIX: wallet.main -> walletBalance নামে ফেরত

          // Betting stats
          totalBets: 1,
          totalWins: 1,
          totalLosses: 1,
          winRate: 1,
          totalWinAmount: 1,
          totalLossAmount: 1,
          biggestWin: 1,
          biggestLoss: 1,

          // Misc
          isOnline: 1,
          likeCount: 1,
          badges: 1,
          loyaltyPoints: 1,
          vipLevel: 1,
          createdAt: 1,

          transactionsCount: { $size: { $ifNull: ['$transactions', []] } },
        },
      },
      { $limit: 1 },
    ])

    if (!rows?.length) {
      return NextResponse.json({ success: false, message: 'ইউজার পাওয়া যায়নি' }, { status: 404 })
    }

    const doc = rows[0]
    const txCount = Number(doc.transactionsCount || 0)
    const nextVip = computeVipLevel(txCount)

    // VIP পরিবর্তন দরকার হলে আপডেট
    if ((doc.vipLevel || 0) !== nextVip) {
      await User.updateOne({ email }, { $set: { vipLevel: nextVip } })
      doc.vipLevel = nextVip
    }

    const data = {
      ...doc,
      role: String(doc.role || 'user'),
      gender: String(doc.gender || 'prefer_not_to_say'),
    }

    return NextResponse.json({ success: true, message: 'প্রোফাইল ডাটা', data }, { status: 200 })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'সার্ভার ত্রুটি', error: String(err?.message || err) },
      { status: 500 }
    )
  }
}
