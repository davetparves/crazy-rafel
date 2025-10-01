"use client";
import { motion } from "framer-motion";

export default function CodeEntry() {
  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 md:p-8 text-white
                 bg-[radial-gradient(80%_60%_at_20%_10%,#3b0764_0%,#0b1220_60%,#030712_100%)]"
    >
      {/* glowing accents */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-28 -left-28 h-72 w-72 rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-2xl"
      >
        <div className="overflow-hidden rounded-3xl bg-white/5 backdrop-blur-xl ring-1 ring-white/10 shadow-[0_0_40px_-10px_rgba(139,92,246,0.45)]">
          {/* Header */}
          <div className="border-b border-white/10 bg-gradient-to-r from-fuchsia-500/10 via-violet-500/10 to-sky-500/10 p-6">
            <h2 className="text-center text-3xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-fuchsia-300 via-violet-300 to-sky-300 bg-clip-text text-transparent">
                Redeem Your Code
              </span>
            </h2>
          </div>

          {/* Form */}
          <div className="p-8 space-y-6 ">
            {/* Code Input */}
            <div>
              <label
                htmlFor="codeInput"
                className="mb-2 block text-sm font-medium text-white/80"
              >
                কোড লিখুন
              </label>

              <div className="flex gap-2">
                {/* Input - 75% */}
                <input
                  id="codeInput"
                  type="text"
                  placeholder="Enter your code"
                  className="w-3/4 rounded-xl bg-slate-900/70 px-4 py-3 text-sm outline-none ring-1 ring-white/10
                 focus:ring-2 focus:ring-fuchsia-400/50 transition"
                />

                {/* Paste Button - 25% */}
                <button
                  className="w-1/4 rounded-xl px-4 py-3 text-sm font-semibold
                 bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500
                 text-white shadow-md ring-1 ring-white/10 hover:opacity-90 transition"
                >
                  Paste
                </button>
              </div>
            </div>


            {/* CTA */}
            <div className="flex justify-end">
              <button
                className="inline-flex items-center w-full gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 px-5 py-3
                           font-semibold text-white shadow-md transition hover:opacity-90"
              >
                Redeem Code
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M3.172 16.172a4 4 0 005.656 0L18 7l-5-5-9.172 9.172a4 4 0 000 5.656z" />
                </svg>
              </button>
            </div>

            {/* Recent Codes */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-white/80">
                Recent redemptions
              </h3>
              <ul className="grid grid-cols-1 gap-2">
                <li className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 ring-1 ring-white/10">
                  <span className="font-mono text-sm">12345678</span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
                    +100 coins
                  </span>
                </li>
                <li className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 ring-1 ring-white/10">
                  <span className="font-mono text-sm">CRZ-87654321</span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
                    +50 coins
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 bg-white/5 p-4 text-center text-xs text-white/60">
            সমস্যা হলে নিশ্চিত করুন — কোডটি আগে ব্যবহার করা হয়নি, মেয়াদ আছে, এবং লিমিট শেষ হয়নি।
          </div>
        </div>
      </motion.div>
    </div>
  );
}
