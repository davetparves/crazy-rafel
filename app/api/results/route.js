// /app/api/results/route.js
import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/db/connect'

// Models
import Result, { ALLOWED_PERIODS, ALLOWED_STATUSES } from '@/models/result.model'
import ResultList from '@/models/resultList.model'
import User from '@/models/user.model'
import UserNumberList from '@/models/userNumberList.model'
import Transaction from '@/models/transaction.model'

// ------- utils -------
function toPeriod(v) {
  return String(v || '')
    .trim()
    .toLowerCase()
}
function okDigitsSingle(v) {
  return /^\d{1}$/.test(String(v ?? ''))
}
function okDigitsDouble(v) {
  return /^\d{2}$/.test(String(v ?? ''))
}
function okDigitsTriple(v) {
  return /^\d{3}$/.test(String(v ?? ''))
}
function sanitizeNumbers(input) {
  const s = String(input?.single ?? '').replace(/\D/g, '')
  const d = String(input?.double ?? '').replace(/\D/g, '')
  const t = String(input?.triple ?? '').replace(/\D/g, '')
  return {
    single: s.slice(0, 1),
    double: d.slice(0, 2),
    triple: t.slice(0, 3),
  }
}

// ===== GET: সব বর্তমান ফলাফল =====
export async function GET() {
  try {
    await dbConnect()
    const docs = await Result.find({}).sort({ createdAt: -1 }).lean()
    return NextResponse.json({ success: true, data: docs }, { status: 200 })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'GET failed', error: String(err?.message || err) },
      { status: 500 },
    )
  }
}

// ===== POST: create OR move to history (action=history + settlement) =====
export async function POST(req) {
  try {
    const body = await req.json()
    const action = String(body?.action || '')
      .trim()
      .toLowerCase()

    await dbConnect()

    // ---- move to history + settlement ----
    // payload: { action:'history', period }
    if (action === 'history') {
      const period = toPeriod(body?.period)
      if (!ALLOWED_PERIODS.includes(period)) {
        return NextResponse.json({ success: false, message: 'Invalid period' }, { status: 400 })
      }

      // আজকের রেজাল্ট বের করি
      const doc = await Result.findOne({ period }).lean()
      if (!doc) {
        return NextResponse.json(
          { success: false, message: 'কোনো ডেটা পাওয়া যায়নি।' },
          { status: 404 },
        )
      }

      // জেতা নাম্বার সেট
      const winning = {
        single: Number(doc?.numbers?.single ?? 0),
        double: Number(doc?.numbers?.double ?? 0),
        triple: Number(doc?.numbers?.triple ?? 0),
      }

      // pending bets
      const pendingBets = await UserNumberList.find({ status: 'pending' }).lean()

      let wins = 0
      let losses = 0

      // সব অপারেশন এক ট্রানজ্যাকশনে
      const session = await mongoose.startSession()
      try {
        await session.withTransaction(async () => {
          // প্রতিটি বেট সেটেল
          for (const bet of pendingBets) {
            const { _id: betId, userId, betType, number, prize } = bet

            // betType অনুযায়ী winning number
            const winNum =
              betType === 'single'
                ? winning.single
                : betType === 'double'
                ? winning.double
                : winning.triple

            const isWin = Number(number) === Number(winNum)

            if (isWin) {
              wins += 1

              // ইউজারের ব্যালেন্সে prize যোগ + totalWins++
              await User.findByIdAndUpdate(
                userId,
                { $inc: { walletBalance: Number(prize) || 0, totalWins: 1 } },
                { session },
              )

              // Transaction create (amount = prize)
              const [tx] = await Transaction.create([{ userId, amount: Number(prize) || 0 }], {
                session,
              })

              // ইউজারের transactions এ ট্রানজেকশন আইডি পুশ
              await User.updateOne(
                { _id: userId },
                { $push: { transactions: tx._id } },
                { session },
              )

              // বেট আপডেট -> win
              await UserNumberList.updateOne(
                { _id: betId },
                { $set: { status: 'win' } },
                { session },
              )
            } else {
              losses += 1

              // totalLosses++
              await User.updateOne({ _id: userId }, { $inc: { totalLosses: 1 } }, { session })

              // বেট আপডেট -> loss
              await UserNumberList.updateOne(
                { _id: betId },
                { $set: { status: 'loss' } },
                { session },
              )
            }
          }

          // History-তে কপি (ResultList) — নোট: schema-তে singular: number
          await ResultList.create(
            [
              {
                period: doc.period,
                number: winning,
                time: doc.time,
                status: 'history',
              },
            ],
            { session },
          )

          // লাইভ Result ডিলিট
          await Result.deleteOne({ _id: doc._id }, { session })
        })
      } finally {
        await session.endSession()
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Settlement done & moved to history',
          data: {
            period: doc.period,
            number: winning,
            time: doc.time,
            wins,
            losses,
          },
        },
        { status: 201 },
      )
    }

    // ---- normal create ----
    // payload: { period, numbers:{single,double,triple}, time }
    const period = toPeriod(body?.period)
    const time = String(body?.time || '').trim()
    const rawNumbers = sanitizeNumbers(body?.numbers)

    if (!ALLOWED_PERIODS.includes(period)) {
      return NextResponse.json(
        { success: false, message: "Invalid period. Use 'morning'/'noon'/'night'." },
        { status: 400 },
      )
    }
    if (!okDigitsSingle(rawNumbers.single)) {
      return NextResponse.json(
        { success: false, message: 'Single: ১ ডিজিট (0-9)' },
        { status: 400 },
      )
    }
    if (!okDigitsDouble(rawNumbers.double)) {
      return NextResponse.json(
        { success: false, message: 'Double: ২ ডিজিট (00-99)' },
        { status: 400 },
      )
    }
    if (!okDigitsTriple(rawNumbers.triple)) {
      return NextResponse.json(
        { success: false, message: 'Triple: ৩ ডিজিট (000-999)' },
        { status: 400 },
      )
    }
    if (!time) {
      return NextResponse.json({ success: false, message: 'Time is required.' }, { status: 400 })
    }

    // unique period guard
    const exists = await Result.findOne({ period }).lean()
    if (exists) {
      return NextResponse.json(
        { success: false, message: 'এই period-এ রেজাল্ট আগেই আছে।', data: exists },
        { status: 409 },
      )
    }

    const doc = await Result.create({
      period,
      numbers: {
        single: Number(rawNumbers.single),
        double: Number(rawNumbers.double),
        triple: Number(rawNumbers.triple),
      },
      time, // status defaults to 'timing'
    })

    return NextResponse.json(
      {
        success: true,
        message: 'রেজাল্ট তৈরি হয়েছে।',
        data: {
          _id: String(doc._id),
          period: doc.period,
          numbers: doc.numbers,
          time: doc.time,
          status: doc.status,
          createdAt: doc.createdAt,
        },
      },
      { status: 201 },
    )
  } catch (err) {
    console.log('[POST /api/results] error:', err)
    return NextResponse.json(
      { success: false, message: 'POST failed', error: String(err?.message || err) },
      { status: 500 },
    )
  }
}

