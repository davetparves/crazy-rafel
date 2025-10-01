import { NextResponse } from 'next/server'
import dbConnect from '@/db/connect'
import Withdraw from '@/models/withdraw.model'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request) {
  try {
    await dbConnect()
    const { email } = await request.json().catch(() => ({}))
    if (!email) {
      return NextResponse.json({ success: false, message: 'Email required' }, { status: 400 })
    }
    const agentEmail = String(email).trim().toLowerCase()

    const docs = await Withdraw.find({ agentEmail })
      .sort({ createdAt: -1 })
      .select('_id userEmail method paymentNumber amount status createdAt')

    const items = docs.map((d) => ({
      id: String(d._id),
      email: d.userEmail, // কার্ডে ইউজারের ইমেইল
      method: d.method,
      phone: d.paymentNumber, // কার্ডের "📞 phone" = paymentNumber
      amount: d.amount,
      status: d.status,
      requestedAt: d.createdAt, // ফ্রন্টএন্ডে ফরম্যাট করবো
    }))

    return NextResponse.json({ success: true, data: items }, { status: 200 })
  } catch (e) {
    return NextResponse.json(
      { success: false, message: 'Failed to load withdraws', error: String(e?.message || e) },
      { status: 500 },
    )
  }
}
