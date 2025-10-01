// /app/api/pending-numbers/route.js
import { NextResponse } from 'next/server'
import UserNumberList from '@/models/userNumberList.model'
import dbConnect from '../../../db/connect'

// Ensure Node runtime for Mongoose
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req) {
  try {
    await dbConnect()

    // status: 'pending' -> number অনুযায়ী group
    const rows = await UserNumberList.aggregate([
      { $match: { status: 'pending' } },
      {
        $group: {
          _id: '$number',
          people: { $sum: 1 }, // কয়জন একই number ইউজ করেছে
          amount: { $sum: '$amount' }, // তাদের মোট amount
          prize: { $sum: '$prize' }, // তাদের মোট prize (চাইলে দেখাবেন)
        },
      },
      {
        $project: {
          _id: 0,
          number: '$_id',
          people: 1,
          amount: 1,
          prize: 1,
        },
      },
      { $sort: { people: -1, amount: -1 } },
      { $limit: 500 },
    ])

    return NextResponse.json({ items: rows }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('GET /api/pending-numbers error:', err)
    return NextResponse.json(
      { error: 'Failed to load pending numbers.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
