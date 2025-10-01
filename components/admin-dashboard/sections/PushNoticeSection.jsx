"use client";

import React, { useMemo, useRef, useState } from "react";
import useSWR from "swr";
import axios from "axios";
import { ToastContainer, toast, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/** SWR fetcher (DB only) */
const fetcher = (url) => axios.get(url).then((r) => r.data);

// কনফিগ
const MAX_LEN = 280;

export default function PushNoticeSection() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  // 🔁 GET /api/notices (DB → সরাসরি)
  const { data, error, isLoading, mutate } = useSWR("/api/notices", fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  const notices = useMemo(() => {
    const base = data?.data || [];
    const sorted = [...base].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((n) => n.message?.toLowerCase().includes(q));
  }, [data, query]);

  const remain = MAX_LEN - text.length;

  // textarea auto-resize
  const taRef = useRef(null);
  const autoResize = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 320) + "px";
  };

  // 🚀 POST (create) — optimistic update
  const sendNotice = async () => {
    const message = text.trim();
    if (!message) {
      toast.warning("নোটিশ লিখুন।");
      return;
    }
    if (message.length > MAX_LEN) {
      toast.warning(`সর্বোচ্চ ${MAX_LEN} ক্যারেক্টার অনুমোদিত।`);
      return;
    }

    try {
      setLoading(true);

      // optimistic
      const optimistic = {
        _id: `temp-${Date.now()}`,
        message,
        createdAt: new Date().toISOString(),
        optimistic: true,
      };

      await mutate(
        async (prev) => {
          // server request
          const res = await axios.post("/api/notices", { message });
          if (res?.data?.success) {
            toast.success(res.data.message || "নোটিশ পাঠানো হয়েছে ✅");
            // fresh fetch
            const fresh = await axios.get("/api/notices");
            return fresh.data;
          } else {
            toast.error(res?.data?.message || "পাঠানো যায়নি");
            return prev;
          }
        },
        {
          optimisticData: (prev) => {
            const base = prev?.data || [];
            return { ...prev, data: [optimistic, ...base] };
          },
          rollbackOnError: true,
          revalidate: true,
          populateCache: true,
        }
      );

      setText("");
      taRef.current && (taRef.current.style.height = "auto");
    } catch (e) {
      toast.error(e?.response?.data?.message || "সার্ভারে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  // ⌨️ Ctrl/Cmd + Enter
  const onKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!loading) sendNotice();
    }
  };

  // 🗑️ DELETE — optimistic
  const deleteNotice = async (id) => {
    await mutate(
      async (prev) => {
        try {
          const res = await axios.delete(`/api/notices/${id}`);
          if (res?.data?.success) {
            toast.success("নোটিশ ডিলিট হয়েছে ✅");
            const fresh = await axios.get("/api/notices");
            return fresh.data;
          } else {
            toast.error(res?.data?.message || "ডিলিট ব্যর্থ");
            return prev;
          }
        } catch (e) {
          toast.error(e?.response?.data?.message || "সার্ভার ত্রুটি");
          throw e;
        }
      },
      {
        optimisticData: (prev) => {
          const base = prev?.data || [];
          return { ...prev, data: base.filter((n) => n._id !== id) };
        },
        rollbackOnError: true,
        revalidate: true,
        populateCache: true,
      }
    );
  };

  const fmt = (d) => {
    try {
      return new Date(d).toLocaleString();
    } catch {
      return d;
    }
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
          "relative flex p-3 min-h-10 rounded-xl bg-[#0B0F19] text-white ring-1 ring-white/10 shadow-lg"
        }
        bodyClassName={() => "text-sm font-medium"}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-fuchsia-300 via-violet-200 to-sky-300 bg-clip-text text-transparent">
            📨 Push Notices
          </span>
        </h2>

        {/* Search + Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notices…"
              className="w-56 rounded-xl bg-slate-900/70 pl-9 pr-3 py-2 text-sm ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-white/40"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/60">
              {/* search icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M10 3.5a6.5 6.5 0 015.06 10.62l4.41 4.41a1 1 0 01-1.42 1.42l-4.41-4.41A6.5 6.5 0 1110 3.5zm0 2a4.5 4.5 0 100 9 4.5 4.5 0 000-9z" />
              </svg>
            </span>
          </div>

          <button
            onClick={() => mutate()}
            className="rounded-lg bg-white/10 px-3 py-2 text-sm ring-1 ring-white/10 hover:bg-white/15"
            title="Refresh"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Composer (sticky style card) */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0B0F19] ring-1 ring-white/10">
        {/* header strip */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="text-sm font-semibold text-white/90">New Notice</div>
          <div
            className={`text-[11px] font-mono ${
              remain < 0 ? "text-rose-300" : "text-white/60"
            }`}
          >
            {remain} left
          </div>
        </div>

        <div className="p-4">
          <div className="group relative">
            <textarea
              ref={taRef}
              rows={4}
              maxLength={5000} // hard cap (UI cap is MAX_LEN)
              className="w-full rounded-xl px-4 py-3 bg-slate-900/70 ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-white/40"
              placeholder="Write your notice (Ctrl/⌘ + Enter to send)…"
              value={text}
              onChange={(e) => {
                const v = e.target.value.slice(0, MAX_LEN + 200); // টাইপিং স্মুথ রাখতে ছোট বাফার
                setText(v);
                autoResize();
              }}
              onInput={autoResize}
              onKeyDown={onKeyDown}
              disabled={loading}
            />
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-[11px] text-white/50">
              * কোনো স্প্যাম/ডুপ্লিকেট নোটিশ পাঠাবেন না—সব ইউজারের কাছে পৌঁছাবে।
            </p>
            <button
              onClick={sendNotice}
              disabled={loading || !text.trim()}
              className={`rounded-xl px-4 py-2.5 font-bold transition ring-1 ring-white/10
                ${
                  loading || !text.trim()
                    ? "bg-white/10 text-white/60 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-500 shadow-[0_10px_30px_-8px_rgba(79,70,229,0.55)]"
                }`}
            >
              {loading ? "Sending…" : "Send Notice"}
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0B0F19] ring-1 ring-white/10">
        <div className="px-4 py-3 border-b border-white/10">
          <h3 className="font-semibold text-white/90">All Notices</h3>
        </div>

        <div className="p-4">
          {isLoading && (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 w-full animate-pulse rounded-xl bg-slate-800/50" />
              ))}
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-center text-sm text-rose-200">
              ডেটা লোড করা যায়নি।
            </div>
          )}

          {!isLoading && !error && notices.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-slate-900/40 p-6 text-center text-sm text-white/60">
              No notices yet.
            </div>
          )}

          {!isLoading && !error && notices.length > 0 && (
            <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
              {notices.map((n) => (
                <div
                  key={n._id}
                  className="group relative rounded-xl border border-white/10 bg-slate-900/60 px-3 py-3"
                >
                  {/* delete button */}
                  <div className="absolute right-2 top-2 flex items-center gap-2">
                    {n.optimistic && (
                      <span className="text-[10px] rounded-md bg-amber-500/20 px-2 py-0.5 text-amber-200 ring-1 ring-amber-500/30">
                        sending…
                      </span>
                    )}
                    <button
                      onClick={() => deleteNotice(n._id)}
                      className="rounded-md bg-white/10 p-1 text-white/80 ring-1 ring-white/10 hover:bg-white/15"
                      title="Delete"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M9 3a1 1 0 0 0-1 1v1H5.5a1 1 0 1 0 0 2H6v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7h.5a1 1 0 1 0 0-2H16V4a1 1 0 0 0-1-1H9Zm2 2h3v1h-3V5Z" />
                      </svg>
                    </button>
                  </div>

                  <div className="pr-16 text-white/90">{n.message}</div>
                  <div className="mt-1 text-[11px] text-white/50">⏱ {fmt(n.createdAt)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
