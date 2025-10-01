// /models/result.model.js
import mongoose from 'mongoose'

// ✅ status এখন কেবল 'hold' বা 'draw'
export const ALLOWED_STATUSES = ['hold', 'draw']

const NumbersSchema = new mongoose.Schema(
  {
    single: {
      type: Number,
      required: true,
      validate: {
        validator: (v) => Number.isInteger(v) && v >= 0 && v <= 9,
        message: 'numbers.single must be a single digit (0-9)',
      },
    },
    double: {
      type: Number,
      required: true,
      validate: {
        validator: (v) => Number.isInteger(v) && v >= 0 && v <= 99,
        message: 'numbers.double must be a two-digit number (00-99)',
      },
    },
    triple: {
      type: Number,
      required: true,
      validate: {
        validator: (v) => Number.isInteger(v) && v >= 0 && v <= 999,
        message: 'numbers.triple must be a three-digit number (000-999)',
      },
    },
  },
  { _id: false },
)

const ResultSchema = new mongoose.Schema(
  {
    numbers: { type: NumbersSchema, required: true },
    status: {
      type: String,
      enum: ALLOWED_STATUSES, // 'hold' | 'draw'
      default: 'hold',
      required: true,
      index: true,
    },
  },
  { timestamps: true },
)

const Result = mongoose.models.Result || mongoose.model('Result', ResultSchema)
export default Result
