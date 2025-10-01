// /app/users/home/PremiumBankCard.jsx
'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
// import { BadgePlus } from 'lucide-react' // ❌ আর দরকার নেই
import Link from 'next/link'
import { useUserStore } from '@/store/userStore'

/* ========================= ODOMETER CORE ========================= */
function OdometerDigit({ digit = 0, height = 28, duration = 280 }) {
  const prevRef = useRef(0)
  const [cycle, setCycle] = useState(0)
  const REPEAT = 50
  const stack = useMemo(() => Array.from({ length: 10 * REPEAT }, (_, i) => i % 10), [])

  useEffect(() => {
    const prev = prevRef.current
    if (digit < prev) setCycle((c) => c + 1)
    prevRef.current = digit
  }, [digit])

  const idx = digit + cycle * 10
  return (
    <span
      className="relative overflow-hidden inline-block align-top rounded-md bg-white/5 ring-1 ring-white/10"
      style={{ height, width: height * 0.58 }}
    >
      <span
        className="block will-change-transform"
        style={{
          transform: `translateY(-${idx * height}px)`,
          transition: `transform ${duration}ms cubic-bezier(.2,.8,.2,1)`,
        }}
      >
        {stack.map((d, i) => (
          <span key={i} className="block leading-none" style={{ height }}>
            {d}
          </span>
        ))}
      </span>
    </span>
  )
}

function OdometerNumber({ value = 0, prefix = '৳', fractionDigits = 2, height = 28, duration = 280 }) {
  const str = useMemo(() => Number(value || 0).toFixed(fractionDigits), [value, fractionDigits])
  const [ints, fr] = str.split('.')
  const intDigits = ints.split('')
  const withCommas = []
  for (let i = 0; i < intDigits.length; i++) {
    const posFromEnd = intDigits.length - i - 1
    withCommas.push(<OdometerDigit key={`i-${i}`} digit={Number(intDigits[i])} height={height} duration={duration} />)
    if (posFromEnd % 3 === 0 && i !== intDigits.length - 1) {
      withCommas.push(
        <span key={`c-${i}`} className="px-0.5 opacity-80">
          ,
        </span>
      )
    }
  }

  return (
    <span className="inline-flex items-end gap-1 font-mono leading-none">
      <span className="opacity-90 mr-1">{prefix}</span>
      <span className="inline-flex items-end">{withCommas}</span>
      <span className="opacity-80 mx-[2px]">.</span>
      {fr.split('').map((d, i) => (
        <OdometerDigit key={`f-${i}`} digit={Number(d)} height={Math.max(22, height - 3)} duration={duration} />
      ))}
    </span>
  )
}
/* ======================= END ODOMETER CORE ======================= */

const symbolFor = (code) => {
  const c = String(code || 'BDT').toUpperCase()
  if (c === 'BDT') return '৳'
  if (c === 'USD') return '$'
  return c
}

