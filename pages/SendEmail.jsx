"use client";
/* ✅ বাংলা কমেন্ট: এই কম্পোনেন্ট ক্লায়েন্ট সাইডে রান করবে */
import React, { useEffect, useState } from "react";
import { Mail, Lock } from "lucide-react";
import { useUserStore } from "@/store/userStore";
import { useRouter } from "next/navigation";

// ✅ বাংলা: API কল, টোস্ট
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SendEmail = () => {
  const router = useRouter();
  const storeEmail = useUserStore((s) => s.email);

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false); // ✅ বাংলা: বাটন লক/লোডিং

  useEffect(() => {
    if (storeEmail) setEmail(storeEmail);
  }, [storeEmail]);

  const canSend = Boolean(email) && !sending;

  const handleSendOTP = async () => {
    if (!canSend) return;
    setSending(true);

    // ✅ বাংলা: সার্ভারে পোস্ট — কেবল email পাঠালেই সার্ভার TempUser থেকে OTP নেবে
    const req = axios.post("/api/send-otp", { email });

    // ✅ বাংলা: পেন্ডিং টোস্ট (ঘুরবে), পরে রেসপন্স এ মেসেজ দেখাবে
    toast.promise(
      req,
      {
        pending: "OTP পাঠানো হচ্ছে...",
        success: {
          render({ data }) {
            return data?.data?.message || "সম্পন্ন হয়েছে";
          },
        },
        error: {
          render({ data }) {
            const msg =
              data?.response?.data?.message || data?.message || "ব্যর্থ হয়েছে";
            return msg;
          },
        },
      },
      { position: "top-center" }
    );

    try {
      const { data } = await req;
      if (data?.success) {
        setTimeout(() => router.push("/users/verify-otp"), 2000);
      }
    } catch (e) {
      // error টোস্ট হয়ে যাবে, চাইলে এখানে রিডাইরেক্ট বন্ধই রাখো
    } finally {
      setSending(false);
    }
  };

  const handleEditEmail = () => {
    router.push("/users/sign-up");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-3 text-white bg-[radial-gradient(80%_60%_at_20%_10%,#3b0764_0%,#0b1220_60%,#030712_100%)] overflow-hidden">
      {/* ✅ বাংলা: Toast কন্টেইনার */}
      <ToastContainer
        position="top-center"
        autoClose={1500}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastStyle={{
          background: "linear-gradient(135deg, #3b0764, #1e1b4b, #0f172a)",
          color: "#f1f5f9",
          borderRadius: "12px",
          padding: "12px 16px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
          fontSize: "0.9rem",
          fontWeight: 500,
          margin:"4px"
        }}
        progressStyle={{
          background: "linear-gradient(90deg, #ec4899, #8b5cf6, #06b6d4)",
          height: "3px",
        }}
      />

      {/* ✅ বাংলা: ব্যাকগ্রাউন্ডের গ্লোইং অ্যাকসেন্ট */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-20 -left-20 h-52 w-52 rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      {/* ✅ বাংলা: কার্ড */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md p-[2px] rounded-2xl sm:rounded-3xl bg-gradient-to-br from-fuchsia-500/40 via-violet-500/40 to-sky-500/40 shadow-[0_0_40px_-10px_rgba(99,102,241,0.45)]">
        <div className="rounded-2xl sm:rounded-3xl bg-slate-950/80 backdrop-blur-xl p-4 sm:p-6 ring-1 ring-white/10">
          <h1 className="text-xl sm:text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-300 via-violet-300 to-sky-300">
            Send Email
          </h1>
          <p className="mt-1 text-center text-white/60 text-xs sm:text-sm">
            OTP পাঠানোর জন্য তোমার ইমেইল (লকড)
          </p>

          <div className="mt-4 space-y-4">
            {/* ✅ বাংলা: ইমেইল ফিল্ড (disabled + readOnly) */}
            <div>
              <label className="block text-[11px] text-white/70 mb-1">
                Email (Locked)
              </label>
              <div className="relative flex items-center">
                <Mail size={16} className="absolute left-3 text-white/40" />
                <input
                  type="email"
                  name="email"
                  value={email || ""}
                  placeholder="email not found"
                  disabled
                  readOnly
                  className={`w-full pl-9 rounded-lg bg-slate-900/70 px-3 py-2 text-xs sm:text-sm 
                    ring-1 ring-white/10 focus:outline-none cursor-not-allowed opacity-80`}
                />
                <Lock size={14} className="absolute right-3 text-white/40" />
              </div>
              {!email && (
                <p className="text-amber-300/90 text-[11px] mt-1">
                  Zustand-এ ইমেইল পাওয়া যায়নি। আগে সাইনআপ পেজ থেকে ইমেইল সেট
                  করুন।
                </p>
              )}
            </div>

            {/* ✅ বাংলা: বাটন রো — Edit Email (বামে), Send OTP (ডানে) */}
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={handleEditEmail}
                disabled={sending}
                className="flex-1 rounded-lg sm:rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium bg-slate-800/70 hover:bg-slate-800 text-white/90 shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Edit Email
              </button>

              <button
                onClick={handleSendOTP}
                disabled={!canSend}
                className={`flex-1 rounded-lg sm:rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-white ring-1 ring-white/10 shadow-md transition
                  ${
                    canSend
                      ? "bg-gradient-to-r from-fuchsia-500/80 via-violet-500/80 to-sky-500/80 hover:opacity-95 shadow-[0_0_15px_-3px_rgba(139,92,246,0.6)]"
                      : "bg-slate-900/70 cursor-not-allowed opacity-50"
                  }`}
              >
                {sending ? "Sending..." : "Send OTP"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendEmail;
