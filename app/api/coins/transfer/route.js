// /app/api/coins/transfer/route.js
import { NextResponse } from "next/server";

import mongoose from "mongoose";
import redis from "@/lib/redis";
import dbConnect from "@/db/connect";
import User from "@/models/user.model";
import Transaction from "@/models/transaction.model";
// মডেলগুলো ইমপোর্ট


const LIMIT = 5;                 // ফিক্সড লিমিট
const CACHE_KEY = "recent_txn_v1";
const TTL_SECONDS = 60;          // ১ মিনিট

export async function POST(req) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();
    // এখন সাইনসহ ভ্যালু
    const rawAmount = Number(body?.amount);

    // ✅ নন-জিরো ভ্যালিডেশন (পজিটিভ/নেগেটিভ দুটোই ঠিক)
    if (!email || !Number.isFinite(rawAmount) || rawAmount === 0) {
      return NextResponse.json(
        { success: false, message: "সঠিক ইমেইল ও নন-জিরো এমাউন্ট দিন।" },
        { status: 400 }
      );
    }

    await dbConnect();

    // 🔎 ইউজার আছে কিনা চেক
    const user = await User.findOne({ email }).lean();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "এই ইমেইল দিয়ে কোন ইউজার পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    const isPositive = rawAmount > 0;
    const absAmount = Math.abs(rawAmount);

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        // 1) 🎯 Transaction create (type = 'transfer', amount = absolute)
        const [tx] = await Transaction.create(
          [
            {
              userId: user._id,
              type: "transfer",         // ✅ তোমার নির্ধারিত টাইপ
              amount: absAmount,        // রিপোর্টিংয়ের জন্য absolute রাখা হলো
              currency: "BDT",
              note: isPositive
                ? `অ্যাকাউন্টে ${absAmount} যোগ করা হয়েছে।`
                : `অ্যাকাউন্ট থেকে ${absAmount} কর্তন করা হয়েছে।`,
            },
          ],
          { session }
        );

        // 2) 🔁 ইউজার wallet.main ইনক্রিমেন্ট/ডিক্রিমেন্ট (সাইনসহ)
        await User.updateOne(
          { _id: user._id },
          {
            $inc: { "wallet.main": rawAmount },   // <- সাইনসহ +/-
            $push: {
              transactions: {
                transactionId: tx._id,
                createdAt: tx.createdAt,
              },
            },
          },
          { session }
        );
      });

      return NextResponse.json(
        {
          success: true,
          message: isPositive
            ? "কয়েন যোগ করা হয়েছে।"
            : "কয়েন কর্তন করা হয়েছে।",
        },
        { status: 201 }
      );
    } finally {
      await session.endSession();
    }
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

export async function GET() {
  try {
    // 👉 আলাদা ক্যাশ-কী (শুধু transfer টাইপের জন্য)
    const KEY = `${CACHE_KEY}:transfer`;

    // 1) ক্যাশ থেকে
    if (redis) {
      try {
        const cached = await redis.get(KEY);
        if (cached) {
          const data = JSON.parse(cached);
          return NextResponse.json(
            { success: true, data, cache: "HIT" },
            { status: 200, headers: { "x-cache": "hit" } }
          );
        }
      } catch {
        // redis error হলে নীরবে DB fallback
      }
    }

    // 2) DB থেকে: কেবল type === 'transfer', সর্বশেষ LIMIT টা
    await dbConnect();
    const rows = await Transaction.find({ type: "transfer" })
      .sort({ createdAt: -1 })
      .limit(LIMIT) // LIMIT = 5
      .populate("userId", "email role")
      .lean();

    const data = rows.map((t) => ({
      _id: String(t._id),
      amount: t.amount,            // এখন +/- দুটোই হতে পারে
      type: t.type,                // 'transfer'
      createdAt: t.createdAt,
      user: t.userId
        ? { _id: String(t.userId._id), email: t.userId.email, role: t.userId.role }
        : { _id: null, email: "", role: "" },
    }));

    // 3) ক্যাশে সংরক্ষণ (TTL সহ)
    if (redis) {
      try {
        await redis.set(KEY, JSON.stringify(data), "EX", TTL_SECONDS);
      } catch {
        // cache set ব্যর্থ হলেও রেসপন্স দেবো
      }
    }

    return NextResponse.json(
      { success: true, data, cache: "MISS" },
      { status: 200, headers: { "x-cache": "miss" } }
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message: "Recent transfers fetch ব্যর্থ হয়েছে",
        error: String(err?.message || err),
      },
      { status: 500 }
    );
  }
}