export default function PremiumBankCard() {
  const email = useUserStore((s) => s.email)

  const [currency, setCurrency] = useState('BDT')
  const [rate, setRate] = useState(0)
  const [baseAmount, setBaseAmount] = useState(0)
  const [validTransferTime, setValidTransferTime] = useState(null)
  const [requestTime, setRequestTime] = useState(null)

  const [elapsedSec, setElapsedSec] = useState(0)
  const [displayBalance, setDisplayBalance] = useState(0)

  useEffect(() => {
    let alive = true
    if (!email) return
    ;(async () => {
      try {
        const res = await fetch('/api/wallet/growth-snapshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        const json = await res.json()
        if (!alive) return
        if (!json?.success) throw new Error(json?.message || 'Failed to load snapshot')
        const { rate, currency, bank } = json.data || {}
        const amt = Number(bank?.amount || 0)
        const vtt = bank?.validTransferTime ? new Date(bank.validTransferTime) : null
        const rqt = bank?.requestTime ? new Date(bank.requestTime) : null

        setCurrency(String(currency || 'BDT'))
        setRate(Number(rate || 0))
        setBaseAmount(amt)
        setValidTransferTime(vtt)
        setRequestTime(rqt)

        const now = Date.now()
        const start = rqt ? rqt.getTime() : now
        const e = Math.max(0, Math.floor((now - start) / 1000))
        setElapsedSec(e)
        setDisplayBalance(amt + (amt * (Number(rate || 0) / 100) / 86400) * e)
      } catch (e) {
        console.error(e)
      }
    })()
    return () => {
      alive = false
    }
  }, [email])

  useEffect(() => {
    if (!requestTime) return
    let raf
    let lastWhole = Math.floor((Date.now() - requestTime.getTime()) / 1000)
    const tick = () => {
      const cur = Math.floor((Date.now() - requestTime.getTime()) / 1000)
      if (cur !== lastWhole) {
        lastWhole = cur
        setElapsedSec(cur)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [requestTime])

  useEffect(() => {
    const interval = setInterval(() => {
      const perSec = (baseAmount * (rate / 100)) / 86400
      setDisplayBalance(() => {
        const matured = baseAmount + perSec * elapsedSec
        return parseFloat(matured.toFixed(2))
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [baseAmount, rate, elapsedSec])

  useEffect(() => {
    if (elapsedSec % 5 === 0) {
      const perSec = (baseAmount * (rate / 100)) / 86400
      const matured = baseAmount + perSec * elapsedSec
      setDisplayBalance(parseFloat(matured.toFixed(2)))
    }
  }, [elapsedSec, baseAmount, rate])

  const perSecondGain = (baseAmount * (rate / 100)) / 86400
  const perMinuteGain = perSecondGain * 60
  const perHourGain = perSecondGain * 3600
  const perDayGain = baseAmount * (rate / 100)

  const hourlyRatePct = displayBalance > 0 ? (perHourGain / displayBalance) * 100 : 0
  const dailyRatePct = displayBalance > 0 ? (perDayGain / displayBalance) * 100 : 0

  const projected24h = baseAmount + perDayGain
  const projected7d = baseAmount + perDayGain * 7

  const symbol = symbolFor(currency)

  const formatTime = (totalSeconds = 0) => {
    const days = Math.floor(totalSeconds / 86400)
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = Math.floor(totalSeconds % 60)
    const two = (n) => n.toString().padStart(2, '0')
    return `${two(days)}:${two(hours)}:${two(minutes)}:${two(seconds)}`
  }

  const fmt = (n) => `${symbol}${Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  const pct = (n) => `${(Number(n) || 0).toFixed(3)}%`

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl flex flex-col items-center justify-start gap-6">
        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotateY: -180 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 1.2, type: 'spring' }}
          className="relative w-[22rem] sm:w-96 h-56 rounded-3xl overflow-hidden group ring-1 ring-white/10"
        >
          {/* Background */}
          <div className="absolute inset-0 mx-3 rounded-3xl bg-[radial-gradient(120%_120%_at_20%_0%,#16a34a_0%,#178a66_40%,#0f766e_80%)]" />
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 via-transparent to-white/5" />
            <div className="absolute top-10 right-10 w-20 h-20 bg-white/10 rounded-full blur-xl" />
            <div className="absolute bottom-10 left-10 w-16 h-16 bg-cyan-300/20 rounded-full blur-lg" />
          </div>

          {/* Content */}
          <div className="relative z-10 h-full px-8 py-4 flex flex-col justify-between text-white">
            {/* Top */}
            <div className="flex justify-between items-start">
              <div>
                <motion.div
                  className="text-2xl font-bold mb-1"
                  initial={{ opacity: 0, y: -18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <OdometerNumber value={displayBalance} prefix={symbol} fractionDigits={2} height={28} duration={280} />
                </motion.div>
                <motion.div
                  className="text-white/70 text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.55 }}
                >
                  Current Balance
                </motion.div>
              </div>

              <motion.div
                initial={{ scale: 0, rotate: 180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.7, type: 'spring' }}
                className="bg-amber-50/90 text-green-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-white/40 shadow-2xl shadow-amber-500/40"
              >
                Bank
              </motion.div>
            </div>

            {/* ❌ Middle section removed (previous "Add To Bank Balance") */}

            {/* Bottom: left buttons + right timer */}
            <div className="flex justify-between items-end">
              {/* LEFT: two small equal-size buttons */}
              <div className="flex gap-4  flex-col">
                <Link
                  href={"/users/transfer"}
                  className="w-20 uppercase  rounded-full px-3 py-1.5 text-[8px] font-semibold ring-2 ring-yellow-400 bg-white/10 hover:bg-white/15 transition"
                >
                  Withdraw
                </Link>
                <Link
                 href={"/users/transfer"}
                  className="w-20 uppercase rounded-full px-3 py-1.5 text-[8px] font-semibold ring-2 ring-teal-400 bg-white/10 hover:bg-white/15 transition"
                >
                  Invest
                </Link>
              </div>

              {/* RIGHT: timer (unchanged) */}
              <div className="text-right">
                <motion.div
                  className="text-lg font-mono font-bold"
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.0 }}
                >
                  {formatTime(elapsedSec)}
                </motion.div>
                <motion.div
                  className="text-green-100/90 text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.15 }}
                >
                  Since Request
                </motion.div>
              </div>
            </div>
          </div>

          {/* Outer Glow */}
          <motion.div
            className="absolute -inset-4 bg-gradient-to-r from-emerald-500/25 via-cyan-500/25 to-sky-500/25 rounded-3xl blur-xl"
            animate={{ opacity: [0.3, 0.65, 0.3], scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>

        {/* ---------- Analytics (unchanged) ---------- */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full"
        >
          <div className="mx-auto w-full max-w-3xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 text-white shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base sm:text-lg font-semibold">Real-Time Analytics</h3>
              <span className="text-xs sm:text-sm text-white/70">Updated: Every 5 seconds</span>
            </div>

            <div className="overflow-hidden rounded-xl border border-white/10">
              <table className="w-full text-xs sm:text-sm">
                <tbody className="[&_tr:nth-child(even)]:bg-white/5">
                  <tr className="border-b border-white/10">
                    <td className="px-3 py-2 text-white/80">Base Amount (from DB)</td>
                    <td className="px-3 py-2 text-right">{fmt(baseAmount)}</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="px-3 py-2 text-white/80">Day Rate</td>
                    <td className="px-3 py-2 text-right font-semibold">{pct(rate)}</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="px-3 py-2 text-white/80">Current Balance (live)</td>
                    <td className="px-3 py-2 text-right font-semibold">{fmt(displayBalance)}</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="px-3 py-2 text-white/80">Per-Second Increase</td>
                    <td className="px-3 py-2 text-right">{fmt(perSecondGain)}</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="px-3 py-2 text-white/80">Per-Minute Increase</td>
                    <td className="px-3 py-2 text-right">{fmt(perMinuteGain)}</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="px-3 py-2 text-white/80">Per-Hour Increase</td>
                    <td className="px-3 py-2 text-right">{fmt(perHourGain)}</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="px-3 py-2 text-white/80">Hourly Growth Rate</td>
                    <td className="px-3 py-2 text-right">{pct(hourlyRatePct)}</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="px-3 py-2 text-white/80">Projected Increase (24h)</td>
                    <td className="px-3 py-2 text-right">{fmt(perDayGain)}</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="px-3 py-2 text-white/80">Projected Balance (24h)</td>
                    <td className="px-3 py-2 text-right font-semibold">{fmt(projected24h)}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-white/80">Projected Balance (7 days)</td>
                    <td className="px-3 py-2 text-right">{fmt(projected7d)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {requestTime && validTransferTime ? (
              <p className="mt-3 text-[11px] sm:text-xs text-white/60">
                Request Time: {new Date(requestTime).toLocaleString()} • Eligible Since: {new Date(validTransferTime).toLocaleString()}
              </p>
            ) : null}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
