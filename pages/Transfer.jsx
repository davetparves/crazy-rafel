'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react'
import { useUserStore } from '@/store/userStore'

/* ======================= CONFIG ======================= */
const chipSet = [10, 20, 30, 50, 100]

const symbolFor = (code) => {
  const c = String(code || 'bdt').toLowerCase()
  if (c === 'bdt') return '$' // kept as you had
  if (c === 'usd') return '$'
  return c
}
/* ===================== END CONFIG ===================== */

function Card({ title, children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-4 md:p-6 shadow-[0_0_35px_-15px_rgba(99,102,241,0.5)] ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm md:text-base font-bold">{title}</h3>
        <span className="text-[11px] text-white/50">secure</span>
      </div>
      {children}
    </div>
  )
}

function BalanceBox({ label, value, highlight, cornerText, currencySymbol = '$', variant }) {
  const isGreen = variant === 'green'
  return (
    <div className="w-full relative">
      {cornerText ? (
        <span className="absolute -top-2 -right-2 z-10 rounded-lg bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30 px-2 py-[2px] text-[10px] font-bold">
          {cornerText}
        </span>
      ) : null}
      <div
        className={`rounded-xl px-4 py-3 ring-1 ${
          isGreen ? 'ring-emerald-400/25 bg-emerald-900/25' : 'ring-white/10 bg-slate-900/60'
        } ${highlight ? 'shadow-[0_10px_20px_-10px_rgba(34,197,94,0.45)]' : ''}`}
      >
        <p className="text-[11px] text-white/60">{label}</p>
        <p className="mt-0.5 text-lg font-extrabold tabular-nums">
          {Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
          <span className="text-green-400 text-lg">{currencySymbol}</span>
        </p>
      </div>
    </div>
  )
}

function Arrow() {
  return (
    <motion.div
      initial={{ opacity: 0.7 }}
      animate={{ opacity: 1 }}
      transition={{ repeat: Infinity, repeatType: 'mirror', duration: 1.2 }}
      className="mx-2 md:mx-4"
    >
      <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-white/80" />
    </motion.div>
  )
}

function ConfirmModal({ open, onCancel, onConfirm, from, to, amount, currencySymbol = '$', confirming = false }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div onClick={onCancel} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            className="relative mx-4 w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-[0_0_50px_-15px_rgba(99,102,241,0.6)] p-5"
            initial={{ y: 16, scale: 0.98, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 16, scale: 0.98, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
          >
            <h4 className="text-lg font-extrabold mb-1">Confirm Transfer</h4>
            <p className="text-sm text-white/80">
              Transfer{' '}
              <span className="font-bold">
                {currencySymbol} {Number(amount).toLocaleString()}
              </span>{' '}
              from <span className="font-semibold capitalize">{from}</span> to <span className="font-semibold capitalize">{to}</span>?
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button onClick={onCancel} className="rounded-2xl py-2.5 text-sm font-bold ring-1 ring-white/10 bg-gradient-to-r from-rose-600 via-red-600 to-rose-500 hover:opacity-95 transition">
                Cancel
              </button>
              <button
                disabled={confirming}
                onClick={() => { if (!confirming) onConfirm() }}
                aria-busy={confirming}
                className={`rounded-2xl py-2.5 text-sm font-bold ring-1 ring-white/10 transition flex items-center justify-center gap-2
                  ${confirming ? 'bg-white/10 cursor-wait opacity-80' : 'bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 hover:opacity-95'}`}
              >
                {confirming ? (<><RefreshCw className="w-4 h-4 animate-spin" />Processing...</>) : ('Confirm')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ✅ Decision modal for <24h case
function DecisionModal({ open, note, onCancel, onConfirm }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div onClick={onCancel} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            className="relative mx-4 w-full max-w-lg rounded-3xl border border-yellow-400/20 bg-yellow-950/30 backdrop-blur-xl shadow-[0_0_50px_-15px_rgba(234,179,8,0.5)] p-5"
            initial={{ y: 16, scale: 0.98, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 16, scale: 0.98, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
          >
            <div className="flex items-center gap-2 mb-2 text-yellow-300">
              <AlertTriangle className="w-5 h-5" />
              <h4 className="text-lg font-extrabold">Decision holding</h4>
            </div>
            <p className="text-sm text-yellow-100/90">{note}</p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button onClick={onCancel} className="rounded-2xl py-2.5 text-sm font-bold ring-1 ring-white/10 bg-white/10 hover:bg-white/20 transition">
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="rounded-2xl py-2.5 text-sm font-bold ring-1 ring-white/10 bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:opacity-95 transition"
              >
                Confirm (no interest)
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function Transfer() {
  const email = useUserStore((s) => s.email)

  const [balances, setBalances] = useState({ referral: 0, bonus: 0, main: 0, bank: 0 })
  const [currency, setCurrency] = useState('bdt')
  const [rate, setRate] = useState(1.2)
  const [requestTime, setRequestTime] = useState(null)
  const [now, setNow] = useState(Date.now())
  const [activeField, setActiveField] = useState(null)

  const inputRefs = useRef({})

  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const [amounts, setAmounts] = useState({
    'referral-main': '',
    'bonus-main': '',
    'main-bank': '',
    'bank-main': '',
  })

  const [pending, setPending] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)

  // ✅ New: decision modal state
  const [showDecision, setShowDecision] = useState(false)
  const [decisionNote, setDecisionNote] = useState('')

  useEffect(() => {
    let alive = true
    if (!email) return
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/wallet/get-all', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        const json = await res.json()
        if (!alive) return
        if (json?.success && json?.data) {
          const { main = 0, bonus = 0, referral = 0, bank = 0, currency: cur = 'BDT', rate: growthRate = 1.2, requestTime: bankReqTime = null } = json.data
          setBalances({ main, bonus, referral, bank })
          setCurrency(String(cur || 'BDT').toLowerCase())
          setRate(Number(growthRate))
          setRequestTime(bankReqTime)
        } else {
          toast.error(json?.message || 'Failed to load wallet')
        }
      } catch {
        toast.error('Server error while loading wallet')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [email])

  useEffect(() => {
    const id = setInterval(() => { if (!activeField) setNow(Date.now()) }, 1000)
    return () => clearInterval(id)
  }, [activeField])

  useEffect(() => {
    if (!activeField) return
    const el = inputRefs.current[activeField]
    if (el && document.activeElement !== el) {
      el.focus({ preventScroll: true })
      const v = el.value; el.setSelectionRange?.(v.length, v.length)
    }
  }, [amounts, activeField])

  const computedBank = useMemo(() => {
    const base = Number(balances.bank || 0)
    if (!requestTime || !base || !Number.isFinite(base)) return base
    const start = new Date(requestTime).getTime()
    if (!start || Number.isNaN(start)) return base
    const hours = Math.max(0, (now - start) / 3_600_000)
    const inc = base * (Number(rate || 0) / 100) * (hours / 24)
    return base + inc
  }, [balances.bank, requestTime, rate, now])

  // 🔗 API call (now supports 'call' param)
  const postTransfer = async (from, to, amount, callVal = 1) => {
    if (!email) return { success: false, message: 'Please sign in first.' }
    try {
      const res = await fetch('/api/wallet/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          route: [{ from }, { to }],
          amount,
          call: callVal, // ✅
        }),
      })
      const json = await res.json()
      return json
    } catch {
      return { success: false, message: 'Network error' }
    }
  }

  const canMove = (from, amount) => {
    if (!Number.isFinite(amount) || amount <= 0) return 'Enter a valid amount.'
    if (balances[from] < amount) return `Insufficient ${from} balance.`
    return null
  }

  const requestTransfer = (key, from, to, amount) => {
    const amt = Number(amount)
    const err = canMove(from, amt)
    if (err) return toast.error(err)
    setPending({ key, from, to, amount: amt })
    setShowConfirm(true)
  }

  const performTransfer = async () => {
    if (!pending) return
    const { key, from, to, amount } = pending
    try {
      setConfirming(true)
      setLoading(true)

      // ✅ প্রথম কল — bank->main হলে call=1, নাহলে call=1 ও যথেষ্ট
      const initialCall = (from === 'bank' && to === 'main') ? 1 : 1
      const res = await postTransfer(from, to, amount, initialCall)

      if (res?.hold) {
        // ⏳ Decision holding → নোট দেখাও, balances আপডেট করবে না
        setShowConfirm(false)
        setDecisionNote(res?.note || 'Decision holding.')
        setShowDecision(true)
        return
      }

      if (!res?.success) {
        return toast.error(res?.message || 'Transfer failed')
      }

      // ✅ success path
      if (res?.data) {
        const {
          main = balances.main,
          bonus = balances.bonus,
          referral = balances.referral,
          bank = balances.bank,
          currency: cur = currency,
          rate: growthRate = rate,
          requestTime: bankReqTime = requestTime,
        } = res.data
        setBalances({ main, bonus, referral, bank })
        setCurrency(String(cur || currency).toLowerCase())
        setRate(Number(growthRate ?? rate))
        setRequestTime(bankReqTime ?? requestTime)
      } else {
        setBalances((prev) => ({ ...prev, [from]: prev[from] - amount, [to]: prev[to] + amount }))
      }

      setAmounts((prev) => ({ ...prev, [key]: '' }))
      toast.success(res?.message || `Transferred ${symbolFor(currency)} ${amount.toLocaleString()} from ${from} → ${to}`)
      setShowConfirm(false)
      setPending(null)
    } catch {
      toast.error('Server error')
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  // ✅ decision modal-এর Confirm: same data with call=2 (no interest)
  const confirmEarlyNoInterest = async () => {
    if (!pending) return
    const { key, from, to, amount } = pending
    try {
      setLoading(true)
      const res = await postTransfer(from, to, amount, 2)
      if (!res?.success) {
        return toast.error(res?.message || 'Transfer failed')
      }

      if (res?.data) {
        const {
          main = balances.main,
          bonus = balances.bonus,
          referral = balances.referral,
          bank = balances.bank,
          currency: cur = currency,
          rate: growthRate = rate,
          requestTime: bankReqTime = requestTime,
        } = res.data
        setBalances({ main, bonus, referral, bank })
        setCurrency(String(cur || currency).toLowerCase())
        setRate(Number(growthRate ?? rate))
        setRequestTime(bankReqTime ?? requestTime)
      }

      setAmounts((prev) => ({ ...prev, [key]: '' }))
      toast.success(res?.message || 'Transferred without interest.')
      setShowDecision(false)
      setPending(null)
    } catch {
      toast.error('Server error')
    } finally {
      setLoading(false)
    }
  }

  const AmountSection = ({ id, from, to }) => {
    const val = amounts[id]
    const num = Number(val || 0)
    const disabled = loading || !val || !Number.isFinite(num) || num <= 0 || balances[from] < num

    return (
      <>
        <div className="mt-4 grid grid-cols-5 gap-2">
          {chipSet.map((c) => (
            <button
              key={c}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setAmounts((prev) => ({ ...prev, [id]: String(c) })); setActiveField(id) }}
              className="rounded-xl px-0 py-2 text-xs font-semibold ring-1 ring-white/10 bg-slate-800/60 text-white hover:bg-slate-700/80 transition"
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <input
            ref={(el) => (inputRefs.current[id] = el)}
            value={val}
            onChange={(e) => {
              const v = e.target.value.replace(/[^\d]/g, '')
              setAmounts((prev) => ({ ...prev, [id]: v }))
              setActiveField(id)
            }}
            onFocus={() => setActiveField(id)}
            onBlur={() => setActiveField(null)}
            placeholder="Custom amount"
            inputMode="numeric"
            className="flex-1 rounded-xl bg-slate-900/60 px-3 py-2 text-sm ring-1 ring-white/10 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
          />
          <button
            disabled={disabled}
            onClick={() => requestTransfer(id, from, to, num)}
            className={`rounded-xl px-3 py-2 text-sm font-semibold ring-1 transition ${
              disabled ? 'bg-white/10 text-white/60 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 hover:opacity-90 ring-white/10'
            }`}
          >
            Transfer
          </button>
        </div>

        <div className="mt-2 text-[11px] text-white/60 flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5" />
          Pick a quick chip or enter a custom amount, then press Transfer.
        </div>
      </>
    )
  }

  const currencySymbol = symbolFor(currency)

  return (
    <div className="relative min-h-screen overflow-x-hidden text-white bg-[radial-gradient(80%_60%_at_20%_10%,#1e1b4b_0%,#0b1220_60%,#030712_100%)]">
      <ToastContainer position="top-center" autoClose={1300} theme="dark" />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-28 -left-28 h-80 w-80 rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl p-4 md:p-6">
        <div className="grid grid-cols-1 gap-4 md:gap-6">
          <Card title="Referral → Main">
            <div className="flex items-center">
              <BalanceBox label="Referral" value={balances.referral} currencySymbol={currencySymbol} />
              <Arrow />
              <BalanceBox label="Main" value={balances.main} highlight currencySymbol={currencySymbol} />
            </div>
            <AmountSection id="referral-main" from="referral" to="main" />
          </Card>

          <Card title="Bonus → Main">
            <div className="flex items-center">
              <BalanceBox label="Bonus" value={balances.bonus} currencySymbol={currencySymbol} />
              <Arrow />
              <BalanceBox label="Main" value={balances.main} highlight currencySymbol={currencySymbol} />
            </div>
            <AmountSection id="bonus-main" from="bonus" to="main" />
          </Card>

          <Card title="Main → Bank">
            <div className="flex items-center">
              <BalanceBox label="Main" value={balances.main} currencySymbol={currencySymbol} />
              <Arrow />
              <BalanceBox
                label="Bank"
                value={computedBank}
                cornerText={`(+${Number(rate ?? 0).toFixed(2)}%)/Day`}
                currencySymbol={currencySymbol}
                variant="green"
              />
            </div>
            <AmountSection id="main-bank" from="main" to="bank" />
          </Card>

          <Card title="Bank → Main">
            <div className="flex items-center">
              <BalanceBox label="Bank" value={computedBank} currencySymbol={currencySymbol} variant="green" />
              <Arrow />
              <BalanceBox label="Main" value={balances.main} highlight currencySymbol={currencySymbol} />
            </div>
            <AmountSection id="bank-main" from="bank" to="main" />
          </Card>
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        open={showConfirm}
        onCancel={() => { if (!confirming) { setShowConfirm(false); } }}
        onConfirm={performTransfer}
        from={pending?.from} to={pending?.to} amount={pending?.amount || 0}
        currencySymbol={currencySymbol}
        confirming={confirming}
      />

      {/* Decision Modal (<24h) */}
      <DecisionModal
        open={showDecision}
        note={decisionNote}
        onCancel={() => setShowDecision(false)}
        onConfirm={confirmEarlyNoInterest}
      />
    </div>
  )
}
