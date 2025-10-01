'use client'
import React, { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useUserStore } from '../store/userStore'
import { ToastContainer, toast, Slide } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function getLinkByTitle(agent, wanted) {
  const arr = agent?.link || []
  const lower = String(wanted || '').toLowerCase()
  const found = arr.find((x) => String(x?.title || '').toLowerCase() === lower)
  return found?.link || ''
}

export default function Diposit() {
  const email = useUserStore((s) => s.email)
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const likedSet = useMemo(() => new Set(), []) // visual only

  // 🔁 লোডে এজেন্ট ফেচ
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch('/api/agents', { cache: 'no-store' })
        const data = await res.json()
        if (alive && data?.ok) setAgents(data.agents || [])
      } catch {
        toast.error('Failed to load agents')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const toggleLike = async (agentId) => {
    if (!email) {
      toast.info('Please sign in to like.')
      return
    }
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, userEmail: email }),
      })
      const data = await res.json()
      if (!data?.ok) return
      const { likeCount, liked } = data
      setAgents((prev) => prev.map((a) => (a._id === agentId ? { ...a, likeCount } : a)))
      if (liked) likedSet.add(agentId)
      else likedSet.delete(agentId)
    } catch {
      toast.error('Failed to toggle like')
    }
  }

  const handleOpenLink = (agent, platform) => {
    const url = getLinkByTitle(agent, platform) // 'whatsapp' | 'telegram'
    if (!url) {
      toast.warn(
        platform === 'whatsapp'
          ? 'This agent has no WhatsApp link.'
          : 'This agent has no Telegram link.',
      )
      return
    }
    try {
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      toast.error('Could not open the link')
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8 text-white relative overflow-hidden bg-[radial-gradient(80%_60%_at_20%_10%,#15142a_0%,#101734_60%,#0a1022_100%)]">
      {/* Toasts */}
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
        transition={Slide}
        limit={3}
        style={{ zIndex: 9999, top: 12, right: 12 }}
        toastClassName={() =>
          'relative flex items-center gap-2 p-3 min-h-10 rounded-xl bg-slate-900/90 text-white backdrop-blur-xl ring-1 ring-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)]'
        }
        bodyClassName={() => 'text-sm font-medium'}
        progressStyle={{
          height: '3px',
          background: 'linear-gradient(90deg, rgba(167,139,250,1) 0%, rgba(56,189,248,1) 100%)',
        }}
        closeButton={({ closeToast }) => (
          <button
            onClick={closeToast}
            className="ml-2 rounded-lg bg-white/10 hover:bg-white/20 p-1 leading-none ring-1 ring-white/10"
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>
        )}
      />

      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-violet-400/15 blur-3xl" />
        <div className="absolute -bottom-28 -right-24 h-80 w-80 rounded-full bg-sky-400/15 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold">
            <span className="bg-gradient-to-r from-violet-300 via-indigo-200 to-sky-300 bg-clip-text text-transparent">
              💬 Support Agents
            </span>
          </h1>
          <p className="mt-2 text-sm text-white/70">Reach us on WhatsApp or Telegram</p>
        </div>

        {/* Agents grid */}
        {loading ? (
          <div className="text-center text-white/60">Loading…</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {agents.map((agent) => {
              const waUrl = getLinkByTitle(agent, 'whatsapp')
              const tgUrl = getLinkByTitle(agent, 'telegram')
              const hasWa = !!waUrl
              const hasTg = !!tgUrl

              return (
                <motion.div
                  key={agent._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="relative rounded-2xl ring-1 ring-white/10 bg-white/5 p-4 backdrop-blur hover:ring-white/20 transition"
                >
                  {/* ❤️ Like button */}
                  <button
                    onClick={() => toggleLike(agent._id)}
                    className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold bg-gradient-to-r from-violet-500 to-sky-500 text-white ring-white/20"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className={`h-4 w-4 ${
                        likedSet.has(agent._id) ? 'fill-white' : 'fill-white/70'
                      }`}
                    >
                      <path d="M12 21s-6.7-4.47-9.2-7.22C1.1 12 1 9.7 2.4 8.14 3.83 6.59 6.14 6.45 7.9 7.74 8.9 6.97 10.17 6.5 12 6.5c1.83 0 3.11.47 4.1 1.24 1.76-1.29 4.07-1.15 5.49.41 1.4 1.56 1.28 3.87-.41 5.64C18.7 16.53 12 21 12 21z" />
                    </svg>
                    <span>{agent.likeCount ?? 0}</span>
                  </button>

                  {/* Agent info */}
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-sky-500/20 ring-1 ring-white/10 text-xl">
                        👨‍💼
                      </div>
                      <span
                        className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full ring-2 ring-[#0a1022] ${
                          agent.isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                        }`}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold truncate">{agent.fullName}</h3>
                      </div>
                      <p className="mt-1 text-sm text-white/75 line-clamp-2">
                        Expert support & fast response.
                      </p>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleOpenLink(agent, 'whatsapp')}
                      disabled={!hasWa}
                      className={`h-10 rounded-xl text-sm font-semibold transition ${
                        hasWa
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500'
                          : 'bg-white/10 text-white/50 ring-1 ring-white/15 cursor-not-allowed'
                      }`}
                      title={hasWa ? 'Open WhatsApp' : 'No WhatsApp link'}
                    >
                      WhatsApp
                    </button>
                    <button
                      onClick={() => handleOpenLink(agent, 'telegram')}
                      disabled={!hasTg}
                      className={`h-10 rounded-xl text-sm font-semibold transition ${
                        hasTg
                          ? 'ring-1 ring-sky-400/40 bg-gradient-to-r from-sky-500/20 to-sky-400/10 hover:brightness-110'
                          : 'bg-white/10 text-white/50 ring-1 ring-white/15 cursor-not-allowed'
                      }`}
                      title={hasTg ? 'Open Telegram' : 'No Telegram link'}
                    >
                      Telegram
                    </button>
                  </div>

                  {/* Tiny preview (optional) */}
                  {(hasWa || hasTg) && (
                    <div className="mt-3 space-y-1 text-[11px] text-white/60 break-all">
                      {hasWa && <div>WA: {waUrl}</div>}
                      {hasTg && <div>TG: {tgUrl}</div>}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}

        {!loading && agents.length === 0 && (
          <div className="mt-10 text-center text-white/70">No agents available.</div>
        )}
      </div>
    </div>
  )
}
