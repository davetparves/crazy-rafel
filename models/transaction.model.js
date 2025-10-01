// /models/transaction.model.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const transactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: [
        "deposit",
        "withdraw",
        "bet",
        "win",
        "loss",
        "bonus",
        "referral",
        "refund",
        "transfer",
        "adjustment",
        "fee",
        "cashback",
        "purchase",
        "reward",
        "penalty",
        "gift",
        "interest",
        "loan",
        "payout",
        "salary",
        "commission",
        "stake",
        "unstake",
        "airdrop",
        "exchange",
        "subscription",
        "donation",
        "prize",
        "transfer",
        "royalty",
        "settlement",
        "welcome",
      ],
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "BDT", uppercase: true, trim: true },
    referenceId: { type: String, default: null, trim: true },
    note: { type: String, default: "", trim: true, maxlength: 200 },
    createdAt: { type: Date, default: Date.now, immutable: true },
  },
  { versionKey: false }
);

transactionSchema.index({ userId: 1, createdAt: -1 });

const Transaction =
  mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);

export default Transaction;
