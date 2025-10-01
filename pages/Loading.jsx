"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function Loading() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let p = 0;
    const interval = setInterval(() => {
      p += 2;
      if (p > 100) {
        clearInterval(interval);
      } else {
        setProgress(p);
      }
    }, 80);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center h-screen overflow-hidden 
      bg-[radial-gradient(80%_80%_at_50%_50%,#0a0a1a_0%,#03030b_100%)] text-white">

      {/* Nebula glows */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="absolute -top-40 -left-40 w-[32rem] h-[32rem] bg-fuchsia-500/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-40 -right-40 w-[36rem] h-[36rem] bg-cyan-500/20 rounded-full blur-3xl"
      />

      {/* Floating orb */}
      <motion.div
        animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="relative z-10 w-32 h-32 rounded-full bg-gradient-to-br from-fuchsia-400 via-indigo-500 to-cyan-400 blur-sm shadow-[0_0_50px_-10px_rgba(56,189,248,0.8)]"
      >
        {/* Inner pulse */}
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.3, 1] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="absolute inset-4 rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 blur-md"
        />
      </motion.div>

      {/* Progress bar */}
      <div className="relative z-20 mt-16 w-64 h-3 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ ease: "easeInOut", duration: 0.5 }}
          className="h-full bg-gradient-to-r from-fuchsia-400 via-cyan-400 to-sky-400"
        />
      </div>

      {/* Glitch text */}
      <motion.p
        key={progress}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 text-lg md:text-xl font-mono tracking-widest text-fuchsia-300"
      >
        {progress < 100 ? `Loading... ${progress}%` : "Warp Complete 🚀"}
      </motion.p>
    </div>
  );
}
