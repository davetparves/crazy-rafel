'use client'

import React, { useCallback, useMemo, useState, useEffect, memo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Slide, ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { MdOutlineAttachMoney } from 'react-icons/md'

import { API_PATH } from '@/app/api/apiPath'
import { useUserStore } from '@/store/userStore'

/* ========================= ODOMETER ========================= */
const DIGITS = Object.freeze([0,1,2,3,4,5,6,7,8,9])
const two = (n) => String(Math.max(0, n | 0)).padStart(2, '0')

const OdometerDigit = memo(function OdometerDigit({ digit='0', height=18, duration=200 }) {
  const d = String(digit).match(/^\d$/) ? Number(digit) : 0
  const style = { transform: `translateY(-${d * height}px)`, transition: `transform ${duration}ms ease-out` }
  return (
    <div className="relative overflow-hidden rounded-[6px] bg-white/5 ring-1 ring-white/10" style={{ height, width: height * 0.5 }} aria-hidden suppressHydrationWarning>
      <div style={style}>
        {DIGITS.map((n) => (
          <div key={n} className="grid place-items-center text-white/95 font-extrabold tabular-nums select-none text-[10px] leading-none" style={{ height }}>
            {n}
          </div>
        ))}
      </div>
    </div>
  )
})

const OdometerTwo = memo(function OdometerTwo({ value=0, height=18, duration=200 }) {
  const s = two(value)
  return (
    <div className="inline-flex items-center gap-[2px]">
      <OdometerDigit digit={s[0]} height={height} duration={duration} />
      <OdometerDigit digit={s[1]} height={height} duration={duration} />
    </div>
  )
})

const OdometerNum = memo(function OdometerNum({ value=0, minDigits=2, height=18, duration=200 }) {
  const safe = Math.max(0, value | 0)
  const s = String(safe).padStart(minDigits, '0')
  return (
    <div className="inline-flex items-center gap-[2px]">
      {s.split('').map((ch, i) => (
        <OdometerDigit key={i} digit={ch} height={height} duration={duration} />
      ))}
    </div>
  )
})

/* ========================= TIME HELPERS ========================= */
function parseTime12h(str) {
  const m = String(str || '').trim().match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/)
  if (!m) return null
  let hh = Number(m[1]), mm = Number(m[2])
  if (hh === 12) hh = 0
  if (m[3].toUpperCase() === 'PM') hh += 12
  return { hh, mm }
}
function secondsUntilNext(hh, mm) {
  const now = new Date()
  const target = new Date(now)
  target.setHours(hh, mm, 0, 0)
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1)
  return Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000))
}
function useCountdownTo(timeStr) {
  const parsed = useMemo(() => parseTime12h(timeStr), [timeStr])
  const [sec, setSec] = useState(0)
  const parsedRef = useRef(parsed)
  useEffect(() => { parsedRef.current = parsed }, [parsed])
  useEffect(() => {
    if (!parsedRef.current) return
    setSec(secondsUntilNext(parsedRef.current.hh, parsedRef.current.mm))
    const id = setInterval(() => {
      setSec((prev) => (prev > 0 ? prev - 1 : secondsUntilNext(parsedRef.current.hh, parsedRef.current.mm)))
    }, 1000)
    return () => clearInterval(id)
  }, [])
  return sec
}

const OdometerClock = memo(function OdometerClock({ seconds=0, height=18 }) {
  const tot = Math.max(0, seconds | 0)
  const hh = Math.floor(tot / 3600)
  const mm = Math.floor((tot % 3600) / 60)
  const ss = tot % 60
  return (
    <div className="inline-flex items-center gap-[6px] min-w-0" suppressHydrationWarning>
      <OdometerNum value={hh} minDigits={2} height={height} />
      <span className="text-white/60 font-semibold text-[9px] leading-none" style={{ lineHeight: `${height}px` }}>:</span>
      <OdometerTwo value={mm} height={height} />
      <span className="text-white/60 font-semibold text-[9px] leading-none" style={{ lineHeight: `${height}px` }}>:</span>
      <OdometerTwo value={ss} height={height} />
    </div>
  )
})

