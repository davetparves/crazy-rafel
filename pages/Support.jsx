"use client";
import React from "react";
import { motion } from "framer-motion";

export default function Support() {
  // Demo support team data
  const supports = [
    { id: 1, name: "Agent Alex", role: "Live Chat Support", rating: 4.9, online: true },
    { id: 2, name: "Agent Bella", role: "Technical Help", rating: 4.7, online: false },
    { id: 3, name: "Agent Chris", role: "Payment Support", rating: 4.8, online: true },
    { id: 4, name: "Agent Diana", role: "Verification Team", rating: 4.6, online: true },
  ];

  return (
    <div className="min-h-screen p-6 md:p-10 text-white relative overflow-hidden 
      bg-[radial-gradient(90%_70%_at_30%_20%,#1e1b4b_0%,#0f172a_60%,#020617_100%)]">
      
      {/* Ambient gradient glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-28 h-80 w-80 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-28 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
      </div>

      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold">
          <span className="bg-gradient-to-r from-fuchsia-300 via-violet-200 to-sky-300 
            bg-clip-text text-transparent">
            Support & Assistance
          </span>
        </h1>
        <p className="mt-3 text-sm md:text-base text-white/70">
          Contact our support team through WhatsApp, Telegram or Email — we’re here 24/7.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {supports.map((s) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative rounded-2xl p-5 
              bg-white/10 backdrop-blur-xl border border-white/10 
              hover:bg-white/15 hover:border-white/20 transition shadow-lg"
          >
            {/* Status dot */}
            <span
              className={`absolute right-4 top-4 h-3 w-3 rounded-full ring-2 ring-slate-900 
                ${s.online ? "bg-emerald-400" : "bg-slate-500"}`}
            />

            {/* Avatar + Info */}
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-fuchsia-500/40 to-sky-500/40 flex items-center justify-center text-2xl">
                👩‍💻
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-lg truncate">{s.name}</h3>
                <p className="text-sm text-white/60">{s.role}</p>
                <p className="text-xs mt-1 text-amber-300">⭐ {s.rating.toFixed(1)} / 5.0</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              <button className={`h-10 rounded-xl text-xs font-semibold transition 
                ${s.online ? "bg-gradient-to-r from-emerald-500 to-green-400 text-white" : "bg-white/10 text-white/50 cursor-not-allowed"}`}>
                WhatsApp
              </button>
              <button className="h-10 rounded-xl text-xs font-semibold bg-blue-500/20 text-blue-300 hover:bg-blue-500/30">
                Telegram
              </button>
              <button className="h-10 rounded-xl text-xs font-semibold bg-fuchsia-500/20 text-fuchsia-300 hover:bg-fuchsia-500/30">
                Email
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty state */}
      {supports.length === 0 && (
        <div className="mt-12 text-center text-white/60">No support agents available right now.</div>
      )}
    </div>
  );
}
