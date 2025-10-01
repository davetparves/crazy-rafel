// /components/users/home/HistoryStrip.jsx
'use client'
import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import HistoryCard from './HistoryCard'

/**
 * props.results: ResultList[] (latest first)
 * ResultList shape:
 *  {
 *    period: 'morning'|'noon'|'night',
 *    number: { single:Number, double:Number, triple:Number },
 *    time: "10:00 AM",
 *    status: "history",
 *    createdAt: Date
 *  }
 */
const HistoryStrip = ({ results = [] }) => {
  const [showAll, setShowAll] = useState(false)

  // Ensure newest first (API already sorts desc, but double-safety)
  const sorted = useMemo(
    () => [...results].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [results],
  )

  // visible: first 7 or all
  const visible = showAll ? sorted : sorted.slice(0, 7)

  // Helper: make title/subtitle
  const toTitle = (r, idx) => {
    const d = r?.createdAt ? new Date(r.createdAt) : null
    if (!d) return { title: `#${idx + 1}`, subtitle: r?.period ?? '' }
    const todayKey = new Date().toDateString()
    const dateKey = d.toDateString()
    const title =
      todayKey === dateKey
        ? 'Today'
        : new Date(Date.now() - 86400000).toDateString() === dateKey
        ? 'Yesterday'
        : d.toLocaleDateString()
    return { title, subtitle: `${r?.period ?? ''} • ${r?.time ?? ''}` }
  }

  return (
    <div className="mb-8 relative overflow-hidden rounded-3xl ring-1 ring-white/10 bg-[radial-gradient(80%_60%_at_20%_10%,#3b0764_0%,#0b1220_60%,#030712_100%)]">
      {/* glows */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="p-3 md:p-4"
      >
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm md:text-base font-semibold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-300">
            Recent Draw History
          </h3>
          <span className="text-[10px] md:text-xs text-white/60">
            Showing {visible.length} of {sorted.length}
          </span>
        </div>

        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2"
        >
          <AnimatePresence initial={false}>
            {visible.map((r, i) => {
              const { title, subtitle } = toTitle(r, i)
              const nums = r?.number || r?.numbers || { single: '-', double: '-', triple: '-' }
              return (
                <motion.div
                  key={r._id || `${r.period}-${r.time}-${i}`}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.2, delay: i * 0.01 }}
                  className="origin-top-left [font-size:11px] sm:text-xs transform-gpu"
                >
                  <div className="scale-[0.85] sm:scale-[0.9] lg:scale-[0.85]">
                    <HistoryCard title={title} subtitle={subtitle} nums={nums} compact />
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>

        <div className="mt-3 flex justify-center">
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAll((v) => !v)}
            aria-expanded={showAll}
            className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs md:text-sm font-medium text-white/90 bg-white/5 hover:bg-white/10 ring-1 ring-white/10 backdrop-blur-xl shadow-lg shadow-black/20"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-300 to-cyan-300">
              {showAll ? 'Show 7 Days' : 'More (Latest)'}
            </span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

export default HistoryStrip