// ===== PATCH: update status only =====
// payload: { period, status }
export async function PATCH(req) {
  try {
    const body = await req.json()
    const period = toPeriod(body?.period)
    const status = String(body?.status || '')
      .trim()
      .toLowerCase()

    if (!ALLOWED_PERIODS.includes(period)) {
      return NextResponse.json({ success: false, message: 'Invalid period' }, { status: 400 })
    }
    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 })
    }

    await dbConnect()
    const updated = await Result.findOneAndUpdate(
      { period },
      { $set: { status } },
      { new: true },
    ).lean()

    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'কোনো ডেটা পাওয়া যায়নি।' },
        { status: 404 },
      )
    }

    return NextResponse.json(
      { success: true, message: 'Status updated', data: updated },
      { status: 200 },
    )
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'PATCH failed', error: String(err?.message || err) },
      { status: 500 },
    )
  }
}

// ===== DELETE: { period } =====
export async function DELETE(req) {
  try {
    const isJson = req.headers.get('content-type')?.includes('application/json')
    const payload = isJson ? await req.json() : null
    const url = new URL(req.url)
    const q = url.searchParams.get('period')
    const period = toPeriod(payload?.period || q)

    if (!ALLOWED_PERIODS.includes(period)) {
      return NextResponse.json(
        { success: false, message: "Invalid period. Use 'morning'/'noon'/'night'." },
        { status: 400 },
      )
    }

    await dbConnect()
    const deleted = await Result.findOneAndDelete({ period })
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'কোনো ডেটা পাওয়া যায়নি।' },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, message: 'ডিলিট সম্পন্ন হয়েছে।' }, { status: 200 })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'DELETE failed', error: String(err?.message || err) },
      { status: 500 },
    )
  }
}
