// /models/multiplier.model.js
import mongoose from "mongoose";

const { Schema } = mongoose;

/* 🔒 শুধুমাত্র তিনটা নাম: single | double | triple (ইউনিক) */
const multiplierSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      enum: ["single", "double", "triple"],
      unique: true,
      trim: true,
      lowercase: true,

    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    createdAt: { type: Date, default: Date.now, immutable: true },
  },
  { versionKey: false }
);



const Multiplier =
  mongoose.models.Multiplier || mongoose.model("Multiplier", multiplierSchema);

export default Multiplier;
