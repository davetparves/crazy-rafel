// models/User.js
import mongoose, { Schema } from "mongoose";

const OID = mongoose.Schema.Types.ObjectId;

const userSchema = new mongoose.Schema(
  {
    // Identity
    fullName: { type: String, default: "Anonymous" },
    email: { type: String, default: null, trim: true, lowercase: true }, // unique/sparse removed
    username: { type: String, required: true, trim: true, lowercase: true }, // unique removed
    password: { type: String, required: true, minlength: 6, trim: true },

    // Referral
    referralCode: { type: String, default: "" }, // unique/sparse removed
    referredBy: { type: String, default: null },
    myReferList: [{ type: OID, ref: "User", default: null }],

    // Contact & Verification
    phoneNumber: { type: String, trim: true }, // unique/sparse removed
    emailVerifiedAt: { type: Date, default: null },
    phoneVerified: { type: Boolean, default: false },
    phoneVerifiedAt: { type: Date, default: null },

    // Profile
    profileImage: { type: String, default: "" },
    bio: { type: String, default: "" },
    gender: { type: String, default: "prefer_not_to_say" },
    role: { type: String, default: "user" },

    // Wallet & Currency
    wallet: {
      main: { type: Number, default: 0, min: 0 },
      bonus: { type: Number, default: 20, min: 0 },
      referral: { type: Number, default: 0, min: 0 },

      bank: {
        type: new Schema(
          {
            amount: { type: Number, default: 0, min: 0 },

            // ✅ নতুন ফিল্ডস
            requestTime: {
              type: Date,
              default: Date.now, // কারেন্ট টাইম
            },
            validTransferTime: {
              type: Date,
              default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // এখন + 1 দিন
            },
          },
          { _id: false } // আলাদা _id লাগবে না
        ),
        default: {},
      },
    },

    currency: { type: String, default: "BDT" },

    transactions: [
      {
        transactionId: { type: OID, ref: "Transaction" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    depositCount: { type: Number, default: 0 },
    withdrawCount: { type: Number, default: 0 },
    totalDeposited: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },

    // Betting
    totalBets: { type: Number, default: 0 },
    totalWins: { type: Number, default: 0 },
    totalLosses: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },
    totalWinAmount: { type: Number, default: 0 },
    totalLossAmount: { type: Number, default: 0 },
    biggestWin: { type: Number, default: 0 },
    biggestLoss: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },

    // Social
    likeCount: { type: Number, default: 0 },
    likerlist: [
      {
        userId: { type: OID, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    followers: [{ type: OID, ref: "User" }],
    following: [{ type: OID, ref: "User" }],
    badges: [{ type: Number, default: 1 }],
    achievements: [{ type: String, default: null }],
    notifications: [
      {
        message: { type: String, default: "" },
        type: { type: String, default: "info" },
        isRead: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    link: [
      {
        title: { type: String, default: "" },
        link: { type: String, default: "" },
      },
    ],

    // Loyalty & VIP
    loyaltyPoints: { type: Number, default: 0 },
    exp: { type: Number, default: 0 },
    vipLevel: { type: Number, default: 0 },

    // Activity
    isOnline: { type: Boolean, default: false },
    lastLogin: { type: Date, default: null },

    // Device
    lastIp: { type: String, default: null },
    deviceInfo: { type: String, default: null, trim: true, maxlength: 200 },

    // Admin
    isBanned: { type: Boolean, default: false },
    banReason: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
