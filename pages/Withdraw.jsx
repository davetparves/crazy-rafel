'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { FaMoneyBillWave, FaPaperPlane } from 'react-icons/fa'
import { useUserStore } from '@/store/userStore'

const METHODS = ['bKash', 'Nagad', 'Rocket', 'Upay']
const cleanDigits = (s) => s.replace(/[^\d]/g, '')
const cleanEmail = (s) => s.trim()

export default function Withdraw() {
  const userEmail = useUserStore((s) => s.email)

  const [method, setMethod] = useState(METHODS[0])
  const [agentEmail, setAgentEmail] = useState('')
  const [paymentNumber, setPaymentNumber] = useState('')
  const [amount, setAmount] = useState('')

  const [balance, setBalance] = useState(0)
  const [currency, setCurrency] = useState('BDT')
  const [loadingBal, setLoadingBal] = useState(false)

  // ✅ পেজ লোডে / ইমেইল বদলালে main balance + currency লোড হবে
  useEffect(() => {
    let alive = true
    async function load() {
      if (!userEmail) return
      setLoadingBal(true)
      try {
        const res = await fetch('/api/users/balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail }),
        })
        const json = await res.json()
        if (!alive) return
        if (json?.success) {
          setBalance(Number(json?.data?.balance || 0))
          setCurrency(String(json?.data?.currency || 'BDT'))
        } else {
          toast.error(json?.message || 'Balance load failed')
        }
      } catch {
        if (alive) toast.error('Server error while loading balance')
      } finally {
        if (alive) setLoadingBal(false)
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [userEmail])

  // ▶️ ফি/নেট (দেখানোর জন্য)
  const feeRate = 0.015
  const gross = Number(amount || 0)
  const fee = useMemo(() => Math.round(gross * feeRate), [gross])
  const net = useMemo(() => Math.max(gross - fee, 0), [gross, fee])

  // ▶️ ভ্যালিডেশন + ডিসেবল লজিক
  const amtNum = Number(amount || 0)
  const amountInvalid = !Number.isFinite(amtNum) || amtNum <= 0
  const exceedsBalance = amtNum > Number(balance || 0)
  const emailInvalid = !agentEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(agentEmail)
  const numberInvalid = !paymentNumber || paymentNumber.length < 6
  const noUserEmail = !userEmail

  // 🔒 মিনিমাম শর্ত: main balance >= 300 না হলে বাটন সবসময় disabled
  const hasMinBalance = Number(balance || 0) >= 300
  const hasMinAmount = amtNum >= 300

  const disabled =
    !hasMinBalance ||
    !hasMinAmount ||
    amountInvalid ||
    exceedsBalance ||
    emailInvalid ||
    numberInvalid ||
    noUserEmail ||
    loadingBal

  const onSubmit = async () => {
    if (disabled) return
    try {
      const res = await fetch('/api/users/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentEmail: agentEmail.trim().toLowerCase(),
          method,
          paymentNumber,
          amount: amtNum,
          userEmail: userEmail.trim().toLowerCase(),
        }),
      })
      const json = await res.json()
      if (json?.success) {
        toast.success('Withdraw request submitted ✅')
        setAmount('')
        // ব্যাকএন্ডে কেটে নেওয়া হয়েছে—ফ্রন্টেও রিফ্রেশ করি
        setBalance((b) => Math.max(0, b - amtNum))
      } else {
        toast.error(json?.message || 'Submit failed')
      }
    } catch {
      toast.error('Server error while submitting')
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center overflow-hidden relative p-4 text-white bg-[radial-gradient(80%_60%_at_20%_10%,#3b0764_0%,#0b1220_60%,#030712_100%)]">
      {/* glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-60 w-60 rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-60 w-60 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      <ToastContainer
        position="top-right"
        autoClose={1400}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover={false}
        theme="dark"
        style={{ zIndex: 9999, top: 12, right: 12 }}
        toastClassName={() =>
          'relative flex p-3 min-h-10 rounded-xl bg-slate-900/90 text-white backdrop-blur-xl ring-1 ring-white/10 shadow-lg'
        }
        bodyClassName={() => 'text-sm font-medium'}
      />

      {/* compact card */}
      <div
        className="w-full max-w-2xl rounded-2xl bg-white/5 backdrop-blur-2xl ring-1 ring-white/10 shadow-[0_0_30px_-10px_rgba(139,92,246,0.4)] overflow-hidden"
        style={{ maxHeight: '90vh' }}
      >
        <header className="px-4 py-3 border-b border-white/10 bg-gradient-to-r from-fuchsia-500/10 to-sky-500/10">
          <div className="flex items-center gap-2">
            <FaMoneyBillWave className="text-fuchsia-300 text-xl" />
            <h1 className="text-base sm:text-lg font-extrabold bg-gradient-to-r from-fuchsia-300 via-violet-300 to-sky-300 bg-clip-text text-transparent">
              Withdraw
            </h1>
          </div>
        </header>

        <form
          className="px-4 py-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
        >
          {/* login hint */}
          {noUserEmail && (
            <div className="text-[11px] text-amber-300 bg-amber-500/10 ring-1 ring-amber-500/30 rounded-lg px-3 py-2">
              Please sign in / set email in store to proceed.
            </div>
          )}

          {/* Agent Email */}
          <div className="space-y-1">
            <label className="block text-white/80 text-xs">Agent Email</label>
            <input
              type="email"
              placeholder="agent@example.com"
              value={agentEmail}
              onChange={(e) => setAgentEmail(cleanEmail(e.target.value))}
              className={`w-full bg-slate-900/50 ring-1 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 ${
                emailInvalid && agentEmail
                  ? 'ring-rose-400/40 focus:ring-rose-400/60'
                  : 'ring-white/10 focus:ring-fuchsia-400/50'
              }`}
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-1">
            <span className="block text-white/80 text-xs">Payment Method</span>
            <div className="grid grid-cols-4 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`w-full rounded-lg px-2 py-2 text-xs font-semibold ring-1 transition ${
                    method === m
                      ? 'bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 text-white shadow ring-white/20'
                      : 'bg-slate-900/40 text-white hover:bg-slate-800/60 ring-white/10'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Number */}
          <div className="space-y-1">
            <label className="block text-white/80 text-xs">Payment Number</label>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="যে নম্বরে টাকা নেবেন"
              value={paymentNumber}
              onChange={(e) => setPaymentNumber(cleanDigits(e.target.value))}
              className={`w-full bg-slate-900/50 ring-1 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 ${
                numberInvalid && paymentNumber
                  ? 'ring-rose-400/40 focus:ring-rose-400/60'
                  : 'ring-white/10 focus:ring-fuchsia-400/50'
              }`}
            />
          </div>

          {/* Amount + Balance */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-white/80 text-xs">
                Amount ({currency.toUpperCase()})
              </label>
              <span className="text-[11px] text-white/60">
                Balance:{' '}
                <span className="font-semibold text-green-400 text-lg">
                  {loadingBal ? '…' : `${currency.toUpperCase()} ${Number(balance).toLocaleString()}`}
                </span>
              </span>
            </div>
            <input
              type="text"
              inputMode="numeric"
              placeholder="e.g. 500"
              value={amount}
              onChange={(e) => setAmount(cleanDigits(e.target.value))}
              className={`w-full bg-slate-900/50 ring-1 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 ${
                (amountInvalid && amount) || exceedsBalance || (!hasMinAmount && amount)
                  ? 'ring-rose-400/40 focus:ring-rose-400/60'
                  : 'ring-white/10 focus:ring-fuchsia-400/50'
              }`}
            />
            <div className="flex items-center justify-between text-[11px]">
              <span className={`${exceedsBalance ? 'text-rose-300' : 'text-white/50'}`}>
                {exceedsBalance
                  ? 'Amount exceeds balance'
                  : `Fee ~ ${fee.toLocaleString()} ${currency} · Net ~ ${net.toLocaleString()} ${currency}`}
              </span>
              {!hasMinBalance && (
                <span className="text-amber-300">
                  Minimum balance required is 300 {currency} for withdrawal.
                </span>
              )}
              {hasMinBalance && !hasMinAmount && (
                <span className="text-amber-300">Minimum withdraw amount is 300 {currency}.</span>
              )}
            </div>
          </div>

          {/* Submit */}
          <motion.button
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            type="submit"
            disabled={disabled}
            className={`w-full rounded-xl py-2.5 text-sm font-semibold ring-1 transition ${
              disabled
                ? 'bg-white/10 text-white/60 cursor-not-allowed'
                : 'bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 hover:opacity-90 text-white shadow-[0_10px_20px_-10px_rgba(139,92,246,0.6)] ring-white/10'
            }`}
          >
            <FaPaperPlane className="mr-2 inline" /> Submit Withdraw Request
          </motion.button>
        </form>
      </div>
    </div>
  )
}
