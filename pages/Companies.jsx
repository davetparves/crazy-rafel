// components/CompanyMarket.jsx
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  FaAmazon,
  FaApple,
  FaFacebook,
  FaGoogle,
  FaMicrosoft,
  FaSpotify,
  FaPaypal,
  FaUber,
  FaTwitch,
  FaSlack,
  FaYoutube,
  FaInstagram,
  FaTwitter,
  FaSnapchat,
  FaReddit,
  FaLinkedin,
  FaDropbox,
  FaPinterest,
  FaYahoo,
  FaCar,
  FaUsers,
} from "react-icons/fa";

// ✅ Odometer client-side only
const Odometer = dynamic(() => import("react-odometerjs"), { ssr: false });
import "odometer/themes/odometer-theme-default.css";
import { useUserStore } from "@/store/userStore";

/* ---------------- Companies ---------------- */
const COMPANIES = [
  { name: "Apple", icon: <FaApple /> },
  { name: "Amazon", icon: <FaAmazon /> },
  { name: "Google", icon: <FaGoogle /> },
  { name: "Microsoft", icon: <FaMicrosoft /> },
  { name: "Meta", icon: <FaFacebook /> },
  { name: "Tesla", icon: <FaCar /> },
  { name: "Spotify", icon: <FaSpotify /> },
  { name: "PayPal", icon: <FaPaypal /> },
  { name: "Uber", icon: <FaUber /> },
  { name: "Twitch", icon: <FaTwitch /> },
  { name: "Slack", icon: <FaSlack /> },
  { name: "YouTube", icon: <FaYoutube /> },
  { name: "Instagram", icon: <FaInstagram /> },
  { name: "Twitter", icon: <FaTwitter /> },
  { name: "Snapchat", icon: <FaSnapchat /> },
  { name: "Reddit", icon: <FaReddit /> },
  { name: "LinkedIn", icon: <FaLinkedin /> },
  { name: "Dropbox", icon: <FaDropbox /> },
  { name: "Pinterest", icon: <FaPinterest /> },
  { name: "Yahoo", icon: <FaYahoo /> },
];

/* ---------------- Helpers ---------------- */
const randomHolders = () =>
  Math.floor(Math.random() * (100000 - 30000 + 1)) + 30000;

const randomPercent = () =>
  (Math.random() * (15 - 2) + 2).toFixed(2); // 2.00% - 15.00%

/* ---------------- Component ---------------- */
export default function CompanyMarket() {
  // 🚀 Safe init -> no random values in SSR
  const [companies, setCompanies] = useState(
    COMPANIES.map((c) => ({
      ...c,
      holders: 0,
      percent: "0.00",
    }))
  );

  // First client-side setup
  useEffect(() => {
    setCompanies(
      COMPANIES.map((c) => ({
        ...c,
        holders: randomHolders(),
        percent: randomPercent(),
      }))
    );

    const id = setInterval(() => {
      setCompanies((prev) =>
        prev.map((c) => {
          // প্রতি আপডেটে steady +0.04% গ্রোথ
          let newHolders = Math.floor(c.holders * 1.00009);
          if (newHolders > 100000) newHolders = randomHolders();
          return { ...c, holders: newHolders, percent: c.percent };
        })
      );
    }, 3500);

    return () => clearInterval(id);
  }, []);
 const storeEmail = useUserStore((s) => s.email)
  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6 lg:p-8 text-white">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold mb-6 sm:mb-8 text-center bg-gradient-to-r from-cyan-300 via-violet-300 to-cyan-200 bg-clip-text text-transparent">
          📊 Global Top 20 Companies — Live Shareholders & Performance
        </h1>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {companies.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="relative flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl sm:rounded-3xl bg-slate-900/40 backdrop-blur-xl p-4 sm:p-6 
              border border-white/10 hover:border-cyan-400/30 shadow-[0_0_15px_rgba(56,189,248,0.1)] hover:shadow-[0_0_20px_rgba(56,189,248,0.25)] transition"
            >
              {/* Left: logo + name */}
              <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-40 mb-3 sm:mb-0">
                <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-800/70 ring-1 ring-white/10 text-lg sm:text-2xl text-cyan-300">
                  {c.icon}
                </div>
                <span className="font-semibold truncate">{c.name}</span>
              </div>

              {/* Middle: Holders */}
              <div className="flex-1 mx-0 sm:mx-4 mb-3 sm:mb-0">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-white/70">
                  <span>Shareholders:</span>
                  <Odometer value={c.holders} format="(,ddd)" duration={1500} />
                  <FaUsers className="text-cyan-300" />
                </div>
                <div className="h-1 bg-slate-800/70 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-400 to-cyan-400"
                    style={{ width: `${Math.min(c.holders / 1000, 100)}%` }}
                  />
                </div>
              </div>

              {/* Right: % change (static) */}
              <div className="text-sm sm:text-base lg:text-lg font-bold text-emerald-400 sm:mr-16">
                Day(+{c.percent}%)
              </div>

              {/* View button (responsive placement) */}
              <div className="mt-3 sm:mt-0  sm:absolute sm:bottom-3 sm:right-3">
                <button className="px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-green-600 hover:bg-white/20 ring-1 ring-white/10 transition">
                  View
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <p className="mt-8 sm:mt-10 text-center text-white/50 text-xs sm:text-sm">
          ⚡ Live stock-style ticker • Auto updates every 3-4s • Premium Old Glass Glow Theme
        </p>
      </div>
    </div>
  );
}
