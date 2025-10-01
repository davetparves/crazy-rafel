'use client'

import { useEffect, useState } from 'react'
import MethodBadge from '../MethodBadge'
import { useUserStore } from '@/store/userStore'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default function WithdrawTab() {
  const agentEmail = useUserStore((s) => s.email)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  // -------- helpers ----------
  const toastFromResponse = (res, json, fallbackOk = 'Success', fallbackErr = 'Request failed') => {
    const msg = json?.message || (res?.ok ? fallbackOk : `${fallbackErr} (${res?.status || 0})`)
    if (res?.ok && json?.success) toast.success(msg)
    else toast.error(msg)
  }

  const safeJson = async (res) => {
    try {
      const j = await res.json()
      return j || {}
    } catch {
      return {}
    }
  }

  // -------- load list (agent email → POST /api/withdraw/agent) ----------
  const load = async () => {
    if (!agentEmail) return
    setLoading(true)
    try {
      const res = await fetch('/api/withdraw/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: agentEmail }),
      })
      const json = await safeJson(res)

      if (res.ok && json?.success) {
        setItems(Array.isArray(json.data) ? json.data : [])
        // Backend message থাকলে দেখাব (না থাকলে চুপ)
        if (json?.message) toast.success(json.message)
      } else {
        toastFromResponse(res, json, undefined, 'Failed to load withdraws')
      }
    } catch {
      toast.error('Network error while loading')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentEmail])

  const fmtDate = (d) => (d ? new Date(d).toLocaleString(undefined, { hour12: false }) : '—')

  // -------- approve / reject actions ----------
  const onAction = async (id, action) => {
    if (action === 'approve') {
      try {
        const res = await fetch('/api/withdraw/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agentEmail, withdrawId: id }),
        })
        const json = await safeJson(res)

        if (res.ok && json?.success) {
          setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status: 'approved' } : x)))
        }
        // সবসময় ব্যাকএন্ডের মেসেজ—success/failed দুই ক্ষেত্রেই
        toastFromResponse(res, json, 'Approved', 'Approve failed')
      } catch {
        toast.error('Network error on approve')
      }
      return
    }

    if (action === 'reject') {
      try {
        const res = await fetch(`/api/withdraw/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reject' }),
        })
        const json = await safeJson(res)

        if (res.ok && json?.success) {
          setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status: 'rejected' } : x)))
        }
        // সবসময় ব্যাকএন্ডের মেসেজ—success/failed দুই ক্ষেত্রেই
        toastFromResponse(res, json, 'Rejected & refunded', 'Reject failed')
      } catch {
        toast.error('Network error on reject')
      }
      return
    }
  }

  return (
    <div className="space-y-4">
      {/* (Optional) Local ToastContainer — যদি গ্লোবালি না থাকে */}
      <ToastContainer
        position="top-right"
        autoClose={1500}
        theme="dark"
        newestOnTop
        closeOnClick
        draggable
        pauseOnHover={false}
        style={{ zIndex: 9999 }}
        toastClassName={() =>
          'relative flex p-3 min-h-10 rounded-xl bg-slate-900/90 text-white backdrop-blur-xl ring-1 ring-white/10 shadow-lg'
        }
        bodyClassName={() => 'text-sm font-medium'}
      />

      <div className="flex items-center justify-between">
        <h2 className="text-lg md:text-xl font-bold">💸 Withdraw Requests</h2>
        <button
          onClick={load}
          className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 ring-1 ring-white/15"
        >
          Refresh
        </button>
      </div>

      {!agentEmail && (
        <div className="rounded-xl bg-amber-500/10 ring-1 ring-amber-500/30 p-3 text-sm text-amber-200">
          Agent email not set in store.
        </div>
      )}

      {loading && (
        <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-4 text-sm text-white/70">
          Loading…
        </div>
      )}

      {!loading && items.length === 0 && agentEmail && (
        <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-4 text-sm text-white/70">
          No withdraw requests for <span className="font-semibold">{agentEmail}</span>.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((r) => (
          <div key={r.id} className="rounded-2xl bg-slate-900/70 ring-1 ring-white/10 p-5">
            <div className="flex justify-between items-center">
              <p className="text-sm">{r.email}</p>
              <MethodBadge method={r.method} />
            </div>

            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-white/70">📞 {r.phone}</p>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full ring-1 ${
                  r.status === 'approved'
                    ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/30'
                    : r.status === 'rejected'
                    ? 'bg-rose-500/10 text-rose-300 ring-rose-400/30'
                    : 'bg-amber-500/10 text-amber-300 ring-amber-400/30'
                }`}
              >
                {r.status}
              </span>
            </div>

            <p className="mt-2 text-2xl font-bold text-sky-300">{r.amount} tk</p>
            <p className="text-xs text-white/50">At {fmtDate(r.requestedAt)}</p>

            <div className="flex gap-2 mt-3">
              <button
                disabled={r.status !== 'pending'}
                onClick={() => onAction(r.id, 'approve')}
                className={`flex-1 rounded-lg font-bold py-2 text-sm ${
                  r.status !== 'pending'
                    ? 'bg-white/10 text-white/60 cursor-not-allowed'
                    : 'bg-emerald-400/90 text-black'
                }`}
              >
                ✅ Accept
              </button>
              <button
                disabled={r.status !== 'pending'}
                onClick={() => onAction(r.id, 'reject')}
                className={`flex-1 rounded-lg font-bold py-2 text-sm ${
                  r.status !== 'pending'
                    ? 'bg-white/10 text-white/60 cursor-not-allowed'
                    : 'bg-rose-400/90 text-black'
                }`}
              >
                ❌ Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
