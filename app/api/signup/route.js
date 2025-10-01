import dbConnect from "@/db/connect"
import TempUser from "@/models/temp.model"
import { NextResponse } from "next/server"

export async function POST(req) {
  try {
    // ✅ বাংলা কমেন্ট: রিকোয়েস্ট বডি নাও
    const body = await req.json()
    const { name, email, password, referral } = body || {}


    // ✅ বাংলা কমেন্ট: বেসিক ইনপুট ভ্যালিডেশন
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'নাম, ইমেইল ও পাসওয়ার্ড প্রয়োজন।' },
        { status: 400 }
      )
    }

    // ✅ বাংলা কমেন্ট: DB কানেক্ট
    await dbConnect()

    // ✅ বাংলা কমেন্ট: আগেই একই ইমেইল দিয়ে কোনো টেম্প ইউজার থাকলে—clear করে দাও
    const existingTemp = await TempUser.findOne({ email: email.toLowerCase().trim() })
    if (existingTemp) {
      await TempUser.deleteOne({ _id: existingTemp._id })
    }

    // ✅ বাংলা কমেন্ট: নতুন টেম্প ইউজার ক্রিয়েট
    const created = await TempUser.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password, // ⚠️ ডেমো: প্লেইন টেক্সট; প্রোডাকশনে bcrypt দিয়ে হ্যাশ করবেন
      referral: referral?.trim() || null,
    })

    // ✅ বাংলা কমেন্ট: রেসপন্স—ফ্রন্টএন্ডে টোস্ট দেখানোর জন্য চাওয়া ফরম্যাট
    return NextResponse.json(
      {
        success: true, // ✅ স্ট্যাটাস সত্য
        message: 'User clear successfully', // ✅ চাওয়া মেসেজ
        user: {
          _id: created._id.toString(),
          name: created.name,
          email: created.email,
          referral: created.referral,
          createdAt: created.createdAt,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    
    // ❌ বাংলা কমেন্ট: এরর হলে—এরর মেসেজসহ রিটার্ন
    return NextResponse.json(
      {
        success: false,
        message: 'এরর হয়েছে',
        error: error?.message || String(error), // ❌ ইউরোরটা/এররটা পাঠিয়ে দিলাম
      },
      { status: 500 }
    )
  }
}
