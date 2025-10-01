// /app/api/multipliers/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/db/connect";
import Multiplier from "@/models/multiplier.model";

/*
  GET  → সব মাল্টিপ্লায়ার (single/double/triple যেগুলো আছে) রিটার্ন করবে
  POST → { name, value } রিসিভ করে নতুন এন্ট্রি তৈরি করবে (ইউনিক নাম হলে তবেই);
          আগে থাকলে 409 রিটার্ন।
*/

export async function GET() {
  try {
    await dbConnect();
    const docs = await Multiplier.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: docs }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "লোড করা যায়নি", error: String(err?.message || err) },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const name = String(body?.name || "").trim().toLowerCase();
    const value = Number(body?.value);

    if (!["single", "double", "triple"].includes(name)) {
      return NextResponse.json(
        { success: false, message: "নাম single/double/triple হতে হবে।" },
        { status: 400 }
      );
    }
    if (!Number.isFinite(value) || value < 0) {
      return NextResponse.json(
        { success: false, message: "সঠিক মান (সংখ্যা) দিন।" },
        { status: 400 }
      );
    }

    await dbConnect();

    // আগে আছে কি না চেক
    const exists = await Multiplier.findOne({ name }).lean();
    if (exists) {
      return NextResponse.json(
        { success: false, message: "এই নামের ডাটা আগেই আছে।" },
        { status: 409 }
      );
    }

    const doc = await Multiplier.create({ name, value });

    return NextResponse.json(
      {
        success: true,
        message: "মাল্টিপ্লায়ার তৈরি হয়েছে।",
        data: { _id: String(doc._id), name: doc.name, value: doc.value, createdAt: doc.createdAt },
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "সেভ ব্যর্থ", error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
