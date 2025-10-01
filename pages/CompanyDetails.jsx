'use client'

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import 'odometer/themes/odometer-theme-default.css'

// Dynamic imports (no SSR) for browser-only libs
const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })
const Odometer = dynamic(() => import('react-odometerjs'), { ssr: false })

/*
  Install once:
  npm i apexcharts react-apexcharts react-odometerjs odometer
*/

// -------------------- FULL DEMO DATA (replace later with DB) --------------------
// Stores complete OHLC candles and an up/down feed. Drop in your DB data in the
// same shape and the UI will render it.
const DEMO = {
  stepSec: 3, // seconds between candles
  startTs: Date.now() - 19 * 3 * 1000, // first candle timestamp (ms)
  // [open, high, low, close]
  candles: [
    [170.0, 170.9, 169.7, 170.6],
    [170.6, 171.1, 170.1, 170.95],
    [170.95, 171.35, 170.4, 171.2],
    [171.2, 171.85, 171.0, 171.6],
    [171.6, 172.1, 171.3, 171.45],
    [171.45, 171.8, 171.1, 171.55],
    [171.55, 172.2, 171.4, 172.05],
    [172.05, 172.6, 171.8, 172.4],
    [172.4, 172.7, 171.9, 172.1],
    [172.1, 172.5, 171.7, 172.3],
    [172.3, 172.95, 172.1, 172.8],
    [172.8, 173.2, 172.4, 172.55],
    [172.55, 173.05, 172.2, 172.9],
    [172.9, 173.3, 172.6, 173.1],
    [173.1, 173.5, 172.8, 173.4],
    [173.4, 173.8, 173.0, 173.15],
    [173.15, 173.6, 172.9, 173.45],
    [173.45, 173.9, 173.1, 173.7],
    [173.7, 174.1, 173.4, 173.95],
    [173.95, 174.3, 173.6, 174.1],
  ],
  updowns: [
    'UP',
    'UP',
    'DOWN',
    'UP',
    'UP',
    'DOWN',
    'UP',
    'UP',
    'DOWN',
    'UP',
    'UP',
    'DOWN',
    'UP',
    'UP',
    'UP',
    'DOWN',
    'UP',
    'UP',
    'UP',
    'UP',
  ],
}

// Single company meta (logo + base used for fallback seeding)
const COMPANY = { key: 'AAPL', name: 'Apple', logo: '', base: 170 }

// -------------------- Fallback seed (used only when DEMO.candles empty) --------------------
function seededCandles({ n, startPrice = 100, vol = 1.0, stepSec = 3, biasUp = 0.55 }) {
  const now = Math.floor(Date.now() / 1000)
  const start = now - n * stepSec
  const data = []
  let last = startPrice
  for (let i = 0; i < n; i++) {
    const open = last
    const up = Math.random() < biasUp // 55% up, 45% down
    const mag = Math.random() * vol
    const close = Math.max(1, open + (up ? mag : -mag))
    const high = Math.max(open, close) + Math.random() * (vol * 0.6)
    const low = Math.min(open, close) - Math.random() * (vol * 0.6)
    data.push({ x: new Date((start + i * stepSec) * 1000), y: [open, high, low, close] })
    last = close
  }
  return data
}

