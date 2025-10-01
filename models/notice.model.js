import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * 📝 Notice Schema
 * - message: নোটিশের টেক্সট (required)
 * - createdAt: কখন তৈরি হয়েছে (auto)
 */
const noticeSchema = new Schema(
  {
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    // চাইলে later: createdBy, audience, isRead ইত্যাদি যোগ করতে পারবেন
    createdAt: { type: Date, default: Date.now, immutable: true },
  },
  { versionKey: false }
);

const Notice = mongoose.models.Notice || mongoose.model("Notice", noticeSchema);
export default Notice;
