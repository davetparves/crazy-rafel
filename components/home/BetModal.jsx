import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { MdOutlineAttachMoney } from "react-icons/md";

export default function BetModal({
  selected,
  onClose,
  balance,
  currency = 'BDT',
  betAmount,
  onBetAmountChange,
  onAddChip,
  onConfirm,                 // can be async
  multipliers: multipliersProp,
}) {
  if (selected === null) return null

  // NEW: local submitting state for button
  const [submitting, setSubmitting] = useState(false)

  // multipliers (fetch if not provided)
  const [mps, setMps] = useState(
    multipliersProp && typeof multipliersProp === 'object' ? multipliersProp : null,
  )

  useEffect(() => {
    let alive = true
    if (!mps) {
      ;(async () => {
        try {
          const res = await fetch('/api/multipliers/userget', { cache: 'no-store' })
          const json = await res.json()
          if (!alive) return
          if (json?.success) setMps(json.data || null)
        } catch {}
      })()
    }
    return () => { alive = false }
  }, []) // eslint-disable-line

  // reset submitting whenever modal target changes/close happens
  useEffect(() => {
    setSubmitting(false)
  }, [selected])

  const tier = useMemo(() => {
    const n = Number(selected)
    if (Number.isFinite(n)) {
      if (n >= 0 && n <= 9) return 'single'
      if (n >= 10 && n <= 99) return 'double'
      if (n >= 100 && n <= 999) return 'triple'
    }
    return null
  }, [selected])

  const multiplier = tier && mps?.[tier] != null ? Number(mps[tier]) : null

  // sanitize input to non-negative
  const safeSetAmount = (v) => {
    const cleaned = String(v).replace(/[^\d.]/g, '')
    onBetAmountChange(cleaned)
  }

  const amountNum = Number(betAmount || 0)
  const isValidAmount = Number.isFinite(amountNum) && amountNum >= 1
  const potential =
    isValidAmount && Number.isFinite(multiplier) ? amountNum * multiplier : null

  // NEW: click handler that manages spinner/disable
  const handleConfirm = async () => {
    if (!isValidAmount || submitting) return
    try {
      setSubmitting(true)
      const maybePromise = onConfirm?.()
      if (maybePromise && typeof maybePromise.then === 'function') {
        await maybePromise
      }
    } finally {
      // success/fail যাই হোক, বাটন আবার enable
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      key="overlay"
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        key="modal"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-3xl p-[2px] bg-gradient-to-br from-fuchsia-500/40 via-violet-500/40 to-sky-500/40 shadow-[0_0_60px_-15px_rgba(99,102,241,0.45)]"
      >
        <div className="relative rounded-3xl bg-slate-950/90 backdrop-blur-xl ring-1 ring-white/10 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div>
              <h3 className="text-lg font-bold">Place Your Bet</h3>
              {tier && (
                <p className="mt-0.5 text-[11px] text-white/60 capitalize">
                  Type: <span className="font-semibold text-white/80">{tier}</span>
                  {Number.isFinite(multiplier) && (
                    <span className="ml-2 rounded-md bg-white/10 px-2 py-[2px] text-[10px] ring-1 ring-white/10">
                      ×{multiplier}
                    </span>
                  )}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-xl px-3 py-1 text-white/70 ring-1 ring-white/10 hover:bg-white/10 hover:text-white transition"
            >
              ✕
            </button>
          </div>

          {/* Available balance (shows currency) */}
          <div className="px-4">
            <div
              className="mt-4 w-full flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10 backdrop-blur-xl shadow-lg shadow-black/30"
              aria-live="polite"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/30 to-yellow-300/20 ring-1 ring-amber-300/30 shadow-inner">
                  <MdOutlineAttachMoney/>
                </div>
                <span className="text-xs font-medium text-white/70">Available Balance</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold tabular-nums bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent drop-shadow">
                  {currency} {Number(balance ?? 0).toLocaleString()}
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-400/80 animate-ping" />
              </div>
            </div>
          </div>

          {/* Number showcase */}
          <div className="px-6 mt-6">
            <div className="relative mx-auto mb-6 grid h-28 w-full max-w-xs place-items-center rounded-2xl bg-slate-900/60 ring-1 ring-white/10 overflow-hidden">
              {Number.isFinite(multiplier) && (
                <div className="absolute right-2 top-2">
                  <span className="inline-flex items-center rounded-lg bg-white/10 px-2.5 py-1 text-[10px] font-extrabold tracking-wide ring-1 ring-white/15 backdrop-blur">
                    ×{multiplier}
                  </span>
                </div>
              )}
              <motion.div
                key={String(selected)}
                initial={{ y: 16, opacity: 0, filter: 'blur(6px)' }}
                animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                className="relative text-5xl font-extrabold tracking-wide"
              >
                <span className="bg-gradient-to-r from-fuchsia-300 via-violet-300 to-sky-300 bg-clip-text text-transparent drop-shadow">
                  {selected}
                </span>
              </motion.div>
            </div>
          </div>

          {/* Input + buttons */}
          <div className="px-6 pb-8">
            <label className="mb-2 block text-sm font-medium text-white/80">
              Coin Amount{Number.isFinite(multiplier) ? ` (×${multiplier})` : ''}
            </label>
            <input
              value={betAmount}
              onChange={(e) => safeSetAmount(e.target.value)}
              placeholder="Enter amount (min 1)"
              className="w-full rounded-xl bg-slate-900/70 px-4 py-3 text-white ring-1 ring-white/10 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
              inputMode="decimal"
            />

            {/* Potential return */}
            <div className="mt-3 w-full rounded-xl bg-white/5 backdrop-blur ring-1 ring-white/10 shadow-lg shadow-black/30 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2a10 10 0 100 20 10 10 0 000-20Zm1 14.93V17a1 1 0 11-2 0v-.07a8.001 8.001 0 01-6.32-6.32H7a1 1 0 110-2H4.68A8.001 8.001 0 0111 5.07V5a1 1 0 112 0v.07a8.001 8.001 0 016.32 6.32H17a1 1 0 110 2h2.32A8.001 8.001 0 0113 16.93Z" />
                </svg>
                <span className="text-xs font-medium text-white/70">If You Win</span>
              </div>
              <span className="px-3 py-1 rounded-lg text-sm font-extrabold bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-400 text-slate-900 shadow-md shadow-amber-500/20">
                {potential != null ? `${currency} ${potential.toLocaleString()}` : '—'}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-5 gap-2">
              {['+10', '+50', '+100', '+200', 'MAX'].map((b) => (
                <button
                  key={b}
                  onClick={() => onAddChip(b === 'MAX' ? 'MAX' : b.slice(1))}
                  className="rounded-xl px-0 py-2 text-xs font-semibold text-white ring-1 ring-white/10 bg-slate-800/60 hover:bg-slate-700/80 transition"
                >
                  {b}
                </button>
              ))}
            </div>

            {/* Confirm Button with spinner + disabled while submitting */}
            <button
              onClick={handleConfirm}
              disabled={!isValidAmount || submitting}
              aria-busy={submitting ? 'true' : 'false'}
              className={`mt-6 w-full rounded-xl px-4 py-3 font-bold text-white ring-1 ring-white/10 transition flex items-center justify-center gap-2
                ${(!isValidAmount || submitting)
                  ? 'bg-white/10 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 hover:opacity-90'}`}
              title={
                submitting
                  ? 'Processing…'
                  : isValidAmount
                  ? 'Confirm Bet'
                  : 'Enter amount (min 1)'
              }
            >
              {submitting && (
                <span
                  className="h-4 w-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin"
                  aria-hidden="true"
                />
              )}
              <span>{submitting ? 'Processing…' : 'Confirm Bet'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
