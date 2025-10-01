import { NextResponse } from 'next/server'
import dbConnect from '@/db/connect'
import Result, { ALLOWED_NAMES, ALLOWED_STATUSES } from '@/models/result.model'
import ResultList from '@/models/resultList.model'

// GET: সব ফলাফল
export async function GET() {
  try {
    await dbConnect()
    const docs = await Result.find({}).sort({ createdAt: -1 }).lean()
    return NextResponse.json({ success:true, data:docs }, { status:200 })
  } catch (err) {
    return NextResponse.json({ success:false, message:'GET failed', error:String(err?.message||err) }, { status:500 })
  }
}

// POST: create OR move to history (action=history)
export async function POST(req) {
  try {
    const body = await req.json()
    const action = String(body?.action || '').trim().toLowerCase()

    await dbConnect()

    // move to history: { action:'history', name }
    if (action === 'history') {
      const name = String(body?.name || '').trim().toLowerCase()
      if (!ALLOWED_NAMES.includes(name)) {
        return NextResponse.json({ success:false, message:'Invalid name' }, { status:400 })
      }

      // find current result
      const doc = await Result.findOne({ name }).lean()
      if (!doc) {
        return NextResponse.json({ success:false, message:'কোনো ডেটা পাওয়া যায়নি।' }, { status:404 })
      }

      // insert into history list (status forced to 'history')
      const created = await ResultList.create({
        name: doc.name,
        number: doc.number,
        time: doc.time,
        status: 'history',
      })

      // delete original
      await Result.deleteOne({ _id: doc._id })

      return NextResponse.json({
        success:true,
        message:'Moved to history',
        data:{ _id:String(created._id), name:created.name, number:created.number, time:created.time, status:created.status }
      }, { status:201 })
    }

    // normal create: { name, number, time }
    const name = String(body?.name || '').trim().toLowerCase()
    const number = Number(body?.number)
    const time = String(body?.time || '').trim()

    if (!ALLOWED_NAMES.includes(name)) {
      return NextResponse.json({ success:false, message:'Invalid name. Use single/double/triple.' }, { status:400 })
    }
    if (!Number.isFinite(number)) {
      return NextResponse.json({ success:false, message:'Number is required.' }, { status:400 })
    }
    if (!time) {
      return NextResponse.json({ success:false, message:'Time is required.' }, { status:400 })
    }

    // unique name guard
    const exists = await Result.findOne({ name }).lean()
    if (exists) {
      return NextResponse.json({ success:false, message:'এই নামে রেজাল্ট আগেই আছে।', data:exists }, { status:409 })
    }

    const doc = await Result.create({ name, number, time /* status defaults to 'timing' */ })

    return NextResponse.json({
      success:true,
      message:'রেজাল্ট তৈরি হয়েছে।',
      data:{ _id:String(doc._id), name:doc.name, number:doc.number, time:doc.time, status:doc.status, createdAt:doc.createdAt }
    }, { status:201 })
  } catch (err) {
    return NextResponse.json({ success:false, message:'POST failed', error:String(err?.message||err) }, { status:500 })
  }
}

// PATCH: update status only
export async function PATCH(req) {
  try {
    const body = await req.json()
    const name = String(body?.name || '').trim().toLowerCase()
    const status = String(body?.status || '').trim().toLowerCase()

    if (!ALLOWED_NAMES.includes(name)) {
      return NextResponse.json({ success:false, message:'Invalid name' }, { status:400 })
    }
    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ success:false, message:'Invalid status' }, { status:400 })
    }

    await dbConnect()
    const updated = await Result.findOneAndUpdate({ name }, { $set:{ status } }, { new:true }).lean()
    if (!updated) {
      return NextResponse.json({ success:false, message:'কোনো ডেটা পাওয়া যায়নি।' }, { status:404 })
    }

    return NextResponse.json({ success:true, message:'Status updated', data:updated }, { status:200 })
  } catch (err) {
    return NextResponse.json({ success:false, message:'PATCH failed', error:String(err?.message||err) }, { status:500 })
  }
}

// DELETE: { name }
export async function DELETE(req) {
  try {
    const isJson = req.headers.get('content-type')?.includes('application/json')
    const payload = isJson ? await req.json() : null
    const url = new URL(req.url)
    const qName = url.searchParams.get('name')
    const name = String(payload?.name || qName || '').trim().toLowerCase()

    if (!ALLOWED_NAMES.includes(name)) {
      return NextResponse.json({ success:false, message:'Invalid name. Use single/double/triple.' }, { status:400 })
    }

    await dbConnect()
    const deleted = await Result.findOneAndDelete({ name })
    if (!deleted) {
      return NextResponse.json({ success:false, message:'কোনো ডেটা পাওয়া যায়নি।' }, { status:404 })
    }
    return NextResponse.json({ success:true, message:'ডিলিট সম্পন্ন হয়েছে।' }, { status:200 })
  } catch (err) {
    return NextResponse.json({ success:false, message:'DELETE failed', error:String(err?.message||err) }, { status:500 })
  }
}
