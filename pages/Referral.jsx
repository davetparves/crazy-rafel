'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { useUserStore } from '@/store/userStore'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { motion, AnimatePresence } from 'framer-motion'
export default function Referral() {
  // ✅ Zustand থেকে ইমেইল
  const email = useUserStore((s) => s.email)

  // 🔄 লোকাল স্টেট
  const [code, setCode] = useState('')
  const [referrals, setReferrals] = useState([]) // [{id,name,email,joined}]
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('') // search

  // কপি ইনপুট ref (mobile-friendly copy)
  const inputRef = useRef(null)

  // কোড/লিঙ্ক যা কপি করবে
  const referralLink = useMemo(() => (code ? `${code}` : ''), [code])

  // 📥 API কল: পেজ ওপেন/ইমেইল বদলালে
  useEffect(() => {
    if (!email) {
      setCode('')
      setReferrals([])
      setTotal(0)
      return
    }
    const ctrl = new AbortController()
    ;(async () => {
      try {
        setLoading(true)
        setErr('')
        const { data } = await axios.post('/api/users/referrals', { email }, { signal: ctrl.signal })
        if (data?.success) {
          setCode(data?.data?.referralCode || '')
          const list = Array.isArray(data?.data?.referrals) ? data.data.referrals : []
          setReferrals(list)
          setTotal(Number(data?.data?.total || list.length || 0))
        } else {
          setErr(data?.message || 'ডাটা লোড করা যায়নি')
        }
      } catch (e) {
        if (!axios.isCancel(e)) setErr('ডাটা লোড করা যায়নি')
      } finally {
        setLoading(false)
      }
    })()
    return () => ctrl.abort()
  }, [email])

  // 🔎 ফিল্টারড লিস্ট (নাম/ইমেইল)
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return referrals
    return referrals.filter((r) => {
      const name = String(r?.name || '').toLowerCase()
      const mail = String(r?.email || '').toLowerCase()
      return name.includes(s) || mail.includes(s)
    })
  }, [q, referrals])

  // 📋 mobile-safe copy util
  const copyToClipboard = async () => {
    const text = referralLink
    if (!text) return

    // 1) modern API
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied ✅')
      return
    } catch {
      // proceed to fallback
    }

    // 2) fallback: select & execCommand (iOS/older)
    try {
      const input = inputRef.current
      if (input) {
        // iOS selection trick
        input.removeAttribute('readonly')
        input.select()
        input.setSelectionRange(0, 99999)
        const ok = document.execCommand('copy')
        input.setAttribute('readonly', true)
        window.getSelection()?.removeAllRanges()
        if (ok) {
          toast.success('Copied ✅')
          return
        }
      }

      // 3) hidden textarea last resort
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      const ok2 = document.execCommand('copy')
      document.body.removeChild(ta)
      if (ok2) {
        toast.success('Copied ✅')
        return
      }
    } catch {
      // ignore
    }

    toast.error('Copy failed ❌')
  }

  // 🗓 date fmt
  const fmt = (d) => {
    if (!d) return '--'
    try {
      return new Date(d).toLocaleDateString()
    } catch {
      return '--'
    }
  }

  // 🧩 ছোট util — নামের অক্ষর থেকে অ্যাভাটার
  const initials = (name = '') => {
    const parts = String(name).trim().split(/\s+/).slice(0, 2)
    return parts.map((p) => p[0]?.toUpperCase() || '').join('') || 'U'
  }

  return (
    <div className="relative min-h-screen overflow-hidden p-4 md:p-8 text-white">
      <ToastContainer
  position="top-right"
  theme="dark"
  autoClose={2000}
  hideProgressBar={false}
  newestOnTop={true}
  closeOnClick={true}
  rtl={false}

  pauseOnFocusLoss={true}
  draggable={true}
  pauseOnHover={true}
  limit={5}
  toastClassName="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-purple-500/20 rounded-2xl"
  bodyClassName="text-white font-medium px-2 py-1"
  progressClassName="bg-gradient-to-r from-purple-500 to-cyan-500"
  closeButton={({ closeToast }) => (
    <motion.button
      whileHover={{ scale: 1.1, rotate: 90 }}
      whileTap={{ scale: 0.9 }}
      onClick={closeToast}
      className="text-white/60 hover:text-white transition-all duration-200 p-1 rounded-lg hover:bg-white/10"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </motion.button>
  )}
  style={{
    zIndex: 99999,
  }}
/>

      {/* BG glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-28 -left-28 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_10%,#3b0764_0%,#0b1220_60%,#030712_100%)]" />
      </div>

      {/* Header */}
      <div className="text-center mb-8 md:mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-3 bg-gradient-to-r from-fuchsia-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
          🤝 Referral Program
        </h1>
        <div className="flex justify-center gap-4 items-center">
          <div className="h-px w-16 bg-white/20" />
          <span className="text-sm text-white/70">Earn coins for every friend you refer</span>
          <div className="h-px w-16 bg-white/20" />
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center shadow-lg md:col-span-3">
            <h3 className="text-sm text-white/70 mb-1">Total Referrals</h3>
            <p className="text-2xl font-bold text-fuchsia-300">{loading ? 'Loading…' : total}</p>
          </div>
        </div>

        {/* Referral Code (mobile copy-proof) */}
        <div className="mx-auto max-w-2xl">
          <h2 className="text-xl font-bold mb-4 text-center">Your Referral Code</h2>

          <div className="p-[2px] rounded-3xl bg-gradient-to-r from-fuchsia-500/40 via-violet-500/40 to-sky-500/40 shadow-[0_0_50px_-20px_rgba(99,102,241,0.6)]">
            <div className="rounded-3xl bg-slate-950/70 backdrop-blur-xl ring-1 ring-white/10 p-6 flex flex-col gap-4">
              <div className="relative">
                <input
                  ref={inputRef}
                  readOnly
                  type="text"
                  value={loading ? 'Loading…' : referralLink || '--'}
                  className="w-full text-center font-mono tracking-[0.35em] text-lg md:text-xl rounded-2xl bg-slate-900/70 border border-white/10 text-white/90 px-4 py-4 pr-24 select-all"
                  aria-label="Referral code"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    disabled={!referralLink || loading}
                    className="rounded-xl px-3 py-2 text-sm font-semibold text-white bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 ring-1 ring-white/10 shadow hover:opacity-90 disabled:opacity-60"
                  >
                    Copy
                  </button>
                  {/* ছোট্ট ‘Share’ বাটন (mobile friendly) */}
                  {typeof navigator !== 'undefined' && navigator.share && (
                    <button
                      onClick={() =>
                        navigator
                          .share({ title: 'My referral code', text: `Use my code: ${referralLink}` })
                          .catch(() => {})
                      }
                      className="rounded-xl px-3 py-2 text-sm font-semibold text-white bg-white/10 ring-1 ring-white/10 hover:bg-white/15"
                    >
                      Share
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-white/60 text-center">
                Tip: Tap the code to select, then tap <b>Copy</b>. Mobile-safe copy is enabled.
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar: Search + count */}
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search referrals by name or email…"
              className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-sm ring-1 ring-white/10 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
            />
          </div>
          <div className="text-sm text-white/70">
            Showing <span className="font-semibold text-white">{filtered.length}</span> of{' '}
            <span className="font-semibold text-white">{total}</span>
          </div>
        </div>

        {/* Referral list: desktop table + mobile cards */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl p-6">
          <h2 className="text-xl font-bold mb-4">👥 Your Referrals</h2>

          {err && (
            <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-200 text-sm">
              {err}
            </div>
          )}

          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/70">
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={3} className="p-4 text-white/60">
                      Loading…
                    </td>
                  </tr>
                )}

                {!loading &&
                  filtered.map((ref) => (
                    <tr key={ref.id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-8 w-8 place-items-center rounded-full bg-fuchsia-500/15 text-fuchsia-200 ring-1 ring-fuchsia-500/25">
                            {initials(ref.name)}
                          </div>
                          <span className="font-medium">{ref.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-white/80">{ref.email}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-[11px] ring-1 ring-white/10">
                          {fmt(ref.joined)}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="md:hidden grid grid-cols-1 gap-3">
            {loading && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/60">Loading…</div>
            )}

            {!loading &&
              filtered.map((ref) => (
                <div
                  key={ref.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-fuchsia-500/15 text-fuchsia-200 ring-1 ring-fuchsia-500/25">
                      {initials(ref.name)}
                    </div>
                    <div>
                      <div className="font-semibold leading-tight">{ref.name}</div>
                      <div className="text-[11px] text-white/60">{ref.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-white/60">Joined</div>
                    <div className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[11px] ring-1 ring-white/10">
                      {fmt(ref.joined)}
                    </div>
                  </div>
                </div>
              ))}

            {!loading && !err && filtered.length === 0 && (
              <div className="text-center py-8 text-white/60">No referrals found.</div>
            )}
          </div>

          {!loading && !err && filtered.length > 0 && (
            <div className="mt-4 text-center text-xs text-white/50">
              End of list — {filtered.length} shown
            </div>
          )}
        </div>

        {/* How it works (same) */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl p-6">
          <h2 className="text-xl font-bold mb-6">✨ How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '📋', title: 'Copy Your Code', desc: 'Copy your unique referral code' },
              { icon: '📤', title: 'Share With Friends', desc: 'Share your code via any platform' },
              { icon: '💰', title: 'Earn Coins', desc: 'Get bonus when they sign up and play' },
            ].map((step, i) => (
              <div
                key={i}
                className="bg-white/5 p-5 rounded-xl border border-white/10 shadow hover:bg-white/10 transition"
              >
                <span className="text-3xl block mb-3">{step.icon}</span>
                <h3 className="font-bold mb-1">{step.title}</h3>
                <p className="text-sm text-white/70">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
