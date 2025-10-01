'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useUserStore } from '@/store/userStore'

/* Reusable MiniCard */
function MiniCard({ icon, label, value, color, full = false }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 h-full ${
        full ? 'col-span-2 md:col-span-3' : ''
      }`}
    >
      <span className={color}>{icon}</span>
      <div>
        <p className="text-xs text-white/50">{label}</p>
        <p className="text-[10px] font-semibold">{value}</p>
      </div>
    </motion.div>
  )
}

/* Profile Card */
function UserProfileCard({ user, onEdit }) {
  return (
    <div className="relative rounded-3xl overflow-hidden shadow-[0_0_30px_-6px_rgba(139,92,246,0.5)] border border-white/10">
      {/* Top Banner */}
      <div className="relative h-28 bg-gradient-to-r from-fuchsia-500/30 via-violet-500/30 to-sky-500/30">
        <button
          onClick={onEdit}
          className="absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold ring-1 ring-white/15 bg-white/10 hover:bg-white/15"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.03 0-1.42L18.37 3.29a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.83z" />
          </svg>
          Edit Profile
        </button>
      </div>

      {/* Content */}
      <div className="p-6 pt-0 -mt-12 flex flex-col md:flex-row items-center gap-6">
        {/* Avatar */}
        <div className="h-24 w-24 rounded-full bg-white/10 ring-2 ring-white/20 backdrop-blur-xl overflow-hidden flex items-center justify-center text-4xl shadow-lg">
          {user?.profileImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.profileImage} alt="profile" className="h-24 w-24 object-cover rounded-full" />
          ) : (
            '👤'
          )}
        </div>

        {/* Info */}
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-xl font-bold bg-gradient-to-r from-fuchsia-400 via-violet-300 to-sky-300 bg-clip-text text-transparent">
            {user?.fullName || '--'}
          </h3>
          <p className="text-sm text-white/70">{user?.email || '--'}</p>
          <p className="text-xs text-white/50 mt-1">Referral: {user?.referralCode || '--'}</p>

          {/* Chips */}
          <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
            <span className="px-3 py-1 text-xs rounded-full bg-amber-500/10 text-amber-300 border border-amber-400/20">
              VIP {user?.vipLevel ?? 0}
            </span>
            <span className="px-3 py-1 text-xs rounded-full bg-violet-500/10 text-violet-300 border border-violet-400/20">
              {user?.role || '--'}
            </span>
            <span
              className={`px-3 py-1 text-xs rounded-full border ${
                user?.isOnline ? 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20' : 'bg-rose-500/10 text-rose-300 border-rose-400/20'
              }`}
            >
              {user?.isOnline ? '🟢 Online' : '🔴 Offline'}
            </span>
          </div>

          {/* Bio (read) */}
          <p className="mt-3 text-xs text-white/70 whitespace-pre-line">{user?.bio || ''}</p>
        </div>
      </div>
    </div>
  )
}

/* Edit Modal */
function EditProfileModal({ open, initial, onClose, onSaved }) {
  const [fullName, setFullName] = useState(initial?.fullName || '')
  const [phoneNumber, setPhoneNumber] = useState(initial?.phoneNumber || '')
  const [gender, setGender] = useState(initial?.gender || 'male')
  const [bio, setBio] = useState(initial?.bio || '')
  const [submitting, setSubmitting] = useState(false)
  const email = useUserStore((s) => s.email)

  useEffect(() => {
    if (!open) return
    setFullName(initial?.fullName || '')
    setPhoneNumber(initial?.phoneNumber || '')
    setGender(initial?.gender || 'male')
    setBio(initial?.bio || '')
  }, [open, initial])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return toast.error('No email found in store.')
    if (!fullName?.trim()) return toast.warn('Full name is required')

    setSubmitting(true)
    try {
      const { data } = await axios.patch('/api/users/update-profile', {
        email,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber?.trim() || null,
        gender,
        bio: bio ?? '',
      })
      if (data?.success) {
        toast.success('Update successful')
        onSaved(data.data)
        onClose()
      } else {
        toast.error(data?.message || 'Failed to update')
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Server error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="absolute inset-0 flex items-center justify-center p-3"
            initial={{ scale: 0.96, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0, y: -6 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          >
            <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-slate-900 ring-1 ring-white/10 p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold">Edit Profile</h3>
                <button type="button" onClick={onClose} className="rounded-md px-2 py-1 bg-white/10 hover:bg-white/15 ring-1 ring-white/10 text-xs">✕</button>
              </div>

              <label className="block text-xs text-white/70">
                Full Name
                <input
                  className="mt-1 w-full rounded-lg bg-white/5 px-3 py-2 text-sm ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                />
              </label>

              <label className="block text-xs text-white/70">
                Phone Number
                <input
                  className="mt-1 w-full rounded-lg bg-white/5 px-3 py-2 text-sm ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="01XXXXXXXXX"
                />
              </label>

              <label className="block text-xs text-white/70">
                Gender
                <select
                  className="mt-1 w-full rounded-lg bg-white/5 px-3 py-2 text-sm ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label className="block text-xs text-white/70">
                Bio
                <textarea
                  className="mt-1 w-full rounded-lg bg-white/5 px-3 py-2 text-sm ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-violet-400 min-h-[90px]"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write something about you…"
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full rounded-lg px-3 py-2 text-sm font-bold text-white transition ${
                  submitting ? 'bg-white/10 cursor-not-allowed' : 'bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 hover:opacity-90'
                }`}
              >
                {submitting ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export default function Profile() {
  const email = useUserStore((s) => s.email) // ✅ Zustand
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  // লোডে/ইমেইল বদলালে সার্ভার থেকে প্রোফাইল ফেচ
  useEffect(() => {
    if (!email) {
      setUser(null)
      return
    }
    const ctrl = new AbortController()
    ;(async () => {
      try {
        setLoading(true)
        const { data } = await axios.post('/api/users/profile', { email }, { signal: ctrl.signal })
        
        if (data?.success) setUser(data.data)
        else setUser(null)
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    })()
    return () => ctrl.abort()
  }, [email])

  // স্কেলেটন টেক্সট
  const S = useMemo(() => (t) => (loading ? 'Loading…' : t ?? '--'), [loading])

  return (
    <div className="relative min-h-screen overflow-hidden text-white bg-[radial-gradient(80%_60%_at_20%_10%,#3b0764_0%,#0b1220_60%,#030712_100%)]">
      <ToastContainer position="top-center" autoClose={1500} hideProgressBar={false} newestOnTop />

      {/* Ambient Glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-28 -left-28 h-80 w-80 rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-28 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl p-4 md:p-8 space-y-6">
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <UserProfileCard user={user} onEdit={() => setEditOpen(true)} />
        </motion.div>

        {/* Wallet & Stats */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <MiniCard icon="💰" label="Wallet Balance" value={`${S(user?.walletBalance)} BDT`} color="text-emerald-300" />
          <MiniCard icon="🎲" label="Total Bets" value={S(user?.totalBets)} color="text-violet-300" />
          <MiniCard icon="🏆" label="Wins (Total Amount)" value={`${S(user?.totalWinAmount)} BDT`} color="text-emerald-400" />
          <MiniCard icon="❌" label="Losses (Total Amount)" value={`${S(user?.totalLossAmount)} BDT`} color="text-rose-400" />
        </div>

        {/* Achievements */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
          <MiniCard icon="🔥" label="Biggest Win" value={`${S(user?.biggestWin)} BDT`} color="text-amber-300" />
          <MiniCard icon="💔" label="Biggest Loss" value={`${S(user?.biggestLoss)} BDT`} color="text-rose-400" />
          <MiniCard icon="⭐" label="Loyalty Points" value={S(user?.loyaltyPoints)} color="text-sky-300" full />
        </div>

        {/* Badges */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-[0_0_25px_-6px_rgba(236,72,153,0.4)]">
          <h3 className="text-lg font-bold mb-3 bg-gradient-to-r from-fuchsia-400 via-violet-300 to-sky-400 bg-clip-text text-transparent">
            🏅 Badges
          </h3>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            {(user?.badges || []).map((b, i) => (
              <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-fuchsia-300">🎖️</span>
                <p className="text-[10px] font-semibold">{b}</p>
              </div>
            ))}
            {!loading && (!user?.badges || user.badges.length === 0) && (
              <div className="text-xs text-white/60">No badges yet.</div>
            )}
          </div>
        </div>

        {/* Account Info */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-[0_0_25px_-6px_rgba(168,85,247,0.4)]">
          <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-fuchsia-400 via-violet-300 to-sky-400 bg-clip-text text-transparent">
            👤 Account Information
          </h3>

          <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
            <MiniCard icon="🆔" label="Username" value={S(user?.username)} color="text-fuchsia-300" />
            <MiniCard icon="📞" label="Phone" value={S(user?.phoneNumber)} color="text-emerald-300" />
            <MiniCard icon="⚧️" label="Gender" value={S(user?.gender)} color="text-pink-300" />
            <MiniCard icon="🎖️" label="Role" value={S(user?.role)} color="text-violet-300" />
            <MiniCard icon="⭐" label="VIP Level" value={`VIP ${S(user?.vipLevel)}`} color="text-amber-300" />
            <MiniCard icon={user?.isOnline ? '🟢' : '🔴'} label="Status" value={user?.isOnline ? 'Online' : 'Offline'} color={user?.isOnline ? 'text-emerald-400' : 'text-rose-400'} />
            <MiniCard icon="✉️" label="Email" value={S(user?.email)} color="text-sky-300" full />
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EditProfileModal open={editOpen} initial={user} onClose={() => setEditOpen(false)} onSaved={(u) => setUser(u)} />
    </div>
  )
}
