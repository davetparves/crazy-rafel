// /app/api/multipliers/[id]/route.js
import { NextResponse } from 'next/server'
import dbConnect from '@/db/connect'
import Multiplier from '@/models/multiplier.model'
import mongoose from 'mongoose'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function DELETE(req, { params }) {
  try {
    // 1) id from path param (preferred)
    console.log(req);
    
    let id = params?.id

    // 2) fallback: try query param ?id=...
    if (!id) {
      const { searchParams } = new URL(req.url)
      id = searchParams.get('id')
    }

    if (!id) {
      return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 })
    }

    // optional: decode + trim
    id = decodeURIComponent(String(id)).trim()

    // Validate ObjectId (prevent CastError)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid ObjectId' }, { status: 400 })
    }

    await dbConnect()

    const doc = await Multiplier.findByIdAndDelete(id)
    if (!doc) {
      return NextResponse.json({ success: false, message: 'ডাটা পাওয়া যায়নি' }, { status: 404 })
    }

    return NextResponse.json(
      { success: true, message: 'ডিলিট সম্পন্ন', data: { _id: String(doc._id) } },
      { status: 200 },
    )
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'ডিলিট ব্যর্থ', error: String(err?.message || err) },
      { status: 500 },
    )
  }
}
