// /app/api/multipliers/update/route.js
import { NextResponse } from 'next/server'
import dbConnect from '@/db/connect'
import Multiplier from '@/models/multiplier.model'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function PATCH(request) {
  try {
    await dbConnect()

    const body = await request.json().catch(() => ({}))
    let { name, value } = body || {}

    // basic sanitize
    if (typeof name !== 'string') name = ''
    name = name.trim().toLowerCase()

    if (!['single', 'double', 'triple'].includes(name)) {
      return NextResponse.json({ success: false, message: 'Invalid name' }, { status: 400 })
    }
    value = Number(value)
    if (!Number.isFinite(value) || value < 0) {
      return NextResponse.json({ success: false, message: 'Invalid value' }, { status: 400 })
    }

    // upsert: থাকলে update, না থাকলে create
    const doc = await Multiplier.findOneAndUpdate(
      { name },
      { $set: { value } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )

    return NextResponse.json(
      {
        success: true,
        message: 'আপডেট সম্পন্ন',
        data: { _id: String(doc._id), name: doc.name, value: doc.value },
      },
      { status: 200 },
    )
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'আপডেট ব্যর্থ', error: String(err?.message || err) },
      { status: 500 },
    )
  }
}
