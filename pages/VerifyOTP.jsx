'use client'
/* ✅ Single input (4-digit) + Odometer countdown + axios POST (Zustand email) */
import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import 'odometer/themes/odometer-theme-default.css'
import { Edit3, RefreshCw, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useUserStore } from '@/store/userStore'

const Odometer = dynamic(() => import('react-odometerjs'), { ssr: false })

const VerifyOTP = () => {
  const router = useRouter()
  const storeEmail = useUserStore((s) => s.email)

  // ⏱️ 30s cooldown (Request OTP)
  const START_COOLDOWN = 30
  const [cooldown, setCooldown] = useState(START_COOLDOWN)
  const [isCooling, setIsCooling] = useState(true)

  // 🔢 Single OTP input (max 4 digits)
  const [otp, setOtp] = useState('')

  // ⛔ double submit guard
  const [verifying, setVerifying] = useState(false)

  // ===== OTP change (single input) =====
  const onOtpChange = (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 4) // only digits, max 4
    setOtp(v)
  }

  const isComplete = otp.length === 4

  // ===== Verify: axios POST(email from Zustand, otp string) =====
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (verifying) return
    if (!isComplete) return
    if (!storeEmail) {
      toast.error('ইমেইল পাওয়া যায়নি—আগে সাইনআপ পেজে ইমেইল সেট করুন।', { position: 'top-center' })
      return
    }

    setVerifying(true)
    const payload = { email: storeEmail, otp }

    const req = axios.post('/api/verify-otp', payload, { timeout: 15000 })

    try {
      await toast.promise(
        req,
        {
          pending: 'ভেরিফাই করা হচ্ছে...',
          success: { render: ({ data }) => data?.data?.message || 'ভেরিফাই সম্পন্ন ✅' },
          error: { render: ({ data }) => data?.response?.data?.message || 'ভেরিফাই ব্যর্থ ❌' },
        },
        { position: 'top-center' }
      )
      setTimeout(() => {
        router.push('/users/home')
      }, 1000)
    } catch {
      // toast.error already shown by toast.promise
    } finally {
      setVerifying(false)
    }
  }

  // ===== Odometer Countdown (30 → 0) =====
  useEffect(() => {
    if (!isCooling) return
    if (cooldown <= 0) {
      setIsCooling(false)
      return
    }
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown, isCooling])

  const restartCooldown = () => {
    setCooldown(START_COOLDOWN)
    setIsCooling(true)
  }

  // ✅ Request OTP: কাউন্টডাউন রিস্টার্ট + axios POST(email from Zustand)
  const handleRequestOtp = async () => {
    if (isCooling) return
    if (!storeEmail) {
      toast.error('ইমেইল পাওয়া যায়নি—আগে সাইনআপ পেজে ইমেইল সেট করুন।', { position: 'top-center' })
      return
    }

    restartCooldown()

    const req = axios.post('/api/send-otp', { email: storeEmail })
    try {
      await toast.promise(
        req,
        {
          pending: 'OTP পাঠানো হচ্ছে...',
          success: { render: ({ data }) => data?.data?.message || 'OTP পাঠানো হয়েছে ✅' },
          error: { render: ({ data }) => data?.response?.data?.message || 'পাঠানো যায়নি ❌' },
        },
        { position: 'top-center' }
      )
    } catch {
      // fail silently; user can retry after cooldown
    }
  }

  const handleEditEmail = () => router.push('/users/home')

  return (
    <div className="relative min-h-screen flex items-center justify-center px-3 text-white bg-[radial-gradient(80%_60%_at_20%_10%,#3b0764_0%,#0b1220_60%,#030712_100%)] overflow-hidden">
      {/* Toast container (beautiful) */}
      <ToastContainer
        position="top-center"
        autoClose={1500}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastStyle={{
          background: "linear-gradient(135deg, #3b0764, #1e1b4b, #0f172a)",
          color: "#f1f5f9",
          borderRadius: "12px",
          padding: "12px 16px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
          fontSize: "0.9rem",
          fontWeight: 500,
        }}
        progressStyle={{
          background: "linear-gradient(90deg, #ec4899, #8b5cf6, #06b6d4)",
          height: "3px",
          borderRadius: "10px",
        }}
      />

      {/* glow accents */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-20 -left-20 h-52 w-52 rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md p-[2px] rounded-2xl sm:rounded-3xl bg-gradient-to-br from-fuchsia-500/40 via-violet-500/40 to-sky-500/40 shadow-[0_0_40px_-10px_rgba(99,102,241,0.45)]">
        <div className="rounded-2xl sm:rounded-3xl bg-slate-950/80 backdrop-blur-xl p-4 sm:p-6 ring-1 ring-white/10">
          <h1 className="text-lg sm:text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-300 via-violet-300 to-sky-300">
            Verify OTP
          </h1>
          <p className="mt-1 text-center text-white/70 text-[11px] sm:text-sm">
            Enter the 4-digit code sent to your email
          </p>

          <form onSubmit={handleSubmit} className="mt-4 sm:mt-5 space-y-4 sm:space-y-5">
            {/* 🔢 Single OTP input */}
            <div className="flex justify-center">
              <input
                type="tel"
                inputMode="numeric"
                pattern="\d*"
                maxLength={4}
                value={otp}
                onChange={onOtpChange}
                placeholder="••••"
                className="tracking-[0.6em] text-center text-xl sm:text-2xl font-semibold w-40 sm:w-48 h-12 sm:h-14 rounded-xl bg-slate-900/70 ring-1 ring-white/10 focus:ring-2 focus:ring-fuchsia-400 outline-none transition"
                aria-label="Enter 4-digit OTP"
              />
            </div>

            {/* ===== Actions ===== */}
            {/* Mobile layout */}
            <div className="sm:hidden space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleEditEmail}
                  className="rounded-lg px-3 py-2 text-[11px] font-semibold text-white bg-white/10 hover:bg-white/15 ring-1 ring-white/10 shadow-md transition"
                >
                  <span className="inline-flex items-center justify-center gap-1">
                    <Edit3 size={14} /> Edit Email
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={isCooling}
                  className={`rounded-lg px-3 py-2 text-[11px] font-semibold text-white ring-1 ring-white/10 shadow-md transition
                    ${isCooling ? 'bg-white/10 cursor-not-allowed opacity-70' : 'bg-white/10 hover:bg-white/15'}`}
                  title={isCooling ? 'Wait for cooldown' : 'Request a new code'}
                >
                  <span className="inline-flex items-center justify-center gap-1">
                    <RefreshCw size={14} />
                    {isCooling ? (
                      <>
                        Request OTP
                        <span className="inline-flex items-center gap-0.5 ml-0.5">
                          <Odometer value={cooldown} format="d" className="odometer font-bold" />
                          <span className="text-[10px] opacity-80">s</span>
                        </span>
                      </>
                    ) : (
                      'Request OTP'
                    )}
                  </span>
                </button>
              </div>

              <button
                type="submit"
                disabled={!isComplete || verifying}
                className={`w-full rounded-lg px-3 py-2 text-[11px] font-semibold text-white ring-1 ring-white/10 shadow-md transition
                  ${isComplete && !verifying ? 'bg-white/10 hover:bg-white/15' : 'bg-white/10 cursor-not-allowed opacity-50'}`}
              >
                <span className="inline-flex items-center justify-center gap-1">
                  <CheckCircle2 size={14} /> {verifying ? 'Verifying...' : 'Verify'}
                </span>
              </button>
            </div>

            {/* Desktop/Tablet layout */}
            <div className="hidden sm:flex gap-3">
              <button
                type="button"
                onClick={handleEditEmail}
                className="flex-1 min-w-0 rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 ring-1 ring-white/10 shadow-md transition"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Edit3 size={16} /> Edit Email
                </span>
              </button>

              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={isCooling}
                className={`flex-1 min-w-0 rounded-xl px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/10 shadow-md transition
                  ${isCooling ? 'bg-white/10 cursor-not-allowed opacity-70' : 'bg-white/10 hover:bg-white/15'}`}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <RefreshCw size={16} />
                  {isCooling ? (
                    <>
                      Request OTP
                      <span className="inline-flex items-center gap-1 ml-1">
                        <Odometer value={cooldown} format="d" className="odometer font-bold" />
                        <span className="text-xs opacity-80">s</span>
                      </span>
                    </>
                  ) : (
                    'Request OTP'
                  )}
                </span>
              </button>

              <button
                type="submit"
                disabled={!isComplete || verifying}
                className={`flex-1 min-w-0 rounded-xl px-4 py-2.5 text-sm  font-semibold text-white ring-1 ring-white/10 shadow-md transition
                  ${isComplete && !verifying ? 'bg-white/10 hover:bg-white/15' : 'bg-white/10 cursor-not-allowed opacity-50'}`}
              >
                <span className="inline-flex items-center  justify-center gap-2">
                  <CheckCircle2 size={16} /> {verifying ? 'Verifying...' : 'Verify'}
                </span>
              </button>
            </div>
            {/* ===== /Actions ===== */}
          </form>
        </div>
      </div>
    </div>
  )
}

export default VerifyOTP
