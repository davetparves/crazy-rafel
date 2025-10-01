"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ToastContainer, toast, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/**
 * CoinTransferSection — input 90% + 10% sign-toggle
 * - Input now ONLY accepts positive numbers (no +/-)
 * - A compact toggle (default: +) decides the final sign
 * - On submit: signedAmount = (isMinus ? -amount : +amount)
 * - Everything else unchanged
 */

export default function CoinTransferSection() {
  // form state
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState(""); // positive-only text
  const [isMinus, setIsMinus] = useState(false); // toggle state (false => plus)
  const [loading, setLoading] = useState(false);

  // validation UI (client-side hint only)
  const [touched, setTouched] = useState({ email: false, amount: false });

  // recent transfers
  const [recent, setRecent] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);

  // helpers
  // positive-only numeric (no leading +/-, no letters)
  const sanitizeAmount = (v) =>
    v
      .replace(/[^\d.]/g, "") // digits & dot only
      .replace(/^(\d*\.?\d*).*/, "$1"); // keep single decimal pattern

  const emailValid = useMemo(
    () => /^\S+@\S+\.\S+$/.test(email.trim()),
    [email]
  );

  const amountValid = useMemo(() => {
    const n = Number(amount);
    return Number.isFinite(n) && n > 0; // input must be strictly positive
  }, [amount]);

  const canSubmit = emailValid && amountValid && !loading;

  // fetch recent transfers
  const fetchRecent = useCallback(async () => {
    try {
      setRecentLoading(true);
      const res = await axios.get("/api/coins/transfer");
      const data = Array.isArray(res?.data?.data) ? res.data.data : [];
      setRecent(data);
    } catch {
      setRecent([]);
    } finally {
      setRecentLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  // submit
  const handleSend = async () => {
    const base = Number(amount); // positive number by design
    if (!emailValid || !amountValid) {
      toast.warning("সঠিক ইমেইল ও পজিটিভ এমাউন্ট দিন।");
      setTouched({ email: true, amount: true });
      return;
    }

    // apply sign based on toggle
    const signedAmount = isMinus ? -base : base;

    try {
      setLoading(true);
      const res = await axios.post("/api/coins/transfer", {
        email: email.trim(),
        amount: signedAmount, // server updates wallet.main with $inc (±)
      });

      if (res?.data?.success) {
        toast.success(res?.data?.message || "ট্রান্সফার সফল হয়েছে ✅");
        setEmail("");
        setAmount("");
        setIsMinus(false); // reset to plus
        fetchRecent(); // refresh list
      } else {
        toast.error(res?.data?.message || "트ান্সফার ব্যর্থ হয়েছে");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.status === 404
          ? "ইউজার পাওয়া যায়নি"
          : "সার্ভারে সমস্যা হয়েছে");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // quick chips (always positive; toggle controls final sign)
  const chips = ["100", "250", "500", "1000"];

  // badge
  const RoleBadge = ({ role }) => {
    const base =
      "rounded-md px-2 py-0.5 text-[10px] uppercase tracking-wide ring-1";
    const map = {
      admin: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
      agent: "bg-cyan-500/15 text-cyan-300 ring-cyan-500/30",
      user: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
    };
    const cls = map[role] || "bg-slate-500/15 text-slate-300 ring-slate-500/30";
    return <span className={`${base} ${cls}`}>{role || "user"}</span>;
  };

  // handle Enter submit
  const onKeyDown = (e) => {
    if (e.key === "Enter" && canSubmit) handleSend();
  };

  return (
    <section className="space-y-6 text-white">
      {/* Toast */}
      <ToastContainer
        position="top-right"
        autoClose={1200}
        newestOnTop
        transition={Slide}
        theme="dark"
        hideProgressBar={false}
        closeOnClick
        draggable
        pauseOnFocusLoss={false}
        pauseOnHover={false}
        style={{ zIndex: 9999, top: 12, right: 12 }}
        toastClassName={() =>
          "relative flex p-3 min-h-10 rounded-xl bg-slate-900/90 text-white backdrop-blur-xl ring-1 ring-white/10 shadow-lg"
        }
        bodyClassName={() => "text-sm font-medium"}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-fuchsia-300 via-violet-200 to-sky-300 bg-clip-text text-transparent">
            💎 Coin Transfer
          </span>
        </h2>

        <button
          type="button"
          onClick={fetchRecent}
          className="rounded-lg bg-white/5 hover:bg-white/10 px-3 py-2 ring-1 ring-white/10 text-sm"
          aria-label="Refresh recent transfers"
        >
          Refresh
        </button>
      </div>

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Form */}
        <div className="relative overflow-hidden rounded-2xl bg-[#0B0F19] ring-1 ring-white/10 p-6">
          <div className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-white/70"
              >
                Recipient Email
              </label>
              <div className="relative group">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/60">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M1.5 6.75A2.25 2.25 0 0 1 3.75 4.5h16.5a2.25 2.25 0 0 1 2.25 2.25v10.5A2.25 2.25 0 0 1 20.25 19.5H3.75A2.25 2.25 0 0 1 1.5 17.25V6.75Zm2.694-.75a.75.75 0 0 0-.57 1.255l7.056 7.944a.75.75 0 0 0 1.14 0l7.056-7.944a.75.75 0 0 0-.57-1.255H4.194Z" />
                  </svg>
                </span>
                <input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  onKeyDown={onKeyDown}
                  placeholder="user@example.com"
                  className={`w-full rounded-xl bg-slate-900/70 px-10 py-3 text-white ring-1 outline-none placeholder:text-white/40
                    ${touched.email && !emailValid
                      ? "ring-rose-500/50 focus:ring-rose-400"
                      : "ring-white/10 focus:ring-2 focus:ring-indigo-400"
                    }`}
                  autoComplete="off"
                  spellCheck={false}
                  inputMode="email"
                />
              </div>
              {touched.email && !emailValid && (
                <p className="mt-1 text-xs text-rose-300">সঠিক ইমেইল দিন</p>
              )}
            </div>

            {/* Amount (90% input + 10% toggle) */}
            <div>
              <label
                htmlFor="amount"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-white/70"
              >
                Amount
              </label>

              {/* 90/10 layout */}
              <div className="grid grid-cols-10 gap-2">
                {/* 90% input */}
                <div className="col-span-7 relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/60">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2.25C6.615 2.25 2.25 4.14 2.25 6.75v10.5c0 2.61 4.365 4.5 9.75 4.5s9.75-1.89 9.75-4.5V6.75c0-2.61-4.365-4.5-9.75-4.5Zm0 1.5c4.858 0 8.25 1.73 8.25 3s-3.392 3-8.25 3-8.25-1.73-8.25-3 3.392-3 8.25-3Zm0 8.25c4.858 0 8.25-1.73 8.25-3v2.25c0 1.27-3.392 3-8.25 3s-8.25-1.73-8.25-3V9c0 1.27 3.392 3 8.25 3Zm0 4.5c4.858 0 8.25-1.73 8.25-3v2.25c0 1.27-3.392 3-8.25 3s-8.25-1.73-8.25-3V13.5c0 1.27 3.392 3 8.25 3Z" />
                    </svg>
                  </span>
                  <input
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
                    onBlur={() => setTouched((t) => ({ ...t, amount: true }))}
                    onKeyDown={onKeyDown}
                    placeholder="e.g. 500"
                    className={`w-full rounded-xl bg-slate-900/70 pl-10 pr-3 py-3 text-white ring-1 outline-none placeholder:text-white/40
                      ${touched.amount && !amountValid
                        ? "ring-rose-500/50 focus:ring-rose-400"
                        : "ring-white/10 focus:ring-2 focus:ring-cyan-400"
                      }`}
                    autoComplete="off"
                    spellCheck={false}
                    type="tel"
                    inputMode="decimal"
                  />
                </div>

                {/* 10% toggle */}
                <div className="col-span-3">
                  <button
                    type="button"
                    onClick={() => setIsMinus((v) => !v)}
                    aria-pressed={isMinus}
                    title={
                      isMinus
                        ? "Minus selected — tap to switch to Plus"
                        : "Plus selected — tap to switch to Minus"
                    }
                    className={`group relative h-full w-full rounded-xl overflow-hidden transition-all duration-300 transform hover:scale-105 active:scale-95
    ${isMinus
                        ? "bg-gradient-to-br from-rose-500 to-rose-700 shadow-lg shadow-rose-500/50"
                        : "bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/50"
                      }`}
                  >
                    {/* Animated background glow */}
                    <div
                      className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
    ${isMinus
                          ? "bg-gradient-to-r from-rose-400/30 to-transparent"
                          : "bg-gradient-to-r from-emerald-400/30 to-transparent"
                        }`}
                    />

                    {/* Icon with animation */}
                    <span
                      className={`relative z-10 text-white font-bold text-3xl inline-block transition-all duration-300 group-hover:rotate-180 group-hover:scale-110
    ${isMinus
                          ? "drop-shadow-[0_2px_8px_rgba(244,63,94,0.5)]"
                          : "drop-shadow-[0_2px_8px_rgba(16,185,129,0.5)]"
                        }`}
                    >
                      {isMinus ? "−" : "+"}
                    </span>

                    {/* Shine effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div
                        className={`absolute top-0 -left-full h-full w-1/2 transform skew-x-12 transition-all duration-700 group-hover:left-full
      ${isMinus
                            ? "bg-gradient-to-r from-transparent via-rose-200/30 to-transparent"
                            : "bg-gradient-to-r from-transparent via-emerald-200/30 to-transparent"
                          }`}
                      />
                    </div>
                  </button>
                </div>
              </div>

              {touched.amount && !amountValid && (
                <p className="mt-1 text-xs text-rose-300">
                  পজিটিভ সংখ্যা দিন (চূড়ান্ত প্লাস/মাইনাস টোগল দিয়ে নিয়ন্ত্রণ
                  হবে)
                </p>
              )}

              {/* chips (always positive; toggle decides sign) */}
              <div className="mt-3 flex flex-wrap gap-2">
                {chips.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount(v)}
                    className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-white/80 ring-1 ring-white/10 hover:bg-white/10"
                  >
                    {isMinus ? `- ${v}` : `+ ${v}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSubmit}
              className={`relative w-full overflow-hidden rounded-xl px-4 py-3 font-semibold text-white ring-1 ring-white/10 transition
                ${!canSubmit
                  ? "bg-white/10 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-500 shadow-[0_10px_30px_-8px_rgba(79,70,229,0.55)]"
                }`}
              aria-disabled={!canSubmit}
            >
              {loading
                ? "Sending…"
                : `Send Coins (${isMinus ? "−" : "+"}${amount || 0})`}
            </button>

            <p className="text-[11px] text-white/50">
              নিরাপদ ট্রান্সফারের জন্য ইমেইলটি ভালো করে দেখে নিন।
            </p>
          </div>
        </div>

        {/* Right: Recent Transfers */}
        <div className="relative overflow-hidden rounded-2xl bg-[#0B0F19] ring-1 ring-white/10 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white/90">💰 Recent Transfers</h3>
            <span className="text-xs text-white/50">
              সর্বশেষ {recent?.length || 0} টি
            </span>
          </div>

          {/* Loading skeleton */}
          {recentLoading && (
            <div className="space-y-2" role="status" aria-live="polite">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 w-full animate-pulse rounded-xl bg-slate-800/50"
                />
              ))}
            </div>
          )}

          {/* List */}
          {!recentLoading && (
            <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
              {recent.map((t) => (
                <div
                  key={t._id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2"
                >
                  {/* email & time */}
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-white/90 truncate">
                      {t?.user?.email || "unknown@email"}
                    </div>
                    <div className="text-[11px] text-white/40">
                      {t?.createdAt
                        ? new Date(t.createdAt).toLocaleString()
                        : "—"}
                    </div>
                  </div>

                  {/* role + amount */}
                  <div className="flex items-center gap-2 shrink-0">
                    <RoleBadge role={t?.user?.role} />
                    <span
                      title={t?.type || "transfer"}
                      className={`rounded-lg px-2 py-1 text-xs ring-1 font-semibold tabular-nums
                        ${Number(t.amount) < 0
                          ? "bg-rose-500/15 ring-rose-500/30 text-rose-300"
                          : "bg-emerald-500/15 ring-emerald-500/30 text-emerald-300"
                        }`}
                    >
                      {Number(t.amount) > 0 ? `+${t.amount}` : t.amount}
                    </span>
                  </div>
                </div>
              ))}

              {!recent.length && (
                <div className="rounded-xl border border-white/10 bg-slate-900/40 p-6 text-center text-sm text-white/60">
                  No transfers yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