const CountdownStat = memo(function CountdownStat({ title, timeStr, colorClass }) {
  const seconds = useCountdownTo(timeStr)
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-1.5 backdrop-blur min-w-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center min-w-0">
          <div className={`${colorClass} rounded-full w-2.5 h-2.5 mr-2 shrink-0`} />
          <div className="min-w-0">
            <p className="text-[10px] text-gray-300 leading-4 truncate">{title}</p>
            <p className="text-[8.5px] text-white/60 leading-3">at {timeStr}</p>
          </div>
        </div>
      </div>
      <div className="mt-1 flex justify-center"><OdometerClock seconds={seconds} height={18} /></div>
    </div>
  )
})

/* ========================= NUMBER GRID ========================= */
export function Footer({ expanded, onClick, label }) {
  return (
    <div className="flex items-center justify-between text-sm text-white/70">
      {!expanded ? <span>Showing 10 of {label}</span> : <span>Showing all ({label})</span>}
      <button onClick={onClick} className="inline-flex items-center gap-1 rounded-xl bg-green-400 px-3 py-1.5 font-bold text-white ring-1 ring-white/15 transition hover:bg-white/20 hover:text-white">
        {expanded ? 'See less' : 'See more'}
      </button>
    </div>
  )
}

const NumberSection = memo(function NumberSection({ title, start, end, footer, onSelect, cornerBadge }) {
  const items = useMemo(() => Array.from({ length: end - start + 1 }, (_, i) => start + i), [start, end])
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="relative rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur md:p-6">
      {cornerBadge && (
        <div className="absolute right-3 top-3">
          <span className="inline-flex items-center rounded-lg bg-green-400 px-3 py-1 text-xs font-extrabold tracking-wide ring-1 ring-white/15 backdrop-blur">{cornerBadge}</span>
        </div>
      )}
      <h2 className="mb-4 font-bold">{title}</h2>
      <div className="grid grid-cols-5 gap-2">
        {items.map((n) => (
          <button key={n} onClick={() => onSelect(n)} className="h-10 rounded-sm text-sm font-semibold text-white bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition">
            {n}
          </button>
        ))}
      </div>
      {footer && <div className="mt-4">{footer}</div>}
    </motion.section>
  )
})

