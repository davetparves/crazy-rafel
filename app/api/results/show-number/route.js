import { NextResponse } from 'next/server'
import Result from '@/models/result.model'
import dbConnect from '../../../../db/connect'


// Allowed names (safety)
const NAMES = new Set(['single', 'double', 'triple'])

export async function GET(req) {
  try {
    await dbConnect()

    const { searchParams } = new URL(req.url)
    const name = (searchParams.get('name') || '').toLowerCase().trim()

    if (!NAMES.has(name)) {
      return NextResponse.json({ ok: false, error: 'invalid name' }, { status: 400 })
    }

    // Pick only required fields
    const r = await Result.findOne({ name })
      .select('_id name number time status updatedAt createdAt')
      .lean()

    if (!r) {
      // Graceful empty
      return NextResponse.json({
        ok: true,
        result: { _id: null, name, time: null, status: 'inactive', number: null },
      })
    }

    // 🔒 status gating: active হলে number পাঠাবো, না হলে null
    const number = r.status === 'active' && typeof r.number === 'number' ? r.number : null

    return NextResponse.json({
      ok: true,
      result: {
        _id: r._id,
        name: r.name,
        time: r.time ?? null,
        status: r.status ?? 'inactive',
        number, // gated by status
      },
    })
  } catch (err) {
    console.error('GET /api/results/show-number error:', err)
    return NextResponse.json({ ok: false, error: 'server error' }, { status: 500 })
  }
}
