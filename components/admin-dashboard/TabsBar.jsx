"use client";

import { CheckCheck, EllipsisVertical, X } from "lucide-react";
import React, { useEffect, useState, useCallback, useRef } from "react";


export default function TabsBar({ activeTab, setActiveTab, onSignOut, signingOut }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // body scroll-lock when drawer is open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // ESC to close
  const onKeyDown = useCallback((e) => {
    if (!open) return;
    if (e.key === "Escape") setOpen(false);
  }, [open]);

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  const links = [
    { id: "results", label: "Results", icon: "⏱️" },
    { id: "transfer", label: "Coin Transfer", icon: "💎" },
    { id: "subadmin", label: "Sub Admins", icon: "👑" },
    { id: "users", label: "User Management", icon: "👥" },
    { id: "notices", label: "Push Notices", icon: "📨" },
    { id: "editmulti", label: "Edit Multi", icon: "✏️" },
    { id: "activity", label: "User Activity", icon: "🎯" },
    { id: "company", label: "Company", icon: "🏢" },
  ];

  const handleSelect = (id) => {
    setActiveTab(id);
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/90 supports-[backdrop-filter]:bg-black/80 backdrop-blur">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6 py-2">
        <div className="flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-white/10 grid place-items-center ring-1 ring-white/20">⚙️</div>
            <div className="text-sm font-semibold tracking-tight truncate text-blue-200">Admin Panel</div>
          </div>

          {/* Actions: SWAPPED ORDER → Sign Out then Navigation (Navigation sits at far right) */}
          <div className="flex items-center gap-2">
            {/* Sign Out is now on the LEFT spot */}
            <button
              onClick={onSignOut}
              disabled={signingOut}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                signingOut
                  ? "bg-rose-500/40 text-white/80 cursor-not-allowed"
                  : "bg-gradient-to-r from-rose-600 to-red-600 text-white hover:opacity-90"
              }`}
              title="Sign Out"
            >
              {signingOut ? "Signing out…" : "Sign Out"}
            </button>

            {/* Navigation button moved to FAR RIGHT corner */}
            <button
              onClick={() => setOpen(true)}
              className="rounded-lg p-1 ring-1 ring-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium"
              aria-label="Open navigation menu"
            >
              <EllipsisVertical color="#b9d5f8" />
            </button>
          </div>
        </div>
      </div>

      {/* FULL-PAGE Drawer (solid black) */}
      <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}>
        {/* No translucent overlay; full black panel covers everything */}
        <aside
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className={`absolute inset-0 bg-black text-white transition-transform duration-300 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Top bar inside fullscreen panel */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="text-sm font-semibold">Navigate</div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md bg-white/10 hover:bg-white/15 p-1 text-xs"
              aria-label="Close navigation menu"
            >
              <X color="#ee5d82" />
            </button>
          </div>

          {/* Links: fill page nicely */}
          <div className="h-[calc(100vh-48px)] overflow-auto">
            <div className="mx-auto max-w-2xl bg-black px-4 py-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {links.map((l) => {
                const active = activeTab === l.id;
                return (
                  <button
                    key={l.id}
                    onClick={() => handleSelect(l.id)}
                    className={`h-12 rounded-xl text-base font-medium flex items-center justify-between gap-2 px-4 ring-1 transition-colors
                      ${active ? "bg-white/15 text-white ring-white/20" : "bg-white/5 hover:bg-white/10 text-white/85 ring-white/10"}`}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span aria-hidden>{l.icon}</span>
                      <span className="truncate">{l.label}</span>
                    </span>
                    {active ? <span className="text-xs"><CheckCheck color="#5deeaf" /></span> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </header>
  );
}
