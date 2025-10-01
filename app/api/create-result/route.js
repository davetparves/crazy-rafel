import dbConnect from '@/db/connect'
import Result, { ALLOWED_STATUSES } from '@/models/result.model'
import User from '@/models/user.model'
import { NextResponse } from 'next/server'


function parseNumbers(s) {
  const m = /^\s*(\d)-(\d{2})-(\d{3})\s*$/.exec(s || '')
  if (!m) return null
  return { single: Number(m[1]), double: Number(m[2]), triple: Number(m[3]) }
}

// GET: only status=hold
export async function GET() {
  try {
    await dbConnect()
    const results = await Result.find({ status: 'hold' }).sort({ createdAt: -1 }).lean()
    return NextResponse.json({ ok: true, data: results })
  } catch (err) {
    return NextResponse.json({ ok: false, message: err?.message || 'GET failed' }, { status: 500 })
  }
}

// POST: create (admin only)
export async function POST(req) {
  try {
    await dbConnect()
    const { email, numbers, status } = await req.json()

    if (!email || !numbers) {
      return NextResponse.json({ ok: false, message: 'email and numbers are required' }, { status: 400 })
    }

    const user = await User.findOne({ email }).lean()
    if (!user) return NextResponse.json({ ok: false, message: 'User not found' }, { status: 404 })
    if (user.role !== 'admin') return NextResponse.json({ ok: false, message: 'You are a user' }, { status: 403 })

    const parsed = parseNumbers(numbers)
    if (!parsed) {
      return NextResponse.json({ ok: false, message: 'Invalid numbers format. Use S-DD-TTT e.g. 5-48-957' }, { status: 400 })
    }

    const doc = await Result.create({
      numbers: parsed,
      status: ALLOWED_STATUSES.includes(status) ? status : 'hold',
    })

    return NextResponse.json({ ok: true, message: 'Data upload successful', data: doc })
  } catch (err) {
    return NextResponse.json({ ok: false, message: err?.message || 'POST failed' }, { status: 500 })
  }
}

// PATCH: update by id (admin only)
export async function PATCH(req) {
  try {
    await dbConnect()
    const { email, id, numbers, status } = await req.json()

    if (!email || !id || !numbers) {
      return NextResponse.json({ ok: false, message: 'email, id and numbers are required' }, { status: 400 })
    }

    const user = await User.findOne({ email }).lean()
    if (!user) return NextResponse.json({ ok: false, message: 'User not found' }, { status: 404 })
    if (user.role !== 'admin') return NextResponse.json({ ok: false, message: 'You are a user' }, { status: 403 })

    const parsed = parseNumbers(numbers)
    if (!parsed) {
      return NextResponse.json({ ok: false, message: 'Invalid numbers format. Use S-DD-TTT e.g. 5-48-957' }, { status: 400 })
    }

    const update = {
      numbers: parsed,
    }
    if (status && ALLOWED_STATUSES.includes(status)) {
      update.status = status
    }

    const doc = await Result.findByIdAndUpdate(id, update, { new: true })
    if (!doc) return NextResponse.json({ ok: false, message: 'Result not found' }, { status: 404 })

    return NextResponse.json({ ok: true, message: 'Data updated successfully', data: doc })
  } catch (err) {
    return NextResponse.json({ ok: false, message: err?.message || 'PATCH failed' }, { status: 500 })
  }
}

// DELETE: delete by id (admin only) — optional
export async function DELETE(req) {
  try {
    await dbConnect()
    const { email, id } = await req.json()
    if (!email || !id) {
      return NextResponse.json({ ok: false, message: 'email and id are required' }, { status: 400 })
    }

    const user = await User.findOne({ email }).lean()
    if (!user) return NextResponse.json({ ok: false, message: 'User not found' }, { status: 404 })
    if (user.role !== 'admin') return NextResponse.json({ ok: false, message: 'You are a user' }, { status: 403 })

    const doc = await Result.findByIdAndDelete(id)
    if (!doc) return NextResponse.json({ ok: false, message: 'Result not found' }, { status: 404 })

    return NextResponse.json({ ok: true, message: 'Deleted successfully' })
  } catch (err) {
    return NextResponse.json({ ok: false, message: err?.message || 'DELETE failed' }, { status: 500 })
  }
}
