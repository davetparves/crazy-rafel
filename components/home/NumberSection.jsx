import React, { useMemo } from 'react'
import { motion } from 'framer-motion'

export function Footer({ expanded, onClick, label }) {
  return (
    <div className="flex items-center justify-between text-sm text-white/70">
      {!expanded ? <span>Showing 10 of {label}</span> : <span>Showing all ({label})</span>}
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1 rounded-xl bg-green-400 px-3 py-1.5 font-bold text-white ring-1 ring-white/15 transition hover:bg-white/20 hover:text-white"
      >
        {expanded ? 'See less' : 'See more'}
      </button>
    </div>
  )
}

const NumberSection = React.memo(function NumberSection({
  title,
  start,
  end,
  footer,
  onSelect,
  cornerBadge,
}) {
  const items = useMemo(
    () => Array.from({ length: end - start + 1 }, (_, i) => start + i),
    [start, end],
  )

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur md:p-6"
    >
      {/* 🔹 টপ-রাইট ব্যাজ */}
      {cornerBadge && (
        <div className="absolute right-3 top-3">
          <span className="inline-flex items-center rounded-lg bg-green-400 px-3 py-1 text-xs font-extrabold tracking-wide ring-1 ring-white/15 backdrop-blur">
            {cornerBadge}
          </span>
        </div>
      )}

      <h2 className="mb-4 font-bold">{title}</h2>
      <div className="grid grid-cols-5 gap-2">
        {items.map((n) => (
          <button
            key={n}
            onClick={() => onSelect(n)}
            className="h-10 rounded-sm text-sm font-semibold text-white bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition"
          >
            {n}
          </button>
        ))}
      </div>
      {footer && <div className="mt-4">{footer}</div>}
    </motion.section>
  )
})

export default NumberSection
