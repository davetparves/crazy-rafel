"use client";

import React from "react";

export default function Header() {
  return (
    <header className="text-center mb-6 sm:mb-8 pt-6 sm:pt-8">
      <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold mb-3 sm:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-violet-300 to-sky-400 drop-shadow">
        🎩 PREMIUM RAFEL Admin Console
      </h1>
      <p className="text-xs sm:text-sm text-white/70">
        Manage results, users, and operations.
      </p>
    </header>
  );
}
