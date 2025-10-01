import mongoose from "mongoose";

const TempUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 3, maxlength: 18 },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    password: { type: String, required: true, minlength: 6, maxlength: 18 },
    referral: { type: String, required: true, trim: true },

    otp: {
      type: String,
      required: true,
      default: () => String(Math.floor(Math.random() * 10000)).padStart(4, "0"),
      match: [/^\d{4}$/, "OTP must be exactly 4 digits"],
      trim: true,
    },

    // ⏳ OTP ১০ মিনিট পর এক্সপায়ার করবে
    otpExpiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 10 * 60 * 1000),
      required: true,
    },
  },
  { timestamps: true }
);

const TempUser = mongoose.models.TempUser || mongoose.model("TempUser", TempUserSchema);
export default TempUser;
