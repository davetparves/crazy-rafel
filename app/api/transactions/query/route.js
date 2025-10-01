// /app/api/transactions/query/route.js
import { NextResponse } from 'next/server'
import User from '@/models/user.model'
import Transaction from '@/models/transaction.model'
import dbConnect from '../../../../db/connect'

// Asia/Dhaka (UTC+6) helpers
const BD_OFFSET_MIN = 6 * 60
const MS = 1000

function bdDayWindow(daysAgoStart, daysAgoEnd) {
  const now = new Date()
  const offsetMs = BD_OFFSET_MIN * 60 * MS
  const bdNowMs = now.getTime() + offsetMs
  const bdNow = new Date(bdNowMs)
  const y = bdNow.getUTCFullYear()
  const m = bdNow.getUTCMonth()
  const d = bdNow.getUTCDate()
  const startUtcMs = Date.UTC(y, m, d - Math.abs(daysAgoStart), 0, 0, 0, 0) - offsetMs
  const endUtcMs = Date.UTC(y, m, d - Math.abs(daysAgoEnd), 23, 59, 59, 999) - offsetMs
  return { start: new Date(startUtcMs), end: new Date(endUtcMs) }
}

function rangeToWindow(range) {
  switch ((range || '').toLowerCase()) {
    case 'today':
      return bdDayWindow(0, 0)
    case 'yesterday':
      return bdDayWindow(1, 1)
    case 'last7':
      return bdDayWindow(6, 0)
    case 'last30':
      return bdDayWindow(29, 0)
    case 'all':
    default:
      return null
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const email = (body?.email || '').trim().toLowerCase()
    const range = body?.range || 'today'

    if (!email) {
      return NextResponse.json({ ok: false, error: 'email is required' }, { status: 400 })
    }

    await dbConnect()

    // Pull the user's transaction IDs; we will fetch Transaction docs by those IDs
    const user = await User.findOne({ email })
      .select('_id email fullName transactions.transactionId')
      .lean()

    if (!user) {
      return NextResponse.json({ ok: false, error: 'user not found' }, { status: 404 })
    }

    const ids = (user.transactions || []).map((t) => t?.transactionId).filter(Boolean)

    if (ids.length === 0) {
      return NextResponse.json({
        ok: true,
        user: { _id: user._id, email: user.email },
        range,
        period: null,
        summary: { count: 0, totalAmount: 0, wins: 0, losses: 0, pending: 0 },
        transactions: [],
      })
    }

    const window = rangeToWindow(range)
    const query = { _id: { $in: ids } }
    if (window) query.createdAt = { $gte: window.start, $lte: window.end }

    // Fetch the actual transaction docs
    const transactions = await Transaction.find(query).sort({ createdAt: -1 }).lean()

    const summary = {
      count: transactions.length,
      totalAmount: transactions.reduce((a, t) => a + (t.amount || t.totalAmount || 0), 0),
      wins: transactions.filter((t) => t.result === 'win').length,
      losses: transactions.filter((t) => t.result === 'loss').length,
      pending: transactions.filter((t) => !t.result || t.result === 'pending').length,
    }

    return NextResponse.json({
      ok: true,
      user: { _id: user._id, email: user.email, fullName: user.fullName },
      range,
      period: window ? { start: window.start, end: window.end } : null,
      summary,
      transactions,
    })
  } catch (err) {
    console.error('POST /api/transactions/query error:', err)
    return NextResponse.json({ ok: false, error: 'server error' }, { status: 500 })
  }
}
