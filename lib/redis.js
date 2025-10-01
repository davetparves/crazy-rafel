// /lib/redis.js
import Redis from "ioredis";

/** একটাই Redis কানেকশন রিইউজ করতে গ্লোবাল ব্যবহার */
let redis = global.__redis || null;

if (!redis && process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
  });
  global.__redis = redis;
}

export default redis;
