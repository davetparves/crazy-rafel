// /app/api/agents/links/route.js
import { NextResponse } from 'next/server'
import dbConnect from '@/db/connect'
import User from '@/models/user.model'

const ALLOWED_TITLES = ['whatsapp', 'telegram']

export async function POST(req) {
  try {
    const body = await req.json()
    const email = String(body?.email || '')
      .trim()
      .toLowerCase()
    const rawTitle = String(body?.title || '')
      .trim()
      .toLowerCase()
    const link = String(body?.link || '').trim()

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email required' }, { status: 400 })
    }
    if (!ALLOWED_TITLES.includes(rawTitle)) {
      return NextResponse.json({ success: false, message: 'Invalid title' }, { status: 400 })
    }
    if (!/^https?:\/\//i.test(link)) {
      return NextResponse.json({ success: false, message: 'Invalid URL' }, { status: 400 })
    }

    await dbConnect()

    const user = await User.findOne({ email }).select('_id link').lean()
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    // 1) Try update existing link with same title
    const upd = await User.updateOne(
      { _id: user._id, 'link.title': rawTitle },
      { $set: { 'link.$.link': link } },
    )

    // 2) If not updated (no matching title), push new entry
    if (!upd?.modifiedCount) {
      await User.updateOne({ _id: user._id }, { $push: { link: { title: rawTitle, link } } })
    }

    // Optional: return current links snapshot
    const updated = await User.findById(user._id).select('link').lean()

    return NextResponse.json(
      {
        success: true,
        message: upd?.modifiedCount ? 'Link updated ✅' : 'Link added ✅',
        data: { link: updated?.link || [] },
      },
      { status: 200 },
    )
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Server error', error: String(err?.message || err) },
      { status: 500 },
    )
  }
}
