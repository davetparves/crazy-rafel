// /app/api/users/wallet/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/db/connect";
import User from "@/models/user.model";
import Result from "@/models/result.model"; // ✅ নতুন

/*
  body: { email }
  কাজ:
   - ইমেইল দিয়ে ইউজার খুঁজে walletBalance দেবে
   - Result মডেল থেকে single/double/triple এনে তাদের time/number দেবে
*/
export async function POST(req) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "ইমেইল দিন" },
        { status: 400 }
      );
    }

    await dbConnect();

    const [user, results] = await Promise.all([
      User.findOne({ email }).select("walletBalance").lean(),
      Result.find({ name: { $in: ["single", "double", "triple"] } })
        .select("name time number")
        .lean(),
    ]);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "ইউজার পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    // ফলাফল ম্যাপিং: { single: {time, number}, ... }
    const map = { single: null, double: null, triple: null };
    results.forEach((r) => {
      if (["single", "double", "triple"].includes(r.name)) {
        map[r.name] = { time: r.time || null, number: r.number ?? null };
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: "ওয়ালেট + রেজাল্ট টাইম",
        data: {
          walletBalance: Number(user.walletBalance || 0),
          results: map, // 👈 ফ্রন্টএন্ডে টাইম শো করার জন্য
        },
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message: "সার্ভার ত্রুটি",
        error: String(err?.message || err),
      },
      { status: 500 }
    );
  }
}
