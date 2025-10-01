// /components/agent/tabs/DashboardTab.jsx
'use client'
import React, { useEffect, useState, useMemo } from 'react'
import { useUserStore } from '../../../store/userStore'


export default function DashboardTab() {
  const email = useUserStore((s) => s.email)

  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true

    async function loadBalance() {
      setLoading(true)
      setError('')
      try {
        if (!email) {
          setError('Please sign in to view balance.')
          setBalance(0)
          return
        }
        const res = await fetch('/api/agents/balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
          cache: 'no-store',
        })
        const json = await res.json()
        if (!alive) return
        if (json?.success) {
          setBalance(Number(json?.data?.walletBalance || 0))
        } else {
          setError(json?.message || 'Failed to fetch balance.')
          setBalance(0)
        }
      } catch {
        if (alive) {
          setError('Network error while fetching balance.')
          setBalance(0)
        }
      } finally {
        if (alive) setLoading(false)
      }
    }

    loadBalance()
    return () => {
      alive = false
    }
  }, [email])

  const pretty = useMemo(() => Number(balance || 0).toLocaleString(), [balance])

  return (
    <div className="grid gap-4 md:gap-6 md:grid-cols-2">
      {/* My Balance card */}
      <div className="rounded-2xl bg-gradient-to-br from-fuchsia-500/10 to-sky-500/10 ring-1 ring-white/10 p-6 text-center shadow-inner">
        <h2 className="text-lg md:text-xl font-semibold mb-2">💰 My Balance</h2>

        {loading ? (
          <div className="mx-auto h-8 w-40 animate-pulse rounded-lg bg-white/10" />
        ) : error ? (
          <div className="text-sm text-rose-300">{error}</div>
        ) : (
          <p className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent">
            {pretty}
            <span className="text-sm md:text-lg text-white/70 ml-1">Coins</span>
          </p>
        )}

        <div className="mt-2 text-xs text-white/60">
          {email ? (
            <span className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1 ring-1 ring-white/10">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="truncate max-w-[220px]">{email}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1 ring-1 ring-white/10">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Sign in to load your balance</span>
            </span>
          )}
        </div>
      </div>

      {/* Tips card */}
      <div className="rounded-2xl ring-1 ring-white/10 p-6 bg-white/5">
        <h3 className="text-base md:text-lg font-semibold mb-3">Quick Tips</h3>
        <ul className="text-white/70 text-xs md:text-sm space-y-2 list-disc list-inside">
          <li>
            Update links from <span className="text-fuchsia-400">Links</span> tab.
          </li>
          <li>Review deposits & withdraws in their tabs.</li>
          <li>
            Track actions in <span className="text-sky-400">History</span>.
          </li>
        </ul>
      </div>
    </div>
  )
}
