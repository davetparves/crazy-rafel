"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { LogIn, UserPlus, Home as HomeIcon } from "lucide-react";
import { useEffect } from "react";

export default function NotFoundPage() {
  // ✅ Mount হলে body-তে স্ক্রল বন্ধ
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto"; // পেজ ছাড়ার সময় আবার restore
    };
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center 
                    bg-[radial-gradient(80%_60%_at_20%_10%,#12071b_0%,#0a0f2c_60%,#01010a_100%)] 
                    text-white overflow-hidden">
      {/* Background glow accents */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-32 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-cyan-500/25 blur-3xl" />
      </div>

      {/* Glass card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-[90%] max-w-md p-[2px] rounded-3xl 
                   bg-gradient-to-br from-fuchsia-500/40 via-violet-500/40 to-sky-500/40 
                   shadow-[0_0_50px_-15px_rgba(139,92,246,0.5)]"
      >
        <div className="rounded-3xl bg-slate-950/85 backdrop-blur-2xl p-8 text-center ring-1 ring-white/10">
          {/* Heading */}
          <h1 className="text-5xl font-extrabold mb-3 
                         bg-gradient-to-r from-fuchsia-300 via-violet-300 to-sky-300 
                         bg-clip-text text-transparent">
            404
          </h1>
          <p className="text-lg font-semibold mb-2">Page Not Found</p>
          <p className="text-white/70 text-sm mb-8">
            আপনি যে পেজ খুঁজছেন তা নেই বা অ্যাক্সেসযোগ্য নয়।
          </p>

          {/* Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/users/home"
              className="flex items-center justify-center gap-2 rounded-xl 
                         px-4 py-2.5 font-semibold text-sm 
                         bg-gradient-to-r from-sky-500 to-teal-500 
                         hover:opacity-90 transition"
            >
              <HomeIcon size={18} /> Home
            </Link>

            <Link
              href="/users/sign-in"
              className="flex items-center justify-center gap-2 rounded-xl 
                         px-4 py-2.5 font-semibold text-sm 
                         bg-gradient-to-r from-fuchsia-500 to-sky-500 
                         hover:opacity-90 transition"
            >
              <LogIn size={18} /> Sign In
            </Link>

            <Link
              href="/users/sign-up"
              className="flex items-center justify-center gap-2 rounded-xl 
                         px-4 py-2.5 font-semibold text-sm 
                         bg-gradient-to-r from-sky-500 to-violet-500 
                         hover:opacity-90 transition"
            >
              <UserPlus size={18} /> Sign Up
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
