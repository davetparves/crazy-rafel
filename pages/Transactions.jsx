'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useUserStore } from '@/store/userStore'

/* ---------- Helpers ---------- */
const formatAmount = (n) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(n || 0)

const formatTime = (iso) => {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const badgeClass = (result) => {
  if (result === 'win') return 'bg-emerald-500/15 text-emerald-300 border-emerald-400/20'
  if (result === 'loss') return 'bg-rose-500/15 text-rose-300 border-rose-400/20'
  return 'bg-green-500/15 text-green-300 border-amber-400/20'
}

const FILTERS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7', label: 'Last 7 days' },
  { key: 'last30', label: 'Last 30 days' },
  { key: 'all', label: 'All' },
]

export default function TransactionsPage() {
  const [active, setActive] = useState('today')
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([])
  const [summary, setSummary] = useState({ count: 0, totalAmount: 0, wins: 0, losses: 0, pending: 0 })

  // Prefer Zustand; fallback to localStorage if you store it there
  const emailFromStore = useUserStore?.((s) => s?.email)
  const email = emailFromStore || (typeof window !== 'undefined' ? window.localStorage.getItem('email') : '')

  useEffect(() => {
    if (!email) return
    const controller = new AbortController()

    async function load() {
      try {
        setLoading(true)
        const res = await fetch('/api/transactions/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, range: active }),
          signal: controller.signal,
        })
        const json = await res.json()
        if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed to load')
        setItems(Array.isArray(json.transactions) ? json.transactions : [])
        setSummary(json.summary || { count: 0, totalAmount: 0, wins: 0, losses: 0, pending: 0 })
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.error(e)
          toast.error(jsonError(e) || 'Could not load transactions', { position: 'top-center' })
        }
      } finally {
        setLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [active, email])

  if (!email) {
    return (
      <div className="grid min-h-screen place-items-center text-white bg-[radial-gradient(80%_60%_at_20%_10%,#3b0764_0%,#0b1220_55%,#030712_100%)]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl text-center">
          <h2 className="mb-2 text-xl font-semibold">Sign in required</h2>
          <p className="mb-4 text-white/70">We couldn't find your email in session.</p>
          <Link href="/users/sign-in" className="inline-flex items-center rounded-xl px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-medium">
            Go to Sign In
          </Link>
        </div>
        <ToastContainer position="top-center" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-white bg-[radial-gradient(80%_60%_at_20%_10%,#3b0764_0%,#0b1220_55%,#030712_100%)]">
      <ToastContainer position="top-center" />

      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-16 h-[28rem] w-[28rem] rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl p-6">
        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-fuchsia-300 via-violet-200 to-cyan-200 bg-clip-text text-transparent">Transactions</span>
          </h1>
          <p className="text-sm text-white/70">See where you placed bets and how much on each number.</p>
        </motion.header>

        {/* Filters */}
        <div className="mb-6">
          <div className="inline-flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-xl">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setActive(f.key)}
                className={`rounded-xl px-3 py-1.5 text-sm font-medium ring-1 transition ${
                  active === f.key ? 'bg-gradient-to-r from-fuchsia-500 via-fuchsia-800 to-fuchsia-900 text-white shadow-md' : 'bg-white/5 hover:bg-white/10 ring-white/10 text-white/80'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <p className="text-xs text-white/60">Entries</p>
            <p className="text-2xl font-extrabold">{summary.count}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <p className="text-xs text-white/60">Wagered</p>
            <p className="text-2xl font-extrabold">{formatAmount(summary.totalAmount)}</p>
          </div>
          <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/10 p-4 backdrop-blur-xl">
            <p className="text-xs text-emerald-200/80">Wins</p>
            <p className="text-2xl font-extrabold text-emerald-200">{summary.wins}</p>
          </div>
          <div className="rounded-2xl border border-rose-400/15 bg-rose-500/10 p-4 backdrop-blur-xl">
            <p className="text-xs text-rose-200/80">Losses</p>
            <p className="text-2xl font-extrabold text-rose-200">{summary.losses}</p>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-white/60">
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Game</th>
                <th className="px-4 py-3">Numbers & bets</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Result</th>
                <th className="px-4 py-3">Payout</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t._id || t.id} className="border-t border-white/10 text-sm hover:bg-white/10 transition">
                  <td className="px-4 py-3  text-white/90">{formatTime(t.createdAt)}</td>
                  <td className="px-4 py-3 capitalize ">{t.type || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(t.bets) && t.bets.length > 0 ? (
                        t.bets.map((b, i) => (
                          <span key={i} className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/10 px-2 py-1 text-xs">
                            <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold">#{b.number}</span>
                            <span className="text-white/80">{formatAmount(b.amount)}</span>
                          </span>
                        ))
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/10 px-2 py-1 text-xs text-white/70">
                          Amount: <strong className="ml-1">{formatAmount(t.amount)}</strong>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatAmount(t.totalAmount || t.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${badgeClass(t.result)}`}>
                      {t.result || 'pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{t.payout ? formatAmount(t.payout) : <span className="text-white/50">—</span>}</td>
                </tr>
              ))}
              {items.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-white/60">No transactions</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden">
          <ul className="divide-y divide-white/10">
            {items.map((t) => (
              <li key={t._id || t.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px]  text-white/60">
                      {formatTime(t.createdAt)} • <span className="capitalize mr-4 bg-orange-500/15 py-1 rounded-full text-[10px] text-red-400 px-3">{t.type || '—'}</span>
                    </p>
                    <p className="mt-1 text-lg font-bold">{formatAmount(t.totalAmount || t.amount)}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${badgeClass(t.result)}`}>
                    {t.result || 'Success'}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Array.isArray(t.bets) && t.bets.length > 0 ? (
                    t.bets.map((b, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/10 px-2 py-1 text-xs">
                        <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold">#{b.number}</span>
                        <span className="text-white/80">{formatAmount(b.amount)}</span>
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/10 px-2 py-1 text-xs text-white/70">
                      Note: <strong className="ml-1">{t.note}</strong>
                    </span>
                  )}
                </div>
              </li>
            ))}
            {items.length === 0 && !loading && (
              <li className="p-8 text-center text-white/60">No transactions</li>
            )}
          </ul>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="fixed inset-0 z-40 grid place-items-center bg-black/30 backdrop-blur-sm">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm">Loading…</div>
          </div>
        )}
      </div>
    </div>
  )
}

function jsonError(e) {
  try {
    const msg = e?.message || ''
    return msg
  } catch {
    return null
  }
}
