// /app/api/subadmin/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/db/connect";
import User from "@/models/user.model";

// অনুমোদিত রোলগুলোর লিস্ট
const ALLOWED_ROLES = ["user", "admin", "agent"];

export async function POST(req) {
  try {
    // 📨 ফ্রন্টএন্ড থেকে ডাটা নিলাম
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const role  = String(body?.role || "").trim().toLowerCase();

    // ✅ ভ্যালিডেশন
    if (!email || !ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        { success: false, message: "সঠিক ইমেইল ও রোল দিন (user/admin/agent)." },
        { status: 400 }
      );
    }

    await dbConnect();

    // 🔎 ইউজার আছে কিনা
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "এই ইমেইল দিয়ে কোন ইউজার পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    // 🔧 রোল আপডেট
    user.role = role;
    user.updatedAt = Date.now();
    await user.save();

    // ✅ সফল রেসপন্স
    return NextResponse.json(
      {
        success: true,
        message: "রোল আপডেট হয়েছে।",
        data: {
          _id: String(user._id),
          email: user.email,
          role: user.role,
          updatedAt: user.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message: "সার্ভারে সমস্যা হয়েছে।",
        error: String(err?.message || err),
      },
      { status: 500 }
    );
  }
}
