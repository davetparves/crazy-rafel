import { NextResponse } from 'next/server'
import Multiplier from '@/models/multiplier.model'
import dbConnect from '../../../../db/connect'

export async function GET() {
  try {
    await dbConnect()

    const docs = await Multiplier.find({}).lean()
    const data = { single: null, double: null, triple: null }

    for (const d of docs) {
      if (d?.name && ['single', 'double', 'triple'].includes(d.name)) {
        data[d.name] = d?.value ?? null
      }
    }

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch multipliers' },
      { status: 500 },
    )
  }
}

