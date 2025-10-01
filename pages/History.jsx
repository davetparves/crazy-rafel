// /app/users/history/page.jsx
'use client'
import React from 'react'
import useHistoryData from '@/hooks/useHistoryData'
import HistoryStrip from '../components/home/HistoryStrip'


export default function History() {
  const { email, loading, results, bets, error } = useHistoryData()

  return (
    <div
      className="min-h-screen relative overflow-hidden p-4 md:p-8 text-white
      bg-[radial-gradient(80%_60%_at_20%_10%,#3b0764_0%,#0b1220_60%,#030712_100%)]"
    >
      {/* Glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-32 h-72 w-72 rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <h1
          className="text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent
        bg-gradient-to-r from-fuchsia-300 via-violet-300 to-sky-300 drop-shadow"
        >
          📜 Cut History
        </h1>
        <div className="flex justify-center gap-4 items-center">
          <div className="h-px w-12 md:w-16 bg-fuchsia-400/30"></div>
          <span
            className="inline-block px-4 py-1.5 rounded-2xl
             text-sm md:text-base font-medium
             bg-white/10 backdrop-blur-md
             border border-white/20 shadow-lg
             text-transparent bg-clip-text
             bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-400
             hover:from-fuchsia-300 hover:to-violet-400
             transition-all duration-300"
          >
            {email ? email : 'Sign in to load your history'}
          </span>

          <div className="h-px w-12 md:w-16 bg-sky-400/30"></div>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="max-w-5xl mx-auto mb-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70">
            Loading…
          </div>
        </div>
      )}
      {error && !loading && (
        <div className="max-w-5xl mx-auto mb-6">
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">
            {error}
          </div>
        </div>
      )}

      {/* Results Strip (latest → oldest) */}
      {!loading && !error && <HistoryStrip results={results} />}

      {/* User Bets Table */}
      {!loading && !error && (
        <div className="max-w-5xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left font-medium text-fuchsia-300">
                    #
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left font-medium text-fuchsia-300">
                    Number
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left font-medium text-fuchsia-300">
                    Coins (Prize)
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left font-medium text-fuchsia-300">
                    Date & Time
                  </th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left font-medium text-fuchsia-300">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bets.map((b, idx) => {
                  const dt = b?.createdAt ? new Date(b.createdAt) : null
                  const dateText = dt ? dt.toLocaleString() : '--'
                  return (
                    <tr
                      key={b._id || `${b.number}-${idx}`}
                      className={`hover:bg-white/10 transition-colors ${
                        idx % 2 === 0 ? 'bg-white/5' : 'bg-transparent'
                      }`}
                    >
                      <td className="px-4 md:px-6 py-3 md:py-4 text-white/70">{idx + 1}</td>
                      <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-white">
                        {b.number}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-white/70">{b.prize}</td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-white/50">{dateText}</td>
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ring-1 ${
                            b.status === 'win'
                              ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30'
                              : b.status === 'loss'
                              ? 'bg-rose-500/15 text-rose-300 ring-rose-500/30'
                              : 'bg-amber-500/15 text-amber-300 ring-amber-500/30'
                          }`}
                        >
                          {b.status?.[0]?.toUpperCase() + b.status?.slice(1) || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {bets.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 md:px-6 py-6 text-center text-white/60">
                      No bets found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary (optional quick stats) */}
          <div className="bg-white/5 px-4 md:px-6 py-3 border-t border-white/10 text-sm flex flex-col md:flex-row md:justify-between md:items-center gap-2">
            <span className="text-white/60">Total Bets: {bets.length}</span>
            <span className="text-white/60">
              Wins: {bets.filter((b) => b.status === 'win').length}
            </span>
            <span className="text-white/60">
              Losses: {bets.filter((b) => b.status === 'loss').length}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
