// /app/api/notices/[id]/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/db/connect";
import Notice from "@/models/notice.model";

export async function DELETE(_req, { params }) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Invalid id" },
        { status: 400 }
      );
    }

    await dbConnect();
    const doc = await Notice.findByIdAndDelete(id);

    if (!doc) {
      return NextResponse.json(
        { success: false, message: "নোটিশ পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "নোটিশ ডিলিট হয়েছে", data: { _id: String(doc._id) } },
      { status: 200 }
    );
  } catch (err) {
    console.error("[notices][DELETE]", err);
    return NextResponse.json(
      { success: false, message: "ডিলিট করা যায়নি", error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
