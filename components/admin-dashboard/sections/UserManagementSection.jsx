"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

/* -------- role badge (ui only) -------- */
const roleBadge = (r) => {
  const base =
    "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1";
  switch (r) {
    case "admin":
      return `${base} bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-500/30`;
    case "agent":
      return `${base} bg-amber-500/15 text-amber-300 ring-amber-500/30`;
    default:
      return `${base} bg-emerald-500/15 text-emerald-300 ring-emerald-500/30`;
  }
};

/* -------- tiny avatar from email initial -------- */
const Avatar = ({ email, i = 0 }) => {
  const initial = (email || "?").charAt(0).toUpperCase();
  const palette = [
    "from-fuchsia-500 to-violet-500",
    "from-emerald-500 to-cyan-500",
    "from-sky-500 to-indigo-500",
    "from-rose-500 to-orange-500",
  ];
  const grad = palette[i % palette.length];
  return (
    <div className="relative">
      <div
        className={`h-10 w-10 sm:h-9 sm:w-9 shrink-0 rounded-full bg-gradient-to-br ${grad} grid place-items-center text-white font-bold ring-1 ring-white/20 shadow-[0_6px_18px_-6px_rgba(0,0,0,0.6)]`}
      >
        {initial}
      </div>
      <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900/80" />
    </div>
  );
};

/* -------- filter categories -------- */
const CATEGORIES = [
  { value: "all", label: "All", group: "General" },
  { value: "latest", label: "Latest users", group: "General" },
  { value: "old", label: "Old users", group: "General" },

  { value: "admin", label: "Admin", group: "Role" },
  { value: "agent", label: "Agent", group: "Role" },
  { value: "user", label: "User", group: "Role" },

  { value: "high_balance", label: "High balance", group: "Balance" },
  { value: "low_balance", label: "Low balance", group: "Balance" },
];

/* -------- sort options -------- */
const SORTS = [
  { key: "email", label: "Email" },
  { key: "walletBalance", label: "Wallet" },
  { key: "role", label: "Role" },
];

