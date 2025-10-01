// /app/api/notices/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/db/connect";
import Notice from "@/models/notice.model";

/** 🔁 GET: সব নোটিশ (DB থেকে সরাসরি) */
export async function GET() {
  try {
    await dbConnect();
    const items = await Notice.find({}).sort({ createdAt: -1 }).lean();
    console.log(`[notices][GET] DB LOAD (${items.length})`);
    return NextResponse.json(
      { success: true, data: items },
      { status: 200 }
    );
  } catch (err) {
    console.error("[notices][GET]", err);
    return NextResponse.json(
      { success: false, message: "নোটিশ লোড করা যায়নি", error: String(err?.message || err) },
      { status: 500 }
    );
  }
}

/** 🔔 POST: { message } → নতুন নোটিশ তৈরি (DB) */
export async function POST(req) {
  try {
    const { message } = await req.json();
    if (!String(message || "").trim()) {
      return NextResponse.json(
        { success: false, message: "নোটিশ লিখুন।" },
        { status: 400 }
      );
    }

    await dbConnect();
    const doc = await Notice.create({ message: message.trim() });

    return NextResponse.json(
      {
        success: true,
        message: "নোটিশ পাঠানো হয়েছে।",
        data: { _id: String(doc._id), message: doc.message, createdAt: doc.createdAt },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[notices][POST]", err);
    return NextResponse.json(
      { success: false, message: "নোটিশ পাঠানো যায়নি।", error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
