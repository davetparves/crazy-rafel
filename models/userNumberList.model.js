// /models/userNumberList.model.js
import mongoose from 'mongoose'
const { Schema } = mongoose

/*
  - userId: কে বেট করল
  - betType: 'single' | 'double' | 'triple'
  - number: 1/2/3 digit
  - amount: বেট এমাউন্ট
  - prize: (server computed) — কত টাকা জিতবে
  - status: pending | win | loss
*/
const userNumberListSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true,  },

    betType: {
      type: String,
      enum: ['single', 'double', 'triple'],
      required: true,
    },
    number: { type: Number, required: true }, // 0–999 from UI
    amount: { type: Number, required: true, min: 1 },

    // 👇 multiple ফিল্ড নেই; শুধু prize সেভ হবে
    prize: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ['pending', 'win', 'loss'],
      default: 'pending',
    },

    createdAt: { type: Date, default: Date.now, immutable: true },
  },
  { versionKey: false },
)

// টাইপ অনুযায়ী number-এর ডিজিট ভ্যালিডেশন
userNumberListSchema.pre('validate', function (next) {
  const t = String(this.betType || '')
  const n = String(this.number ?? '')
  if (t === 'single' && !/^\d{1}$/.test(n)) return next(new Error('single: 1 digit (0–9) দরকার'))
  if (t === 'double' && !/^\d{2}$/.test(n)) return next(new Error('double: 2 digits (00–99) দরকার'))
  if (t === 'triple' && !/^\d{3}$/.test(n))
    return next(new Error('triple: 3 digits (000–999) দরকার'))
  next()
})

userNumberListSchema.index({ userId: 1, betType: 1, createdAt: -1 })

const UserNumberList =
  mongoose.models.UserNumberList || mongoose.model('UserNumberList', userNumberListSchema)

export default UserNumberList
