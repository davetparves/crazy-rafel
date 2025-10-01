"use client";

import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/**
 * 🔥 এই কম্পোনেন্টে যা করা হয়:
 * - ইমেইল ও রোল ইনপুট নেই
 * - POST /api/subadmin এ পাঠায়
 * - সফল হলে টোস্ট দেখায় এবং নিচে আপডেট হওয়া ইউজারের ইমেইল+রোল কার্ডে দেখায়
 */
export default function SubAdminSection() {
  // 🧩 লোকাল স্টেট
  const [email, setEmail] = useState("");
  const [role, setRole]   = useState("user"); // ডিফল্ট user
  const [loading, setLoading] = useState(false);
  const [updatedUser, setUpdatedUser] = useState(null);

  // 🚀 সাবমিট হ্যান্ডলার
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.warning("ইমেইল দিন।");
      return;
    }
    if (!role) {
      toast.warning("রোল সিলেক্ট করুন।");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post("/api/subadmin", {
        email,
        role,
      });

      if (res?.data?.success) {
        toast.success("রোল আপডেট হয়েছে ✅");
        setUpdatedUser(res.data.data); // নিচে কার্ডে দেখাবে
        // চাইলে ইনপুট ফাঁকা করতে পারেন:
        // setEmail(""); setRole("user");
      } else {
        toast.error(res?.data?.message || "আপডেট ব্যর্থ হয়েছে");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.status === 404 ? "ইউজার পাওয়া যায়নি" : "সার্ভারে সমস্যা হয়েছে");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ইউজার ভিজ্যুয়াল কার্ড (রেসপন্স আসলে দেখায়)
  const UserCard = ({ user }) => {
    if (!user) return null;
    const badge =
      user.role === "admin"
        ? "bg-violet-500/15 text-violet-300 ring-violet-500/30"
        : user.role === "agent"
        ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30"
        : "bg-sky-500/15 text-sky-300 ring-sky-500/30";

    return (
     <div className="group relative rounded-2xl p-[1px] bg-gradient-to-r from-fuchsia-500/25 via-violet-500/25 to-sky-500/25">
  <div className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl ring-1 ring-white/10 p-4">
    {/* soft glows */}
    <div className="pointer-events-none absolute -top-12 -right-10 h-28 w-28 rounded-full bg-fuchsia-500/15 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-12 -left-10 h-28 w-28 rounded-full bg-sky-500/15 blur-3xl" />

    <div className="relative flex items-start justify-between gap-3">
      {/* left: avatar + email */}
      <div className="min-w-0 flex items-center gap-3">
        {/* avatar from email initial */}
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white font-bold ring-1 ring-white/20">
          {user.email?.charAt(0)?.toUpperCase()}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-white/90 font-medium">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4.5 w-4.5 text-white/60"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M1.5 6.75A2.25 2.25 0 0 1 3.75 4.5h16.5a2.25 2.25 0 0 1 2.25 2.25v10.5A2.25 2.25 0 0 1 20.25 19.5H3.75A2.25 2.25 0 0 1 1.5 17.25V6.75Zm2.694-.75a.75.75 0 0 0-.57 1.255l7.056 7.944a.75.75 0 0 0 1.14 0l7.056-7.944a.75.75 0 0 0-.57-1.255H4.194Z" />
            </svg>
            <span className="truncate">{user.email}</span>
          </div>
        </div>
      </div>

      {/* right: role badge */}
      <span
        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ${badge}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2 3 7v6c0 5 4 7 9 9 5-2 9-4 9-9V7l-9-5Zm0 2.15L19 7v5.5c0 3.98-2.96 5.72-7 7.51-4.04-1.79-7-3.53-7-7.51V7l7-2.85Z" />
        </svg>
        {user.role}
      </span>
    </div>

    {/* subtle hover border glow */}
    <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-transparent group-hover:ring-white/15 transition" />
  </div>
</div>

    );
  };

  return (
    <section className="space-y-5">
      {/* Toast (Top-Right, 1200ms) */}
      <ToastContainer
        position="top-right"
        autoClose={1200}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover={false}
        theme="dark"
        style={{ zIndex: 9999, top: 12, right: 12 }}
        toastClassName={() =>
          "relative flex p-3 min-h-10 rounded-xl bg-slate-900/90 text-white backdrop-blur-xl ring-1 ring-white/10 shadow-lg"
        }
        bodyClassName={() => "text-sm font-medium"}
      />

      <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
        <span className="bg-gradient-to-r from-fuchsia-300 via-violet-200 to-sky-300 bg-clip-text text-transparent">
          👑 Sub Admins
        </span>
      </h2>

      {/* ফর্ম */}
      <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-3">
        {/* Email */}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="rounded-lg px-4 py-3 bg-slate-900/60 ring-1 ring-white/10 md:col-span-2 outline-none focus:ring-2 focus:ring-fuchsia-400"
        />

        {/* Role */}
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-lg px-4 py-3 bg-slate-900/60 ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-sky-400"
        >
          {/* value গুলো ব্যাকএন্ড enum এর সাথে মিলে (user/admin/agent) */}
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="agent">Agent</option>
        </select>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className={`rounded-lg px-4 py-2 font-bold md:col-span-3 transition
            ${
              loading
                ? "bg-white/10 text-white/70 cursor-not-allowed"
                : "bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 text-white hover:opacity-90"
            }`}
        >
          {loading ? "Updating…" : "Create / Update"}
        </button>
      </form>

      {/* 🔽 আপডেটেড ইউজার দেখানোর কার্ড */}
      <UserCard user={updatedUser} />
    </section>
  );
}
