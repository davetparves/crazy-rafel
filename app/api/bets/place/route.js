// /app/api/bets/place/route.js
import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/db/connect'
import User from '@/models/user.model'
import UserNumberList from '@/models/userNumberList.model'
import Multiplier from '@/models/multiplier.model' // ✅ DB multipliers

// ✅ সেফ ফলব্যাক (DB-তে না পেলে)
const DEFAULT_MULTIPLIERS = { single: 9, double: 90, triple: 900 }

// ✅ DB থেকে multipliers লোড: single/double/triple ডকে name/value হিসেবে থাকে
async function getMultipliersSafe() {
  try {
    await dbConnect()
    const rows = await Multiplier.find({
      name: { $in: ['single', 'double', 'triple'] },
    })
      .select('name value')
      .lean()

    // ডিফল্ট দিয়ে শুরু করে উপস্থিতগুলো ওভাররাইড করি
    const map = { ...DEFAULT_MULTIPLIERS }
    for (const r of rows || []) {
      const k = String(r?.name || '').toLowerCase()
      if (k === 'single' || k === 'double' || k === 'triple') {
        const v = Number(r?.value)
        if (Number.isFinite(v) && v >= 0) map[k] = v
      }
    }
    return map
  } catch {
    // কোনো কারণে ব্যর্থ হলে ডিফল্ট রিটার্ন
    return DEFAULT_MULTIPLIERS
  }
}

function betTypeFromNumber(n) {
  const s = String(n ?? '')
  if (/^\d{1}$/.test(s)) return 'single'
  if (/^\d{2}$/.test(s)) return 'double'
  if (/^\d{3}$/.test(s)) return 'triple'
  return null
}

export async function POST(req) {
  try {
    const body = await req.json()
    const email = String(body?.email || '')
      .trim()
      .toLowerCase()
    const number = Number(body?.number)
    const amount = Number(body?.amount)

    if (!email || !Number.isFinite(number) || !Number.isFinite(amount)) {
      return NextResponse.json(
        { success: false, message: 'ইমেইল, নাম্বার ও এমাউন্ট দিন।' },
        { status: 400 },
      )
    }
    if (amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'এমাউন্ট পজিটিভ হতে হবে।' },
        { status: 400 },
      )
    }
    if (number < 0 || number > 999) {
      return NextResponse.json(
        { success: false, message: 'নাম্বার 0–999 এর মধ্যে হতে হবে।' },
        { status: 400 },
      )
    }

    const betType = betTypeFromNumber(number)
    if (!betType) {
      return NextResponse.json(
        { success: false, message: 'number invalid — 1/2/3 digit দিন।' },
        { status: 400 },
      )
    }

    await dbConnect()

    // ইউজার
    const user = await User.findOne({ email }).select('_id walletBalance').lean()
    if (!user) {
      return NextResponse.json({ success: false, message: 'ইউজার পাওয়া যায়নি।' }, { status: 404 })
    }

    const wallet = Number(user.walletBalance || 0)
    if (wallet < amount) {
      return NextResponse.json(
        { success: false, message: 'Balance insufficient.' },
        { status: 400 },
      )
    }

    // ✅ DB থেকে multipliers আনছি
    const multipliers = await getMultipliersSafe()
    const mul = multipliers[betType] ?? 0
    const prize = Math.max(0, Math.floor(amount * mul)) // জেতার সম্ভাব্য প্রাইজ (সেভও হবে)

    // 🔐 Transaction (atomic)
    const session = await mongoose.startSession()
    try {
      let newWallet = wallet

      await session.withTransaction(async () => {
        // 1) বেট সেভ — prize সহ
        await UserNumberList.create([{ userId: user._id, betType, number, amount, prize }], {
          session,
        })

        // 2) ওয়ালেট থেকে কাট + totalBets++
        const upd = await User.findOneAndUpdate(
          { _id: user._id, walletBalance: { $gte: amount } },
          { $inc: { walletBalance: -amount, totalBets: 1 } },
          { new: true, session, projection: 'walletBalance totalBets' },
        )
        if (!upd) throw new Error('Balance insufficient.')

        newWallet = Number(upd.walletBalance || 0)
      })

      return NextResponse.json(
        {
          success: true,
          message: 'Betting is successful ✅',
          data: { walletBalance: newWallet, betType, prize, multiplier: mul },
        },
        { status: 200 },
      )
    } finally {
      await session.endSession()
    }
  } catch (err) {
    const msg = String(err?.message || err)
    const status = /insufficient/i.test(msg) ? 400 : 500
    return NextResponse.json(
      {
        success: false,
        message: status === 400 ? 'Balance insufficient.' : 'Server error',
        error: msg,
      },
      { status },
    )
  }
}
