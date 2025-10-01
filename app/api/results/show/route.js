import { NextResponse } from 'next/server'
import Result from '@/models/result.model'
import dbConnect from '@/db/connect'

const ORDER = ['single', 'double', 'triple']

export async function GET() {
  try {
    await dbConnect()
    const rows = await Result.find({})
      .select('_id name time status updatedAt createdAt') // number intentionally excluded
      .lean()

    const byName = Object.create(null)
    for (const r of rows) if (r?.name) byName[r.name] = r

    const results = ORDER.map((name) => {
      const r = byName[name]
      if (!r) return { _id: null, name, time: null, status: 'inactive' }
      return { _id: r._id, name: r.name, time: r.time ?? null, status: r.status ?? 'inactive' }
    })

    return NextResponse.json(
      { ok: true, results },
      {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' },
      },
    )
  } catch (err) {
    console.error('GET /api/results/show error:', err)
    return NextResponse.json({ ok: false, error: 'server error' }, { status: 500 })
  }
}
