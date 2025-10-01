import mongoose from "mongoose";

const { Schema } = mongoose;

const increaseGrowthSchema = new Schema(
  {
    rate: { type: Number, required: true, min: 0 },
    createdAt: { type: Date, default: Date.now, immutable: true },
  },
  { versionKey: false }
);

const IncreaseGrowth =
  mongoose.models.IncreaseGrowth ||
  mongoose.model("IncreaseGrowth", increaseGrowthSchema);

export default IncreaseGrowth;
