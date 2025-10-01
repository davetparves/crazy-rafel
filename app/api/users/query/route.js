// /app/api/users/query/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/db/connect";
import User from "@/models/user.model";
import crypto from "crypto";

/* ──────────────────────────────────────────────────────────────
   🔐 Redis (lazy) – Upstash থাকলে @upstash/redis, নইলে ioredis
   ────────────────────────────────────────────────────────────── */
let _redisClient = null;
async function getRedis() {
  if (_redisClient) return _redisClient;
  try {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      const { Redis } = await import("@upstash/redis");
      _redisClient = Redis.fromEnv();
    } else if (process.env.REDIS_URL) {
      const Redis = (await import("ioredis")).default;
      _redisClient = new Redis(process.env.REDIS_URL);
    }
  } catch {
    _redisClient = null; // redis optional
  }
  return _redisClient;
}

/* helper: slim cache key */
function makeKey(payload) {
  const s = JSON.stringify(payload);
  const h = crypto.createHash("sha1").update(s).digest("hex");
  return `users:query:${h}`;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const search = String(body?.search || "").trim();
    const category = String(body?.category || "all").toLowerCase();
    const page = Math.max(1, Number(body?.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(body?.limit) || 50));
    const skip = (page - 1) * limit;

    // ⚡️ Cache first
    const redis = await getRedis();
    const cacheKey = makeKey({ search, category, page, limit });

    if (redis) {
      try {
        const cachedRaw = await redis.get(cacheKey);
        const cached =
          typeof cachedRaw === "string" ? JSON.parse(cachedRaw) : cachedRaw;
        if (cached && cached.success) {
          // ✅ 60s এর মধ্যে এলে ক্যাশড রেসপন্স
          return NextResponse.json(cached, { status: 200 });
        }
      } catch {
        // ignore cache read errors
      }
    }

    await dbConnect();

    // 🔍 বেস কুয়েরি
    const query = {};

    // ইমেইল সার্চ (case-insensitive, contains)
    if (search) {
      query.email = { $regex: search, $options: "i" };
    }

    // ক্যাটেগরি অনুযায়ী role filter
    if (["admin", "agent", "user"].includes(category)) {
      query.role = category;
    }

    // 🔃 সোর্টিং লজিক
    let sort = { createdAt: -1 }; // ডিফল্ট: নতুন আগে
    if (category === "latest") sort = { createdAt: -1 };
    else if (category === "old") sort = { createdAt: 1 };
    else if (category === "high_balance") sort = { walletBalance: -1 };
    else if (category === "low_balance") sort = { walletBalance: 1 };

    // 🧾 select – শুধুমাত্র দরকারি ফিল্ড
    const projection = "email role walletBalance createdAt";

    const [items, total] = await Promise.all([
      User.find(query).sort(sort).skip(skip).limit(limit).select(projection).lean(),
      User.countDocuments(query),
    ]);


    const payload = {
      success: true,
      data: items,
      page,
      limit,
      total,
    };

    // 🧊 set cache (EX 60s)
    if (redis) {
      try {
        const value = JSON.stringify(payload);
        // Upstash style
        if (typeof redis.set === "function") {
          try {
            await redis.set(cacheKey, value, { ex: 60 });
          } catch {
            // ioredis fallback signature
            try {
              await redis.set(cacheKey, value, "EX", 60);
            } catch {
              /* ignore */
            }
          }
        }
      } catch {
        // ignore cache write errors
      }
    }

    return NextResponse.json(payload, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message: "ইউজার লোড করা যায়নি",
        error: String(err?.message || err),
      },
      { status: 500 }
    );
  }
}
