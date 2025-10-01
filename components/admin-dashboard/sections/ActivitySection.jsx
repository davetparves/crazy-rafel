'use client'

import React, { useEffect, useMemo, useState } from 'react'

/* ---------- Small utilities ---------- */
const fmtInt = (n) => Number(n || 0).toLocaleString()
const fmtMoney = (n) => `${Number(n || 0).toLocaleString()} $`

/* ---------- Reusable chip ---------- */
const StatChip = ({ icon, label, value, tint, noTruncate = false }) => (
  <div className={`rounded-lg p-2.5 ring-1 ${tint} bg-white/5 backdrop-blur-sm flex items-center gap-2 overflow-hidden`}>
    <span className="grid h-8 w-8 place-items-center rounded-md bg-white/10 shrink-0">{icon}</span>
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-white/60 leading-none">{label}</p>
      <p className={`text-[13px] font-semibold text-white/90 leading-tight ${noTruncate ? '' : 'truncate'}`}>
        {value}
      </p>
    </div>
  </div>
)

export default function ActivitySection() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // auto-refresh
  const [auto, setAuto] = useState(true)
  const [tick, setTick] = useState(0) // force refresh key

  // fetch once (and when tick changes)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/pending-numbers', { cache: 'no-store' })
        if (!res.ok) throw new Error('Network response was not ok')
        const data = await res.json()
        if (!mounted) return
        const next = Array.isArray(data?.items) ? data.items : []
        setItems(next)
      } catch (e) {
        if (mounted) setError('Failed to load data.')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [tick])

  // interval for auto refresh


  const refreshNow = () => setTick((t) => t + 1)

  // summary (people/amount/prize totals)
  const summary = useMemo(() => {
    const totalNumbers = items.length
    const people = items.reduce((s, it) => s + Number(it.people || 0), 0)
    const amount = items.reduce((s, it) => s + Number(it.amount || 0), 0)
    const prize = items.reduce((s, it) => s + Number(it.prize || 0), 0)
    return { totalNumbers, people, amount, prize }
  }, [items])

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg md:text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-300 via-violet-300 to-sky-300">
          🎯 Live User Activity
        </h2>

        
      </div>

      {/* Error */}
      {error && (
        <div className="text-[12px] text-rose-300 bg-rose-500/10 ring-1 ring-rose-500/30 p-2 rounded-md flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={refreshNow}
            className="rounded bg-white/10 px-2 py-0.5 text-rose-100 ring-1 ring-white/10 hover:bg-white/15"
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatChip
          tint="ring-violet-400/30"
          label="Numbers"
          value={fmtInt(summary.totalNumbers)}
          icon={
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 text-violet-300" fill="currentColor">
              <path d="M5 3h14v2H5V3zm2 4h10v2H7V7zm-2 4h14v2H5v-2zm2 4h10v2H7v-2zm-2 4h14v2H5v-2z" />
            </svg>
          }
        />
        <StatChip
          tint="ring-cyan-400/30"
          label="People"
          value={fmtInt(summary.people)}
          icon={
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 text-cyan-300" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zM8 11c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.67 0-8 1.34-8 4v2h10v-2c0-.69.18-1.35.5-1.94C9.63 13.76 8.82 13 8 13zm8 0c-.82 0-1.63.76-2.5 2.06.32.59.5 1.25.5 1.94v2h10v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          }
        />
        <StatChip
          tint="ring-emerald-400/30"
          label="Amount"
          value={fmtMoney(summary.amount)}
          icon={
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 text-emerald-300" fill="currentColor">
              <path d="M12 4C7.03 4 3 6.24 3 9s4.03 5 9 5 9-2.24 9-5-4.03-5-9-5Zm0 9c-4.97 0-9-2.24-9-5v7c0 2.76 4.03 5 9 5s9-2.24 9-5V8c0 2.76-4.03 5-9 5Z" />
            </svg>
          }
        />
        <StatChip
          tint="ring-amber-400/30"
          label="Prize"
          value={fmtMoney(summary.prize)}
          icon={
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 text-amber-300" fill="currentColor">
              <path d="M12 2l2.39 4.84L20 8l-4 3.9.95 5.54L12 15.77l-4.95 3.67L8 11.9 4 8l5.61-1.16z" />
            </svg>
          }
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-[158px] rounded-xl bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-slate-900/40 p-6 text-center text-sm text-white/70">
          No pending numbers to show.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {items.map((it, idx) => (
            <div
              key={it.number ?? idx}
              className="relative p-[1.5px] rounded-xl bg-[conic-gradient(at_30%_0%,#a78bfa22_0deg,#22d3ee22_120deg,#fb718522_240deg,#a78bfa22_360deg)]"
            >
              <div className="rounded-xl bg-slate-950/70 ring-1 ring-white/10 p-3 shadow-[0_8px_26px_rgba(0,0,0,0.35)] overflow-hidden">
                {/* header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-flex h-5 px-1.5 items-center justify-center rounded-md text-[10px] font-semibold text-white/90 bg-white/10 ring-1 ring-white/10">
                      #{String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] text-white/60 truncate">Updated just now</span>
                  </div>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_2px_rgba(16,185,129,0.25)]" />
                </div>

                {/* 2x2 mini-cards */}
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <StatChip
                    tint="ring-violet-400/30"
                    label="Number"
                    value={String(it.number)}
                    noTruncate
                    icon={
                      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 text-violet-300" fill="currentColor">
                        <path d="M5 3h14v2H5V3zm2 4h10v2H7V7zm-2 4h14v2H5v-2zm2 4h10v2H7v-2zm-2 4h14v2H5v-2z" />
                      </svg>
                    }
                  />
                  <StatChip
                    tint="ring-cyan-400/30"
                    label="People"
                    value={`${fmtInt(it.people)} users`}
                    icon={
                      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 text-cyan-300" fill="currentColor">
                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zM8 11c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.67 0-8 1.34-8 4v2h10v-2c0-.69.18-1.35.5-1.94C9.63 13.76 8.82 13 8 13zm8 0c-.82 0-1.63.76-2.5 2.06.32.59.5 1.25.5 1.94v2h10v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    }
                  />
                  <StatChip
                    tint="ring-emerald-400/30"
                    label="Amount"
                    value={fmtMoney(it.amount)}
                    icon={
                      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 text-emerald-300" fill="currentColor">
                        <path d="M12 4C7.03 4 3 6.24 3 9s4.03 5 9 5 9-2.24 9-5-4.03-5-9-5Zm0 9c-4.97 0-9-2.24-9-5v7c0 2.76 4.03 5 9 5s9-2.24 9-5V8c0 2.76-4.03 5-9 5Z" />
                      </svg>
                    }
                  />
                  <StatChip
                    tint="ring-amber-400/30"
                    label="Prize"
                    value={fmtMoney(it.prize)}
                    icon={
                      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 text-amber-300" fill="currentColor">
                        <path d="M12 2l2.39 4.84L20 8l-4 3.9.95 5.54L12 15.77l-4.95 3.67L8 11.9 4 8l5.61-1.16z" />
                      </svg>
                    }
                  />
                </div>

                {/* footer */}
                <div className="mt-3 flex items-center justify-between text-[10px] text-white/60">
                  <span className="inline-flex items-center gap-1">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                      <path d="M13 3a9 9 0 100 18 9 9 0 000-18zm.5 4v5.25l4 2.37-.75 1.23L12 13V7h1.5z" />
                    </svg>
                    Real-time (pending)
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                      <path d="M12 2L2 7l10 5 10-5-10-5zm0 7.2L4.24 7 12 3.8 19.76 7 12 9.2zM2 17l10 5 10-5" />
                    </svg>
                    Secure pool
                  </span>
                </div>

                {/* soft glows */}
                <div className="pointer-events-none absolute -top-5 -left-5 h-20 w-20 rounded-full bg-fuchsia-500/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-sky-500/10 blur-3xl" />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
