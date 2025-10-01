// /app/api/send-otp/route.js
import dbConnect from '@/db/connect'
import { sendOtpMail } from '@/mail/mailer'
import TempUser from '@/models/temp.model'
import { NextResponse } from 'next/server'

const TTL_MIN = 10
const genOtp = () => String(Math.floor(Math.random() * 10000)).padStart(4, '0')

export async function POST(req) {
  try {
    const body = await req.json()
    const email = body?.email?.toLowerCase()?.trim()
    if (!email) {
      return NextResponse.json({ success: false, message: 'ইমেইল প্রয়োজন' }, { status: 400 })
    }

    await dbConnect()

    // ✅ টেম্প ইউজার খুঁজুন
    const doc = await TempUser.findOne({ email })
    if (!doc) {
      return NextResponse.json(
        { success: false, message: 'এই ইমেইলে কোনো টেম্প ইউজার পাওয়া যায়নি।' },
        { status: 500 }
      )
    }

    // ✅ OTP এক্সপায়ার চেক
    const now = Date.now()
    const expMs = doc.otpExpiresAt ? new Date(doc.otpExpiresAt).getTime() : 0
    const isExpired = !expMs || expMs <= now

    let otpToSend = doc.otp
    let expiresAt = doc.otpExpiresAt

    if (isExpired) {
      // 🔄 নতুন OTP জেনারেট + 10 মিনিট মেয়াদ
      otpToSend = genOtp()
      expiresAt = new Date(now + TTL_MIN * 60 * 1000)

      await TempUser.updateOne(
        { _id: doc._id },
        { $set: { otp: otpToSend, otpExpiresAt: expiresAt } }
      )
    }

    // 📧 মেইল পাঠান (নতুন/পুরোনো—যেটা প্রযোজ্য)
    try {
      const res = await sendOtpMail({ to: email, otp: otpToSend })
      const sentOk = !!res?.ok
      if (!sentOk) {
        return NextResponse.json(
          { success: false, message: 'OTP পাঠাতে ব্যর্থ হয়েছে। পরে আবার চেষ্টা করুন।' },
          { status: 500 }
        )
      }
    } catch (e) {
      return NextResponse.json(
        { success: false, message: 'OTP পাঠাতে ব্যর্থ হয়েছে।', error: e?.message || String(e) },
        { status: 500 }
      )
    }

    // ✅ সফল রেসপন্স
    return NextResponse.json(
      {
        success: true,
        message: isExpired ? 'নতুন OTP পাঠানো হয়েছে' : 'আগের OTP পুনরায় পাঠানো হয়েছে',
        email,
        expiresAt, // ক্লায়েন্ট চাইলে অবশিষ্ট সময় দেখাতে পারবে
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'এরর হয়েছে', error: error?.message || String(error) },
      { status: 500 }
    )
  }
}
