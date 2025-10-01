"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Wrench, Clock } from "lucide-react";

/* ========================= ODOMETER (minimal) ========================= */
const DIGITS = Object.freeze([0,1,2,3,4,5,6,7,8,9]);
const pad2 = (n) => String(Math.max(0, n|0)).padStart(2, "0");

function OdometerDigit({ digit = "0", height = 36, duration = 220 }){
  const s = String(digit);
  const d = s.length === 1 && s >= "0" && s <= "9" ? Number(s) : 0;
  const style = { transform: `translateY(-${d * height}px)`, transition: `transform ${duration}ms ease-out` };
  return (
    <div className="relative overflow-hidden rounded-md bg-white/10 ring-1 ring-white/10" style={{ height, width: height * 0.6 }}>
      <div style={style}>
        {DIGITS.map((x) => (
          <div key={x} className="grid place-items-center" style={{ height }}>
            <span className="font-extrabold text-white/95 select-none" style={{ fontSize: height * 0.65 }}>{x}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Odometer({ value = "00:00:00", height = 36, className = "" }){
  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      {value.split("").map((ch, i) =>
        ch === ":" ? (
          <span key={i} className="px-1 text-white/80 font-bold" style={{ fontSize: height * 0.7 }}>:</span>
        ) : (
          <OdometerDigit key={i} digit={ch} height={height} />
        )
      )}
    </div>
  );
}
/* ======================= END ODOMETER ======================= */

export default function UpdatePage(){
  const search = useSearchParams();
  const [now, setNow] = useState(Date.now());

  // Fixed cutoff at a clock time TODAY — default 15:00 (3 PM)
  // Optional override via query: ?time=21:00  or  ?time=9:30 PM
  const targetTs = useMemo(() => {
    const raw = (search?.get("time") || "10:00").trim();
    const upper = raw.toUpperCase();
    // Split optional suffix (AM/PM)
    let timePart = upper;
    let suffix = "";
    const sp = upper.indexOf(" ");
    if (sp > 0) {
      timePart = upper.slice(0, sp);
      suffix = upper.slice(sp + 1).trim();
    }
    // Parse HH:MM
    let h = 15, m = 0;
    const c = timePart.indexOf(":");
    if (c > -1) {
      const hs = timePart.slice(0, c);
      const ms = timePart.slice(c + 1);
      const hh = parseInt(hs, 10);
      const mm = parseInt(ms, 10);
      if (!Number.isNaN(hh)) h = hh;
      if (!Number.isNaN(mm)) m = mm;
    } else {
      const hh = parseInt(timePart, 10);
      if (!Number.isNaN(hh)) h = hh;
    }
    if (suffix === "PM" && h < 12) h += 12;
    if (suffix === "AM" && h === 12) h = 0;

    const t = new Date();
    const target = new Date(t.getFullYear(), t.getMonth(), t.getDate(), h, m, 0, 0);
    return target.getTime();
  }, [search]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remain = Math.max(0, targetTs - now);
  const done = remain <= 0;

  const hh = Math.floor(remain / 3600000);
  const mm = Math.floor((remain % 3600000) / 60000);
  const ss = Math.floor((remain % 60000) / 1000);
  const display = `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`;

  const targetHuman = new Date(targetTs).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-6 md:p-8">
        <div className="flex items-center gap-3 mb-3">
          <Wrench className="w-6 h-6 text-white/90" />
          <h1 className="text-xl md:text-2xl font-bold">Site Update in Progress</h1>
        </div>
        <p className="text-white/80 text-sm md:text-base mb-6">
          We’re applying updates to improve your experience. The site is temporarily unavailable.
          Estimated completion: <span className="font-semibold">{targetHuman}</span>. Please wait.
        </p>

        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-white/70" />
          <span className="text-white/70 text-sm">Time remaining</span>
        </div>
        <Odometer value={display} height={44} />

       


      </div>
    </main>
  );
}
