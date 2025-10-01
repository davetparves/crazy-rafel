// ✅ বাংলা কমেন্ট: মিনিমাল এবং ক্যাশড MongoDB কানেকশন; dbName ফোর্স করা হলো 'myDB'
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URL
if (!MONGODB_URI) {
  throw new Error('❌ MONGODB_URI সেট করা নেই। .env.local ফাইলে যোগ করুন।')
}

let cached = global.mongoose
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

export default async function dbConnect() {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      dbName: 'testDB', // ✅ মূল কথা: ডেটাবেইস নাম ফিক্সড 'myDB'
    })
    .then((m) => m)
  }

  cached.conn = await cached.promise
  return cached.conn
}
