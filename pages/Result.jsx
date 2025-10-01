'use client'

import React, { useEffect, useMemo, useRef, useState, memo, useCallback } from 'react'
import axios from 'axios'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'

import {
  WRAP_THRESHOLD,
  secondsUntilInBD,
  minPositive,
  percentFromSeconds,
  fmt,
  two,
} from '@/lib/time'

import { useMyNumberStore, padByKey } from '@/store/myNumberStore'

/* ---------------- dynamic only where needed ---------------- */
const Confetti = dynamic(() => import('react-confetti'), { ssr: false })

/* ---------------- constants & pure helpers ---------------- */
const LIVE_COUNTDOWN = true
const DIGITS_ARR = Object.freeze([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])

/* ---------------- Odometer UI components ---------------- */
const OdometerDigit = memo(function OdometerDigit({ digit = '0', height = 32, duration = 300 }) {
  const d = String(digit).match(/\d/) ? Number(digit) : 0
  return (
    <div
      className="relative overflow-hidden rounded-md bg-white/5 ring-1 ring-white/10"
      style={{ height, width: height * 0.62 }}
      aria-hidden
    >
      <div
        style={{
          transform: `translateY(-${d * height}px)`,
          transition: `transform ${duration}ms ease-out`,
        }}
      >
        {DIGITS_ARR.map((n) => (
          <div
            key={n}
            className="grid place-items-center text-white/95 font-extrabold tabular-nums select-none"
            style={{ height }}
          >
            {n}
          </div>
        ))}
      </div>
    </div>
  )
})

const OdometerTwo = memo(function OdometerTwo({ value = 0, height = 32, duration = 300 }) {
  const s = two(value)
  return (
    <div className="inline-flex items-center gap-0.5">
      <OdometerDigit digit={s[0]} height={height} duration={duration} />
      <OdometerDigit digit={s[1]} height={height} duration={duration} />
    </div>
  )
})

const OdometerNum = memo(function OdometerNum({
  value = 0,
  minDigits = 2,
  height = 32,
  duration = 300,
}) {
  const safe = Math.max(0, value | 0)
  const s = String(safe).padStart(minDigits, '0')
  return (
    <div className="inline-flex items-center gap-0.5">
      {s.split('').map((ch, i) => (
        <OdometerDigit key={i} digit={ch} height={height} duration={duration} />
      ))}
    </div>
  )
})

const OdometerClock = memo(function OdometerClock({ seconds = 0, height = 32 }) {
  const total = Math.max(0, seconds | 0)
  const hh = Math.floor(total / 3600)
  const mm = Math.floor((total % 3600) / 60)
  const ss = total % 60
  return (
    <div className="inline-flex items-center gap-1">
      <OdometerNum value={hh} minDigits={2} height={height} />
      <span className="text-white/60 font-semibold text-xs" style={{ lineHeight: `${height}px` }}>
        :
      </span>
      <OdometerTwo value={mm} height={height} />
      <span className="text-white/60 font-semibold text-xs" style={{ lineHeight: `${height}px` }}>
        :
      </span>
      <OdometerTwo value={ss} height={height} />
    </div>
  )
})

const ConfettiBurst = memo(function ConfettiBurst({ run, parentRef }) {
  const [size, setSize] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const measure = () => {
      const el = parentRef?.current
      if (!el) return
      setSize({ w: el.clientWidth, h: el.clientHeight })
    }
    measure()
    const ro = new ResizeObserver(measure)
    parentRef?.current && ro.observe(parentRef.current)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [parentRef])
  return run ? (
    <div className="pointer-events-none absolute inset-0 z-20">
      <Confetti
        width={size.w || 1}
        height={size.h || 1}
        numberOfPieces={150}
        recycle={false}
        gravity={0.6}
        tweenDuration={2200}
      />
    </div>
  ) : null
})