export default function UserManagementSection() {
  const [search, setSearch] = useState(""); // 🔎 ইমেইল সার্চ
  const [category, setCategory] = useState("all"); // 🧭 ড্রপডাউন ক্যাটেগরি

  const [sortKey, setSortKey] = useState("email"); // ↕️ সোর্ট কী
  const [sortDir, setSortDir] = useState("desc"); // asc | desc

  const [page, setPage] = useState(1); // 📄 পেজ
  const [limit, setLimit] = useState(20); // 🔢 লিমিট

  const [users, setUsers] = useState([]); // 📦 সার্ভার ডেটা
  const [total, setTotal] = useState(0); // 🔢 টোটাল কাউন্ট (API থেকে)
  const [loading, setLoading] = useState(false); // ⏳ লোডিং স্টেট
  const [error, setError] = useState("");

  const [copiedId, setCopiedId] = useState(null); // 📋 কপি ফিডব্যাক

  // 🚀 সার্ভার থেকে ইউজার আনবে (POST /api/users/query)
  const fetchUsers = async (signal) => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.post(
        "/api/users/query",
        {
          search,
          category,
          page,
          limit,
          sort: { key: sortKey, dir: sortDir }, // (আপনার API চাইলে ব্যবহার করবে)
        },
        { signal }
      );

      setUsers(res?.data?.data || []);
      setTotal(Number(res?.data?.total ?? (res?.data?.data || []).length));
    } catch (e) {
      setUsers([]);
      setTotal(0);
      setError(
        e?.response?.data?.message ||
          (axios.isCancel(e) ? "" : "ডেটা লোড করা যায়নি")
      );
    } finally {
      setLoading(false);
    }
  };

  // 🔁 সার্চ/ক্যাটেগরি/সোর্ট/পেজ/লিমিট পরিবর্তনে API কল (ডিবাউন্স)
  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => fetchUsers(ctrl.signal), 300);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, sortKey, sortDir, page, limit]);

  /* 📊 স্ট্যাটস (role ভিত্তিক + মোট ব্যালেন্স) */
  const { adminCount, agentCount, userCount, totalBalance } = useMemo(() => {
    const a = users.filter((u) => u.role === "admin").length;
    const g = users.filter((u) => u.role === "agent").length;
    const u = users.filter((u) => u.role === "user").length;
    const sum = users.reduce(
      (acc, cur) => acc + (Number(cur.walletBalance) || 0),
      0
    );
    return { adminCount: a, agentCount: g, userCount: u, totalBalance: sum };
  }, [users]);

  const pages = Math.max(1, Math.ceil(total / Math.max(1, limit)));

  const copyEmail = async (id, email) => {
    try {
      await navigator.clipboard.writeText(email || "");
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1200);
    } catch {
      // ignore
    }
  };

  return (
    <section className="space-y-6 text-white">
      {/* header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-fuchsia-300 via-violet-200 to-sky-300 bg-clip-text text-transparent">
            👥 User Management
          </span>
        </h2>

        {/* desktop controls */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Search */}
          <div className="group relative">
            <div className="pointer-events-none absolute inset-0 -z-10 rounded-xl opacity-0 blur transition duration-300 group-focus-within:opacity-100 bg-gradient-to-r from-fuchsia-400/20 via-violet-400/20 to-sky-400/20" />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4.5 w-4.5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M10 3.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Zm7.03 11.47 3.25 3.25a1 1 0 1 1-1.41 1.41l-3.25-3.25A8.5 8.5 0 1 1 10 1.5a8.5 8.5 0 0 1 7.03 13.47Z" />
                </svg>
              </span>
              <input
                aria-label="Search users by email"
                placeholder="Search email…"
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                className="w-56 rounded-xl bg-slate-900/70 pl-9 pr-3 py-2 text-sm ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-fuchsia-400 placeholder:text-white/45"
              />
            </div>
          </div>

          {/* Category */}
          <select
            aria-label="Filter category"
            className="rounded-xl bg-slate-900/70 px-3 py-2 text-sm ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-sky-400"
            value={category}
            onChange={(e) => {
              setPage(1);
              setCategory(e.target.value);
            }}
          >
            <optgroup label="General">
              {CATEGORIES.filter((c) => c.group === "General").map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Role">
              {CATEGORIES.filter((c) => c.group === "Role").map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Balance">
              {CATEGORIES.filter((c) => c.group === "Balance").map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </optgroup>
          </select>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <select
              aria-label="Sort by"
              className="rounded-xl bg-slate-900/70 px-3 py-2 text-sm ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-indigo-400"
              value={sortKey}
              onChange={(e) => {
                setPage(1);
                setSortKey(e.target.value);
              }}
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  Sort: {s.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setPage(1);
                setSortDir((d) => (d === "asc" ? "desc" : "asc"));
              }}
              className="rounded-xl bg-slate-900/70 px-3 py-2 text-sm ring-1 ring-white/10 outline-none hover:bg-slate-900/60"
              title="Toggle sort direction"
            >
              {sortDir === "asc" ? "↑" : "↓"}
            </button>
          </div>

          {/* Limit */}
          <select
            aria-label="Rows per page"
            className="rounded-xl bg-slate-900/70 px-3 py-2 text-sm ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-indigo-400"
            value={limit}
            onChange={(e) => {
              setPage(1);
              setLimit(Number(e.target.value) || 20);
            }}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}/page
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-2xl p-3 ring-1 ring-white/10 bg-[#0B0F19]">
          <div className="text-[11px] uppercase tracking-wide text-white/60">
            Total
          </div>
          <div className="mt-1 text-2xl font-extrabold">{total}</div>
        </div>
        <div className="rounded-2xl p-3 ring-1 ring-white/10 bg-[#0B0F19]">
          <div className="text-[11px] uppercase tracking-wide text-white/60">
            Admins
          </div>
          <div className="mt-1 text-2xl font-extrabold">{adminCount}</div>
        </div>
        <div className="rounded-2xl p-3 ring-1 ring-white/10 bg-[#0B0F19]">
          <div className="text-[11px] uppercase tracking-wide text-white/60">
            Agents
          </div>
          <div className="mt-1 text-2xl font-extrabold">{agentCount}</div>
        </div>
        <div className="rounded-2xl p-3 ring-1 ring-white/10 bg-[#0B0F19]">
          <div className="text-[11px] uppercase tracking-wide text-white/60">
            Users
          </div>
          <div className="mt-1 text-2xl font-extrabold">{userCount}</div>
        </div>
        <div className="rounded-2xl p-3 ring-1 ring-white/10 bg-[#0B0F19]">
          <div className="text-[11px] uppercase tracking-wide text-white/60">
            Balance
          </div>
          <div className="mt-1 text-2xl font-extrabold tabular-nums">
            {Number(totalBalance).toLocaleString()}
          </div>
        </div>
      </div>

      {/* mobile list (cards) */}
      <div className="sm:hidden grid gap-3">
        {loading && (
          <>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-2xl bg-slate-800/50 animate-pulse"
              />
            ))}
          </>
        )}

        {!loading &&
          users.map((u, i) => (
            <div
              key={u._id || i}
              className="relative overflow-hidden rounded-2xl ring-1 ring-white/10 p-3 bg-white/[0.06] backdrop-blur-xl"
            >
              <div className="relative flex items-center gap-3">
                <Avatar email={u.email} i={i} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-white/90 truncate">
                      {u.email}
                    </div>
                    <button
                      onClick={() => copyEmail(u._id, u.email)}
                      className="text-[11px] rounded bg-white/10 px-1.5 py-0.5 ring-1 ring-white/10 hover:bg-white/15 shrink-0"
                    >
                      {copiedId === u._id ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-0.5 ring-1 ring-white/10">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2.25C6.615 2.25 2.25 4.14 2.25 6.75v10.5c0 2.61 4.365 4.5 9.75 4.5s9.75-1.89 9.75-4.5V6.75c0-2.61-4.365-4.5-9.75-4.5Z" />
                      </svg>
                      <span className="font-semibold tabular-nums">
                        {u.walletBalance ?? 0}
                      </span>
                    </span>
                    <span className={roleBadge(u.role)}>{u.role}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

        {!loading && users.length === 0 && !error && (
          <div className="rounded-2xl p-6 text-center text-white/60 ring-1 ring-white/10 bg-white/5">
            No users to display.
          </div>
        )}
        {error && (
          <div className="rounded-2xl p-6 text-center text-rose-300 ring-1 ring-rose-500/30 bg-rose-500/10">
            {error}
          </div>
        )}
      </div>

      {/* table for sm+ screens */}
      <div className="hidden sm:block overflow-hidden rounded-2xl bg-white/[0.06] backdrop-blur-xl ring-1 ring-white/10">
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gradient-to-r from-white/10 to-white/5 text-white/80">
                <th className="p-3 text-left font-semibold">User</th>
                <th className="p-3 text-left font-semibold">Wallet</th>
                <th className="p-3 text-left font-semibold">Role</th>
                <th className="p-3 text-left font-semibold w-[120px]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <>
                  {[...Array(6)].map((_, i) => (
                    <tr key={i} className="border-t border-white/10">
                      <td colSpan={4} className="p-3">
                        <div className="h-10 rounded bg-slate-800/50 animate-pulse" />
                      </td>
                    </tr>
                  ))}
                </>
              )}

              {!loading &&
                users.map((u, i) => (
                  <tr
                    key={u._id || i}
                    className="border-t border-white/10 hover:bg-white/[0.07] transition-colors"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar email={u.email} i={i} />
                        <div className="min-w-0">
                          <div className="font-medium text-white/90 truncate">
                            {u.email}
                          </div>
                          <div className="text-xs text-white/50">
                            ID: {u._id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-1 ring-1 ring-white/10">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4.5 w-4.5"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2.25C6.615 2.25 2.25 4.14 2.25 6.75v10.5c0 2.61 4.365 4.5 9.75 4.5s9.75-1.89 9.75-4.5V6.75c0-2.61-4.365-4.5-9.75-4.5Z" />
                        </svg>
                        <span className="font-semibold tabular-nums">
                          {u.walletBalance ?? 0}
                        </span>
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={roleBadge(u.role)}>{u.role}</span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => copyEmail(u._id, u.email)}
                        className="rounded-lg bg-white/10 px-3 py-1 ring-1 ring-white/10 hover:bg-white/15 text-xs"
                      >
                        {copiedId === u._id ? "Copied" : "Copy Email"}
                      </button>
                    </td>
                  </tr>
                ))}

              {!loading && users.length === 0 && !error && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-white/60">
                    No users to display.
                  </td>
                </tr>
              )}
              {error && !loading && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-rose-300">
                    {error}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* pagination */}
        <div className="flex items-center justify-between gap-2 border-t border-white/10 p-3">
          <div className="text-xs text-white/60">
            Page <span className="font-semibold">{page}</span> of{" "}
            <span className="font-semibold">{pages}</span> • Showing{" "}
            <span className="font-semibold">{users.length}</span> /{" "}
            <span className="font-semibold">{total}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="rounded-lg bg-white/10 px-3 py-1 ring-1 ring-white/10 hover:bg-white/15 disabled:opacity-50 text-sm"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages || loading}
              className="rounded-lg bg-white/10 px-3 py-1 ring-1 ring-white/10 hover:bg-white/15 disabled:opacity-50 text-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* mobile controls */}
      <div className="sm:hidden grid grid-cols-2 gap-2">
        <input
          aria-label="Search users"
          placeholder="Search email…"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="rounded-xl bg-slate-900/70 px-3 py-2 text-sm ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-fuchsia-400 placeholder:text-white/45"
        />
        <select
          aria-label="Filter category"
          className="rounded-xl bg-slate-900/70 px-3 py-2 text-sm ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-sky-400"
          value={category}
          onChange={(e) => {
            setPage(1);
            setCategory(e.target.value);
          }}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        {/* mobile extras: sort + limit */}
        <select
          aria-label="Sort by"
          className="rounded-xl bg-slate-900/70 px-3 py-2 text-sm ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-indigo-400"
          value={sortKey}
          onChange={(e) => {
            setPage(1);
            setSortKey(e.target.value);
          }}
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              Sort: {s.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Rows per page"
          className="rounded-xl bg-slate-900/70 px-3 py-2 text-sm ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-indigo-400"
          value={limit}
          onChange={(e) => {
            setPage(1);
            setLimit(Number(e.target.value) || 20);
          }}
        >
          {[10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n}/page
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