/* ========================= BET MODAL ========================= */
function BetModal({ selected, onClose, balance, currency='BDT', betAmount, onBetAmountChange, onAddChip, onConfirm, multipliers }) {
  if (selected === null) return null
  const tier = useMemo(() => {
    const n = Number(selected)
    if (Number.isFinite(n)) {
      if (n >= 0 && n <= 9) return 'single'
      if (n >= 10 && n <= 99) return 'double'
      if (n >= 100 && n <= 999) return 'triple'
    }
    return null
  }, [selected])
  const multiplier = tier && multipliers?.[tier] != null ? Number(multipliers[tier]) : null
  const safeSetAmount = (v) => {
    const cleaned = String(v).replace(/[^\d.]/g, '')
    onBetAmountChange(cleaned)
  }
  const amountNum = Number(betAmount || 0)
  const isValidAmount = Number.isFinite(amountNum) && amountNum >= 1
  const potential = isValidAmount && Number.isFinite(multiplier) ? amountNum * multiplier : null

  return (
    <motion.div key="overlay" className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
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
                    <span className="ml-2 rounded-md bg-white/10 px-2 py-[2px] text-[10px] ring-1 ring-white/10">×{multiplier}</span>
                  )}
                </p>
              )}
            </div>
            <button onClick={onClose} className="rounded-xl px-3 py-1 text-white/70 ring-1 ring-white/10 hover:bg-white/10 hover:text-white transition">✕</button>
          </div>

          {/* Available balance */}
          <div className="px-4">
            <div className="mt-4 w-full flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10 backdrop-blur-xl shadow-lg shadow-black/30" aria-live="polite">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/30 to-yellow-300/20 ring-1 ring-amber-300/30 shadow-inner">
                  <MdOutlineAttachMoney />
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
                  <span className="inline-flex items-center rounded-lg bg-white/10 px-2.5 py-1 text-[10px] font-extrabold tracking-wide ring-1 ring-white/15 backdrop-blur">×{multiplier}</span>
                </div>
              )}
              <motion.div key={String(selected)} initial={{ y: 16, opacity: 0, filter: 'blur(6px)' }} animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }} transition={{ type: 'spring', stiffness: 220, damping: 18 }} className="relative text-5xl font-extrabold tracking-wide">
                <span className="bg-gradient-to-r from-fuchsia-300 via-violet-300 to-sky-300 bg-clip-text text-transparent drop-shadow">{selected}</span>
              </motion.div>
            </div>
          </div>

          {/* Input + buttons */}
          <div className="px-6 pb-8">
            <label className="mb-2 block text-sm font-medium text-white/80">
              {currency} Amount{Number.isFinite(multiplier) ? ` (×${multiplier})` : ''}
            </label>
            <input
              value={betAmount}
              onChange={(e) => safeSetAmount(e.target.value)}
              placeholder="Enter amount (min 1)"
              className="w-full rounded-xl bg-slate-900/70 px-4 py-3 text-white ring-1 ring-white/10 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
              inputMode="decimal"
            />

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
                <button key={b} onClick={() => onAddChip(b === 'MAX' ? 'MAX' : b.slice(1))} className="rounded-xl px-0 py-2 text-xs font-semibold text-white ring-1 ring-white/10 bg-slate-800/60 hover:bg-slate-700/80 transition">
                  {b}
                </button>
              ))}
            </div>

            <button
              onClick={onConfirm}
              disabled={!isValidAmount}
              className={`mt-6 w-full rounded-xl px-4 py-3 font-bold text-white ring-1 ring-white/10 transition ${isValidAmount ? 'bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 hover:opacity-90' : 'bg-white/10 cursor-not-allowed opacity-50'}`}
              title={isValidAmount ? 'Confirm Bet' : 'Enter amount (min 1)'}
            >
              Confirm Bet
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ========================= PAGE ========================= */
export default function HomePage() {
  // ✅ Zustand থেকে ইমেইল (persisted)
  const email = useUserStore((s) => s.email)

  // ✅ Server data state
  const [multipliers, setMultipliers] = useState(null) // { single, double, triple }
  const [balance, setBalance] = useState(0)            // wallet.main
  const [currency, setCurrency] = useState('BDT')      // user.currency

  // ===== Draw Times (UI-only)
  const drawTimes = useMemo(() => ({ morning:'10:00 AM', afternoon:'02:00 PM', night:'10:00 PM' }), [])

  // ===== Local UI state
  const [expandDouble, setExpandDouble] = useState(false)
  const [expandTriple, setExpandTriple] = useState(false)
  const [selected, setSelected] = useState(null)
  const [betAmount, setBetAmount] = useState('')

  // ▶️ GET: multipliers (single/double/triple)
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch(API_PATH.HOMEPAGE_MULTIPLIER_GET, { cache: 'no-store' })
        const json = await res.json()
        if (!alive) return
        if (json?.success && json?.data) {
          const { single=null, double=null, triple=null } = json.data || {}
          setMultipliers({ single, double, triple })
        } else {
          toast.error(json?.message || 'মাল্টিপ্লায়ার লোড হয়নি')
        }
      } catch {
        toast.error('মাল্টিপ্লায়ার লোডে সমস্যা হয়েছে')
      }
    })()
    return () => { alive = false }
  }, [])

  // ▶️ POST: balance + currency (by email)
  useEffect(() => {
    let alive = true
    if (!email) return
    ;(async () => {
      try {
        const res = await fetch(API_PATH.HOMEPAGE_EMAIL_POST_BALANCE_GET, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        const json = await res.json()
        if (!alive) return
        if (json?.success && json?.data) {
          setBalance(Number(json.data.balance || 0))
          setCurrency(json.data.currency || 'BDT')
        } else {
          toast.error(json?.message || 'ইউজার/ব্যালেন্স পাওয়া যায়নি')
        }
      } catch {
        toast.error('ব্যালেন্স লোডে সমস্যা হয়েছে')
      }
    })()
    return () => { alive = false }
  }, [email])

  // ===== UI handlers
  const toggleDouble = useCallback(() => setExpandDouble((v) => !v), [])
  const toggleTriple = useCallback(() => setExpandTriple((v) => !v), [])
  const onSelect = useCallback((n) => { setSelected(n); setBetAmount('') }, [])
  const addChip = useCallback((v) => {
    if (v === 'MAX') {
      const max = Number(balance || 0)
      setBetAmount(String(max > 0 ? max : 0))
      return
    }
    const inc = Number(v)
    const cur = Number(betAmount || 0)
    setBetAmount(String(cur + (Number.isFinite(inc) ? inc : 0)))
  }, [betAmount, balance])

  /* 🔗 Confirm Bet → Server POST (balance check, prize calc, trx, updates) */
  const confirmBet = useCallback(async () => {
    const amt = Number(betAmount)
    if (!email) return toast.error('দয়া করে সাইন-ইন করুন।')
    if (selected == null) return toast.warning('একটা নাম্বার সিলেক্ট করুন।')
    if (!(Number.isFinite(amt) && amt > 0)) return toast.warning('পজিটিভ এমাউন্ট দিন।')
    if ((balance ?? 0) < amt) return toast.error('ব্যালেন্স অপর্যাপ্ত।')

    const betType = selected <= 9 ? 'single' : selected <= 99 ? 'double' : 'triple'

    try {
      const res = await fetch(API_PATH.BETTING_POST, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, number: selected, amount: amt, betType }),
      })
      const json = await res.json()
      if (!res.ok || !json?.success) {
        return toast.error(json?.message || 'বেট প্লেস করা যায়নি')
      }

      // fresh balance from server (preferred)
      const newBal = Number(json?.data?.newBalance ?? balance - amt)
      setBalance(newBal)
      setSelected(null)
      setBetAmount('')

      const multShow = betType === 'single' ? multipliers?.single : betType === 'double' ? multipliers?.double : multipliers?.triple
      toast.success(`Bet success ✅ Potential prize: ${currency} ${(amt * (multShow ?? 0)).toLocaleString()}`, { autoClose: 1500 })
    } catch {
      toast.error('সার্ভার এরর—পরে আবার চেষ্টা করুন')
    }
  }, [email, selected, betAmount, balance, currency, multipliers])

  const bg = useMemo(() => 'bg-[radial-gradient(80%_60%_at_20%_10%,#3b0764_0%,#0b1220_60%,#030712_100%)]', [])
  const badge = (v) => `×${v ?? '—'}`

  return (
    <div className={`relative min-h-screen overflow-hidden ${bg} text-white`}>
      {/* Toasts */}
      <ToastContainer position="top-right" autoClose={1500} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss={false} draggable pauseOnHover={false} theme="dark" transition={Slide} limit={3}
        style={{ zIndex: 9999, top: 12, right: 12 }}
        toastClassName={() => 'relative flex items-center gap-2 p-3 min-h-10 rounded-xl bg-slate-900/90 text-white backdrop-blur-xl ring-1 ring-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)]'}
        bodyClassName={() => 'text-sm font-medium'}
        progressStyle={{ height: '3px' }}
        closeButton={({ closeToast }) => (
          <button onClick={closeToast} className="ml-2 rounded-lg bg-white/10 hover:bg-white/20 p-1 leading-none ring-1 ring-white/10" aria-label="Close" title="Close">✕</button>
        )}
      />

      {/* BG glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="absolute -bottom-28 -right-24 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl p-4 md:p-8">
        {/* Header: 3 countdowns */}
        <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-6">
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            <CountdownStat title="Morning Draw"   timeStr={drawTimes.morning}   colorClass="bg-green-500" />
            <CountdownStat title="Afternoon Draw" timeStr={drawTimes.afternoon} colorClass="bg-amber-500" />
            <CountdownStat title="Night Draw"     timeStr={drawTimes.night}     colorClass="bg-rose-500" />
          </div>
        </motion.header>

        {/* Number sections */}
        <div className="mx-auto grid max-w-6xl gap-6">
          <NumberSection title="Single Digit (0–9)" start={0}   end={9}   onSelect={onSelect} cornerBadge={badge(multipliers?.single)} />
          <NumberSection title="Double Digit (10–99)" start={10} end={expandDouble ? 99 : 19} onSelect={onSelect} footer={<Footer expanded={expandDouble} onClick={toggleDouble} label="90" />} cornerBadge={badge(multipliers?.double)} />
          <NumberSection title="Triple Digit (100–999)" start={100} end={expandTriple ? 999 : 109} onSelect={onSelect} footer={<Footer expanded={expandTriple} onClick={toggleTriple} label="900" />} cornerBadge={badge(multipliers?.triple)} />
        </div>
      </div>

      {/* Bet modal */}
      <AnimatePresence>
        {selected !== null && (
          <BetModal
            selected={selected}
            onClose={() => setSelected(null)}
            balance={balance}
            currency={currency}
            betAmount={betAmount}
            onBetAmountChange={setBetAmount}
            onAddChip={addChip}
            onConfirm={confirmBet}
            multipliers={multipliers || {}}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
