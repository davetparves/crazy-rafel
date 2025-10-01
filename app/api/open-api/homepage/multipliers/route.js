// /app/api/open-api/homepage/multipliers/route.js
import { NextResponse } from 'next/server'
import dbConnect from '@/db/connect'
import Multiplier from '@/models/multiplier.model'

export async function GET() {
  try {
    await dbConnect()
    const docs = await Multiplier.find({ name: { $in: ['single','double','triple'] } })
      .select('name value -_id')
      .lean()

    const out = { single: null, double: null, triple: null }
    for (const d of docs) out[d.name] = Number(d.value)

    return NextResponse.json({ success: true, data: out })
  } catch (err) {
    return NextResponse.json(
      { success:false, message:'Multiplier fetch error', error: err?.message || String(err) },
      { status:500 }
    )
  }
}