// -------------------- Live Candlestick (ApexCharts) --------------------
function LiveCandleChart({ className = '', biasUp = 0.55, basePrice = 100, onTick, onBar }) {
  // Use DEMO.stepSec if given; otherwise 3s
  const stepSec = DEMO?.stepSec || 3
  const MAX_BARS = 50 // show exactly the latest 50 candles

  // Initial data: prefer DEMO.candles; else fall back to synthetic seed
  const [series, setSeries] = useState(() => {
    const seed =
      Array.isArray(DEMO?.candles) && DEMO.candles.length
        ? DEMO.candles.slice(-MAX_BARS).map((ohlc, i) => ({
            x: new Date((DEMO.startTs || Date.now()) + i * stepSec * 1000),
            y: ohlc,
          }))
        : seededCandles({ n: MAX_BARS, startPrice: basePrice, vol: 1.0, stepSec, biasUp })
    return [{ data: seed }]
  })

  const [tickCount, setTickCount] = useState(0)
  const [barCount, setBarCount] = useState(0)
  const lastDeltaRef = useRef(0)
  const newBarRef = useRef(false)
  const ticksRef = useRef(0)
  const timerRef = useRef(null)

  const options = useMemo(
    () => ({
      chart: {
        type: 'candlestick',
        animations: { enabled: false },
        background: 'transparent',
        toolbar: { show: false },
        foreColor: '#d1d5db',
      },
      theme: { mode: 'dark' },
      grid: { show: true, borderColor: 'rgba(255,255,255,0.08)', strokeDashArray: 3 },
      xaxis: {
        type: 'datetime',
        labels: { datetimeUTC: false },
        axisBorder: { show: false },
        axisTicks: { show: false },
        range: stepSec * 1000 * MAX_BARS, // window spans exactly 50 bars
      },
      yaxis: { tooltip: { enabled: true }, decimalsInFloat: 2 },
      plotOptions: {
        candlestick: {
          colors: { upward: '#22c55e', downward: '#ef4444' }, // up green, down red
          wick: { useFillColor: true },
        },
      },
      tooltip: { theme: 'dark', x: { format: 'HH:mm:ss' } },
    }),
    [stepSec],
  )

  // Live updater — every 1s tweak last candle; every stepSec push a new candle
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    const vol = 1.0

    // (Re)seed once (e.g., when base/bias change) from DEMO if present
    {
      const seed =
        Array.isArray(DEMO?.candles) && DEMO.candles.length
          ? DEMO.candles.slice(-MAX_BARS).map((ohlc, i) => ({
              x: new Date((DEMO.startTs || Date.now()) + i * stepSec * 1000),
              y: ohlc,
            }))
          : seededCandles({ n: MAX_BARS, startPrice: basePrice, vol, stepSec, biasUp })
      setSeries([{ data: seed }])
    }

    ticksRef.current = 0

    timerRef.current = setInterval(() => {
      setSeries((prev) => {
        const curr = prev[0]?.data || []
        if (curr.length === 0) return prev
        const lastIdx = curr.length - 1
        const last = curr[lastIdx]
        const [o, h, l, c] = last.y

        const forceUp = Math.random() < biasUp
        const mag = Math.random() * vol * 0.6
        const nextClose = Math.max(1, c + (forceUp ? mag : -mag))
        const nextHigh = Math.max(h, nextClose)
        const nextLow = Math.min(l, nextClose)

        const updated = curr.slice()
        updated[lastIdx] = { x: last.x, y: [o, nextHigh, nextLow, nextClose] }
        ticksRef.current += 1

        // delta for %
        lastDeltaRef.current = nextClose - c
        setTickCount((t) => t + 1)

        // every stepSec seconds, roll a fresh candle
        if (ticksRef.current % stepSec === 0) {
          const t = new Date(last.x.getTime() + stepSec * 1000)
          updated.push({ x: t, y: [nextClose, nextClose, nextClose, nextClose] })
          while (updated.length > MAX_BARS) updated.shift()
          newBarRef.current = true
          setBarCount((b) => b + 1)
        }
        return [{ data: updated }]
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [biasUp, basePrice, stepSec])

  // Call parent onTick AFTER render commit
  useEffect(() => {
    if (typeof onTick === 'function') onTick(lastDeltaRef.current)
  }, [tickCount, onTick])

  // Call parent onBar AFTER the new bar commit
  useEffect(() => {
    if (newBarRef.current) {
      newBarRef.current = false
      if (typeof onBar === 'function') onBar()
    }
  }, [barCount, onBar])

  return (
    <div className={className}>
      <ApexChart options={options} series={series} type="candlestick" height={280} />
    </div>
  )
}

// -------------------- Page --------------------
export default function CompanyDetails() {
  const [openRanges, setOpenRanges] = useState(false)
  const [selectedRange, setSelectedRange] = useState('1D')
  const [shareholders, setShareholders] = useState(50000)
  const [pct, setPct] = useState(2.0)

  // per-second % update: +0.001 on up tick, -0.001 on down tick
  const handleTick = useCallback((delta) => {
    if (delta > 0) setPct((p) => +(p + 0.001).toFixed(3))
    else if (delta < 0) setPct((p) => +(p - 0.001).toFixed(3))
  }, [])

  // every new bar (3s by DEMO.stepSec): primary increase; then after 1s: decrease
  const handleBar = useCallback(() => {
    const big = Math.random() < 0.7
    const incPool = big ? [5, 6, 7] : [2]
    const inc = incPool[Math.floor(Math.random() * incPool.length)]
    setShareholders((v) => v + inc)

    setTimeout(() => {
      const dec = 2 + Math.floor(Math.random() * 2) // 2 or 3
      setShareholders((v) => Math.max(0, v - dec))
    }, 1000)
  }, [])

  const pctText = useMemo(() => `${pct.toFixed(3)}%`, [pct])

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-28 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-28 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_10%,#3b0764_0%,#0b1220_60%,#030712_100%)]" />
      </div>

      {/* Phone card wrapper (slightly bigger on mobile) */}
      <div className="mx-auto max-w-[520px] p-4 sm:p-6">
        <div className="rounded-[28px] bg-white/5 backdrop-blur-xl ring-1 ring-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.45)] overflow-hidden">
          {/* Chart panel */}
          <div className="m-3 rounded-2xl bg-[#0d1726] ring-1 ring-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
            <div className="rounded-2xl overflow-hidden">
              <LiveCandleChart
                className="w-full h-[280px]"
                biasUp={0.55}
                basePrice={COMPANY.base}
                onTick={handleTick}
                onBar={handleBar}
              />
            </div>
          </div>

          {/* Up/Down feed from DEMO data */}
          <div className="px-3 pb-2">
            <div className="flex flex-wrap gap-2">
              {DEMO.updowns.map((d, i) => (
                <span
                  key={i}
                  className={`px-2 py-1 rounded-md text-xs font-semibold ring-1 ${
                    d === 'UP'
                      ? 'bg-emerald-500/15 ring-emerald-400/30 text-emerald-300'
                      : 'bg-rose-500/15 ring-rose-400/30 text-rose-300'
                  }`}
                >
                  {d === 'UP' ? '⬆ UP' : '⬇ DOWN'}
                </span>
              ))}
            </div>
          </div>

          {/* Symbol row with logo • name • shareholders inline • % on right */}
          <div className="px-3 pb-2">
            <div className="rounded-2xl bg-[#0f1c2e] ring-1 ring-white/10 p-3 flex items-center gap-3 shadow-[0_8px_24px_-10px_rgba(56,189,248,0.20)]">
              {/* logo */}
              <div className="h-10 w-10 rounded-full grid place-items-center bg-white/10 ring-1 ring-white/15 text-xl">
                <span aria-hidden>{COMPANY.logo}</span>
              </div>

              {/* name + shareholders inline */}
              <div className="flex items-baseline gap-3 flex-1 min-w-0">
                <div className="font-semibold tracking-wide">{COMPANY.name}</div>
                <div className="text-xs text-white/70">Shareholders</div>
                <div className="text-base font-semibold">
                  <Odometer value={shareholders} format="(,ddd)" duration={500} />
                </div>
              </div>

              {/* live % on right */}
              <div className="text-right">
                <div className="text-white/70 text-xs">Change</div>
                <div className="text-sm font-semibold tabular-nums">{pctText}</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-3 pb-4 grid grid-cols-2 gap-3">
            <button
              className="rounded-2xl py-3 text-lg font-bold text-white ring-1 ring-white/10 shadow-lg bg-gradient-to-b from-emerald-500 to-emerald-600 hover:brightness-105 active:scale-[0.99] transition"
              onClick={() => setOpenRanges(true)}
            >
              Buy
            </button>
            <button className="rounded-2xl py-3 text-lg font-bold text-white ring-1 ring-white/10 shadow-lg bg-gradient-to-b from-rose-500 to-rose-600 hover:brightness-105 active:scale-[0.99] transition">
              Sell
            </button>
          </div>
        </div>

        {/* Range modal (six buttons) */}
        {openRanges && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60">
            <div className="w-full max-w-sm rounded-2xl bg-[#0f1c2e] ring-1 ring-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold">Select Range</div>
                <button
                  className="text-white/70 hover:text-white"
                  onClick={() => setOpenRanges(false)}
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {['1D', '2D', '4D', '7D', '15D', '30D'].map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setSelectedRange(r)
                      setOpenRanges(false)
                    }}
                    className={`rounded-2xl py-3 font-semibold ring-1 transition ${
                      selectedRange === r
                        ? 'bg-gradient-to-r from-fuchsia-500/25 to-cyan-500/25 ring-white/20'
                        : 'bg-[#0f1c2e] ring-white/10 hover:bg-white/10'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Small caption */}
        <p className="mt-4 text-center text-white/60 text-xs">
          Monalica • glass UI • 55/45 bias • 3s bars • last 50 candles • demo OHLC feed
        </p>
      </div>
    </div>
  )
}
