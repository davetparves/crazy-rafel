// /components/users/home/HistoryCard.jsx
'use client'
import React from 'react'

const MiniNumCard = React.memo(function MiniNumCard({ label, value, tint, compact }) {
  return (
    <div
      className={`rounded-xl border border-violet-500/70 shadow-amber-200 bg-white/5 ${
        compact ? 'p-2' : 'p-3'
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`${
            compact ? 'text-[7px]' : 'text-[11px]'
          } uppercase tracking-wide text-white/60`}
        >
          {label}
        </span>
        <span className={`h-2 w-2 rounded-full ${tint}`} />
      </div>
      <div className={`mt-1 ${compact ? 'text-[14px]' : 'text-sm'} font-extrabold tabular-nums`}>
        {value}
      </div>
    </div>
  )
})

const HistoryCard = React.memo(function HistoryCard({ title, subtitle, nums, compact = false }) {
  return (
    <div className="p-[2px] rounded-2xl bg-gradient-to-br from-fuchsia-500/25 via-violet-500/25 to-sky-500/25 shadow-[0_0_40px_-18px_rgba(99,102,241,0.5)]">
      <div
        className={`rounded-2xl bg-slate-950/60 ring-1 ring-white/10 ${compact ? 'p-3' : 'p-4'}`}
      >
        <div className="flex items-center justify-between">
          <h4
            className={`font-semibold bg-gradient-to-r from-fuchsia-300 via-violet-200 to-sky-300 bg-clip-text text-transparent ${
              compact ? 'text-sm' : ''
            }`}
          >
            {title}
          </h4>
          {subtitle && (
            <span className={`${compact ? 'text-[10px]' : 'text-[11px]'} text-white/60`}>
              {subtitle}
            </span>
          )}
        </div>
        <div className={`grid grid-cols-3 ${compact ? 'mt-2 gap-1.5' : 'mt-3 gap-2'}`}>
          <MiniNumCard compact={compact} label="Single" value={nums.single} tint="bg-emerald-400" />
          <MiniNumCard compact={compact} label="Double" value={nums.double} tint="bg-amber-400" />
          <MiniNumCard compact={compact} label="Triple" value={nums.triple} tint="bg-rose-400" />
        </div>
      </div>
    </div>
  )
})

export default HistoryCard
