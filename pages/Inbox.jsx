"use client";
import React from "react";

export default function Inbox() {
  // Static dummy messages
  const messages = [
    { id: 1, text: "🎉 Welcome to Crazy Rafel! Play daily & win coins!", time: "2025-07-28 12:30 PM", read: false, type: "welcome" },
    { id: 2, text: "📣 New update coming soon with 2x rewards! Stay tuned for exciting features.", time: "2025-07-27 6:15 PM", read: true, type: "announcement" },
    { id: 3, text: "💰 Admin gifted you 20 bonus coins for being an active player!", time: "2025-07-26 9:00 AM", read: false, type: "reward" },
    { id: 4, text: "⚠️ Scheduled maintenance on July 30th from 2:00 AM to 4:00 AM", time: "2025-07-25 3:45 PM", read: true, type: "alert" },
  ];

  const typeTheme = (type) => {
    switch (type) {
      case "welcome":
        return { grad: "from-violet-500/15 to-sky-500/10", ring: "ring-violet-400/20", chip: "bg-violet-500/15 text-violet-200 ring-violet-400/20" };
      case "reward":
        return { grad: "from-emerald-400/15 to-sky-400/10", ring: "ring-emerald-400/20", chip: "bg-emerald-400/15 text-emerald-200 ring-emerald-400/20" };
      case "alert":
        return { grad: "from-rose-500/15 to-rose-400/10", ring: "ring-rose-400/20", chip: "bg-rose-500/15 text-rose-200 ring-rose-400/20" };
      case "announcement":
        return { grad: "from-indigo-500/15 to-sky-500/10", ring: "ring-indigo-400/20", chip: "bg-indigo-500/15 text-indigo-200 ring-indigo-400/20" };
      default:
        return { grad: "from-violet-500/10 to-sky-500/10", ring: "ring-white/15", chip: "bg-white/10 text-white/80 ring-white/15" };
    }
  };

  const typeLabel = (type) =>
    ({ welcome: "Welcome", reward: "Reward", alert: "Alert", announcement: "Announcement" }[type] || "Message");

  return (
    <div className="min-h-screen relative overflow-hidden bg-[radial-gradient(80%_60%_at_20%_10%,#15142a_0%,#101734_60%,#0a1022_100%)] text-white p-4 md:p-8">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="absolute -bottom-28 -right-24 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
            <span className="bg-gradient-to-r from-violet-300 via-indigo-200 to-sky-300 bg-clip-text text-transparent">
              📥 Message Inbox
            </span>
          </h1>
          <div className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1.5 ring-1 ring-white/10 text-sm">
            Unread
            <span className="rounded-md bg-gradient-to-r from-violet-500 to-sky-500 px-2 py-0.5 text-xs font-semibold">
              2
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon="💰" label="Rewards" value="1" />
          <StatCard icon="⚠️" label="Alerts" value="1" />
          <StatCard icon="📢" label="Announcements" value="1" />
          <StatCard icon="👋" label="Welcome" value="1" />
        </div>

        {/* Messages */}
        <div className="grid gap-4 max-w-6xl">
          {messages.map((message) => {
            const theme = typeTheme(message.type);
            const unreadClasses = `bg-gradient-to-r ${theme.grad} ring-1 ${theme.ring}`;
            const readClasses = "bg-white/5 ring-1 ring-white/10";
            return (
              <div
                key={message.id}
                className={`group w-full text-left relative overflow-hidden rounded-2xl p-5 transition
                  hover:translate-y-[-1px] hover:ring-white/20 ${message.read ? readClasses : unreadClasses}`}
              >
                {/* Accent bar */}
                <span
                  className={`absolute left-0 top-0 h-full w-1.5 ${
                    message.read ? "bg-white/10" : "bg-gradient-to-b from-violet-400/60 to-sky-400/60"
                  }`}
                />
                {/* Unread ping */}
                {!message.read && (
                  <span className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-sky-300 animate-pulse" />
                )}

                <div className="flex items-start gap-4">
                  <div className="text-2xl p-3 rounded-xl bg-white/10 ring-1 ring-white/10">
                    {iconFor(message.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs ring-1 ${theme.chip}`}
                        >
                          {typeLabel(message.type)}
                        </span>
                        {!message.read && (
                          <span className="text-[11px] rounded-md bg-white/10 px-1.5 py-0.5 text-white/90 ring-1 ring-white/15">
                            New
                          </span>
                        )}
                      </div>
                      <span
                        className={`shrink-0 text-xs ${
                          message.read ? "text-white/50" : "text-white/70"
                        }`}
                      >
                        {message.time}
                      </span>
                    </div>

                    <p
                      className={`mt-2 leading-relaxed ${
                        message.read ? "text-white/85" : "text-white"
                      }`}
                    >
                      {message.text}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer stats */}
        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-white/10 text-center text-sm text-white/60">
          <p>Total: 4 • Unread: 2 • Last updated: 2025-07-28 12:30 PM</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Static UI Helpers ---------- */

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-3.5 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-sm text-white/70">{label}</span>
      </div>
      <span className="text-base font-semibold">{value}</span>
    </div>
  );
}

function iconFor(type) {
  switch (type) {
    case "welcome":
      return "👋";
    case "reward":
      return "💰";
    case "alert":
      return "⚠️";
    case "announcement":
      return "📢";
    default:
      return "✉️";
  }
}