/* ---------------- Presentational bits ---------------- */
const ProgressCard = memo(function ProgressCard({ label, seconds, accent }) {
  const left = Math.max(0, Number(seconds) || 0)
  const pct = percentFromSeconds(left)
  const pctStr = `${pct.toFixed(2)}%`
  return (
    <div className="rounded-2xl p-3 md:p-4 bg-white/5 ring-1 ring-white/10 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-xs md:text-base font-semibold text-white/85">{label}</h3>
        <span
          className={`rounded-md px-2 py-0.5 text-[10px] md:text-[12px] font-semibold ring-1 bg-gradient-to-r ${accent}`}
        >
          {pctStr}
        </span>
      </div>
      <div className="mt-2 md:mt-3">
        <div className="h-1.5 md:h-2 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${accent}`}
            style={{ width: `${pct}%`, transition: 'width 420ms ease-out' }}
          />
        </div>
        <p className="mt-1.5 md:mt-2 text-[10px] md:text-xs text-white/70">
          ⏳ Reveals in <span className="font-bold text-white/90">{fmt(seconds)}</span>
        </p>
      </div>
    </div>
  )
})

const ResultTile = memo(function ResultTile({
  innerRef,
  title,
  tag,
  value,
  revealed,
  accent,
  chipColor,
  burst,
}) {
  const digits = useMemo(() => String(value).split(''), [value])
  return (
    <div
      ref={innerRef}
      className={`relative overflow-hidden rounded-3xl m-2 md:rounded-3xl p-4 md:p-6 bg-gradient-to-br ${accent} ring-1 ring-white/10 backdrop-blur-xl`}
    >
      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/10" />
      <div className="pointer-events-none absolute -top-20 -left-16 h-40 w-40 md:h-48 md:w-48 rounded-full bg-white/10 blur-3xl" />
      <ConfettiBurst run={burst} parentRef={innerRef} />
      <div className="flex items-center justify-between">
        <h3 className="text-xs md:text-base font-semibold tracking-wide">{title}</h3>
        <span
          className={`rounded-lg px-2 py-1 text-[10px] md:text-[12px] font-semibold ring-1 ${
            revealed
              ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/20'
              : 'bg-white/10 text-white/85 ring-white/15'
          }`}
        >
          {revealed ? 'Revealed' : 'Counting…'}
        </span>
      </div>

      <div className="mt-4 md:mt-6 flex items-center text-2xl justify-center min-h-[52px] md:min-h-[64px]">
        <AnimatePresence mode="wait" initial={false}>
          {!revealed ? (
            <motion.div
              key="dots"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 0.7, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className="text-3xl md:text-5xl font-extrabold tracking-widest text-white/60 select-none"
            >
              {tag === 'single' ? '•' : tag === 'double' ? '••' : '•••'}
            </motion.div>
          ) : (
            <motion.div
              key={`num-${tag}-${value}`}
              initial={{ opacity: 0, y: 10, scale: 0.96, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              className="flex items-center gap-1.5 md:gap-2"
            >
              {digits.map((d, i) => (
                <OdometerDigit key={i} digit={d} height={40} duration={260} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {revealed ? (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mt-4 md:mt-6 text-center text-xs md:text-sm text-emerald-300"
        >
          ✅ Result available
        </motion.p>
      ) : null}
    </div>
  )
})

/* ---------------- Page (optimized) ---------------- */
export default function ResultOdometer() {
  // timers & items
  const [items, setItems] = useState([]) // [{name,time,status,number?}]
  const [timers, setTimers] = useState({ single: 0, double: 0, triple: 0 })

  // reveal states
  const [numbers, setNumbers] = useState({
    single: '?',
    double: '?',
    triple: '?',
  })
  const [revealed, setRevealed] = useState({
    single: false,
    double: false,
    triple: false,
  })
  const [burst, setBurst] = useState({
    single: false,
    double: false,
    triple: false,
  })

  // pause when nextDraw hits 0 to fetch → then resume
  const [paused, setPaused] = useState(false)

  // stable refs
  const itemsRef = useRef(items)
  const prevTimersRef = useRef(timers)
  const refetchedRef = useRef({ single: false, double: false, triple: false })
  const fetchingRef = useRef(false)

  // readonly refs for Confetti
  const singleRef = useRef(null)
  const doubleRef = useRef(null)
  const tripleRef = useRef(null)

  // zustand methods (stable)
  const getNumber = useMyNumberStore((s) => s.getNumber)
  const setNumber = useMyNumberStore((s) => s.setNumber)
  const clearExpired = useMyNumberStore((s) => s.clearExpired)

  // keep refs in sync without re-renders
  useEffect(() => {
    itemsRef.current = items
  }, [items])

  // map by name (stable memo)
  const byName = useMemo(() => {
    const m = Object.create(null)
    for (const it of items) m[it.name] = it
    return m
  }, [items])

  // derive labels once per items change
  const labelSingle = useMemo(
    () => (byName.single?.name || 'single').toUpperCase(),
    [byName.single],
  )
  const labelDouble = useMemo(
    () => (byName.double?.name || 'double').toUpperCase(),
    [byName.double],
  )
  const labelTriple = useMemo(
    () => (byName.triple?.name || 'triple').toUpperCase(),
    [byName.triple],
  )

  // local helper (stable)
  const seedTimers = useCallback((list) => {
    const next = { single: 0, double: 0, triple: 0 }
    for (const it of list) next[it.name] = secondsUntilInBD(it.time)
    setTimers((prev) => {
      // shallow compare to prevent useless re-render
      if (prev.single === next.single && prev.double === next.double && prev.triple === next.triple)
        return prev
      return next
    })
  }, [])

  const revealFromValue = useCallback((k, padded) => {
    setNumbers((p) => (p[k] === padded ? p : { ...p, [k]: padded }))
    setRevealed((p) => (p[k] ? p : { ...p, [k]: true }))
    setBurst((b) => ({ ...b, [k]: true }))
    setTimeout(() => setBurst((b) => ({ ...b, [k]: false })), 2400)
  }, [])

  // cache-first → API fallback (stable)
  const showFromCacheOrApi = useCallback(
    async (k) => {
      clearExpired()
      const cached = getNumber(k)
      if (cached) {
        revealFromValue(k, cached)
        refetchedRef.current[k] = true
        return true
      }
      try {
        const { data } = await axios.get('/api/results/show-number', {
          params: { name: k, t: Date.now() },
        })
        if (!data?.ok) return false
        const r = data.result || {}
        const status = String(r.status || '').toLowerCase()
        const n = Number(r.number)
        if (status === 'show' && Number.isFinite(n)) {
          const padded = padByKey(k, n)
          setNumber(k, padded)
          revealFromValue(k, padded)
          return true
        }
        return false
      } finally {
        refetchedRef.current[k] = true
      }
    },
    [clearExpired, getNumber, setNumber, revealFromValue],
  )

  // initial load (stable)
  const loadInitial = useCallback(async () => {
    const { data } = await axios.get('/api/results/show', {
      params: { t: Date.now() },
    })
    if (!data?.ok) return

    const normalized = (data.results || []).map((r) => ({
      name: r.name,
      time: r.time,
      status: r.status,
      number: r.number,
    }))

    setItems((prev) => {
      // shallow-equal array content by fields
      if (
        prev.length === normalized.length &&
        prev.every(
          (p, i) =>
            p.name === normalized[i].name &&
            p.time === normalized[i].time &&
            p.status === normalized[i].status &&
            p.number === normalized[i].number,
        )
      ) {
        return prev
      }
      return normalized
    })

    // seed timers
    seedTimers(normalized)

    // cache-first reveal
    clearExpired()
    for (const key of ['single', 'double', 'triple']) {
      const cached = getNumber(key)
      if (cached) revealFromValue(key, cached)
    }
  }, [seedTimers, clearExpired, getNumber, revealFromValue])

  /* ---------- mount + visibility/focus ---------- */
  useEffect(() => {
    loadInitial()
  }, [loadInitial])

  useEffect(() => {
    const onFocus = () => loadInitial()
    const onVisible = () => document.visibilityState === 'visible' && loadInitial()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [loadInitial])

  /* ---------- live countdown (paused-aware) ---------- */
  useEffect(() => {
    if (!LIVE_COUNTDOWN || paused) return
    const id = setInterval(() => {
      const arr = itemsRef.current
      if (!arr.length) return
      setTimers((prev) => {
        const next = { ...prev }
        let changed = false
        for (const it of arr) {
          const v = secondsUntilInBD(it.time)
          if (next[it.name] !== v) {
            next[it.name] = v
            changed = true
          }
        }
        return changed ? next : prev
      })
    }, 1000)
    return () => clearInterval(id)
  }, [paused])

  /* ---------- reseed timers whenever items change ---------- */
  useEffect(() => {
    if (items.length) seedTimers(items)
  }, [items, seedTimers])

  /* ---------- global 0 watcher: pause → fetch → resume ---------- */
  const nextDraw = useMemo(() => minPositive(timers.single, timers.double, timers.triple), [timers])

  useEffect(() => {
    if (nextDraw !== 0 || fetchingRef.current) return
    fetchingRef.current = true
    setPaused(true)

    ;(async () => {
      const keys = ['single', 'double', 'triple'].filter(
        (k) => timers[k] === 0 || timers[k] >= WRAP_THRESHOLD,
      )
      for (const k of keys) {
        // already tried in this cycle?
        if (!refetchedRef.current[k]) {
          // eslint-disable-next-line no-await-in-loop
          await showFromCacheOrApi(k)
        }
      }
      await loadInitial() // re-sync times
      // reset flags for next cycle
      refetchedRef.current = { single: false, double: false, triple: false }
      setPaused(false)
      fetchingRef.current = false
    })()
  }, [nextDraw, showFromCacheOrApi, loadInitial, timers])

  const sRevealed = revealed.single
  const dRevealed = revealed.double
  const tRevealed = revealed.triple

  return (
    <div className="relative min-h-screen overflow-hidden p-3 md:p-8 text-white">
      {/* BG */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-28 -left-28 h-56 w-56 md:h-72 md:w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-64 w-64 md:h-80 md:w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_10%,#3b0764_0%,#0b1220_60%,#030712_100%)]" />
      </div>

      <header className="mx-auto max-w-6xl text-center mb-6 md:mb-10">
        <h1 className="text-2xl md:text-4xl font-extrabold leading-tight">
          <span className="bg-gradient-to-r from-fuchsia-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
            🎯 CRAZY RAFEL Results
          </span>
        </h1>
      </header>

      {/* Next Draw */}
      <section className="mx-auto max-w-6xl mb-6 md:mb-8">
        <div className="rounded-2xl md:rounded-3xl p-3 md:p-6 bg-white/5 ring-1 ring-white/10 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-around">
            <div>
              <h2 className="text-base md:text-2xl font-bold bg-gradient-to-r from-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                Next Draw
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/5 ring-1 ring-white/10 backdrop-blur-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3.5 h-3.5 text-cyan-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-[9px] md:text-xs font-medium tracking-wide bg-gradient-to-r from-fuchsia-200 via-violet-300 to-cyan-200 bg-clip-text text-transparent">
                Time Left
              </span>
            </span>
            <div className="flex items-center gap-2 md:gap-4">
              <OdometerClock seconds={paused ? 0 : nextDraw} height={28} />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 md:gap-3">
            <ProgressCard
              label={labelSingle}
              seconds={timers.single}
              accent="from-fuchsia-500 to-cyan-500"
            />
            <ProgressCard
              label={labelDouble}
              seconds={timers.double}
              accent="from-violet-500 to-cyan-400"
            />
            <ProgressCard
              label={labelTriple}
              seconds={timers.triple}
              accent="from-pink-600 to-cyan-500"
            />
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="mx-auto max-w-6xl grid grid-cols-1 gap-2 md:gap-6">
        <ResultTile
          innerRef={singleRef}
          title={labelSingle}
          tag="single"
          value={numbers.single}
          revealed={sRevealed}
          accent="from-fuchsia-500/20 via-fuchsia-500/10 to-cyan-500/10"
          chipColor="bg-fuchsia-500/15 text-fuchsia-200 ring-fuchsia-400/20"
          burst={burst.single}
        />
        <ResultTile
          innerRef={doubleRef}
          title={labelDouble}
          tag="double"
          value={numbers.double}
          revealed={dRevealed}
          accent="from-violet-500/20 via-violet-500/10 to-cyan-500/10"
          chipColor="bg-violet-500/15 text-violet-200 ring-violet-400/20"
          burst={burst.double}
        />
        <ResultTile
          innerRef={tripleRef}
          title={labelTriple}
          tag="triple"
          value={numbers.triple}
          revealed={tRevealed}
          accent="from-pink-600/20 via-pink-600/10 to-cyan-500/10"
          chipColor="bg-pink-600/15 text-pink-200 ring-pink-400/20"
          burst={burst.triple}
        />
      </section>

      <footer className="mx-auto max-w-6xl mt-6 md:mt-12 pt-5 border-t border-white/10 text-center text-[11px] md:text-sm text-white/60">
        ⚡ Optimized: memo + stable callbacks • shallow compares • paused fetch cycle
      </footer>
    </div>
  )
}
