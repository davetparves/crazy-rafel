import mongoose from 'mongoose'
const { Schema } = mongoose

const withdrawSchema = new Schema(
  {
    agentEmail: { type: String, required: true, lowercase: true, trim: true },
    method: { type: String, enum: ['bKash', 'Nagad', 'Rocket', 'Upay'], required: true },
    paymentNumber: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 1 },
    userEmail: { type: String, required: true, lowercase: true, trim: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now, immutable: true },
  },
  { versionKey: false },
)

withdrawSchema.index({ userEmail: 1, createdAt: -1 })

const Withdraw = mongoose.models.Withdraw || mongoose.model('Withdraw', withdrawSchema)
export default Withdraw
