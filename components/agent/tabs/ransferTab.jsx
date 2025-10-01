// /components/agent/tabs/ransferTab.jsx
'use client'

import { useState } from 'react'
import { ToastContainer, toast, Slide } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useUserStore } from '../../../store/userStore'

export default function TransferTab() {
  const agentEmail = useUserStore((s) => s.email)
  const [userEmail, setUserEmail] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    const amt = Number(amount)

    if (!agentEmail) return toast.error('এজেন্ট হিসেবে সাইন-ইন করা নেই')
    if (!userEmail) return toast.warn('User email দিন')
    if (!Number.isFinite(amt) || amt <= 0) return toast.warn('পজিটিভ Amount দিন')

    try {
      setLoading(true)

      const req = fetch('/api/agents/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentEmail, userEmail, amount: amt }),
      }).then((r) => r.json())

      const res = await toast.promise(
        req,
        {
          pending: 'Processing…',
          success: {
            render({ data }) {
              return data?.message || 'Deposit successful ✅'
            },
          },
          error: {
            render({ data }) {
              return data?.message || 'Failed to transfer'
            },
          },
        },
        { position: 'top-right', autoClose: 1500 },
      )

      if (res?.success) {
        setUserEmail('')
        setAmount('')
      }
    } catch (e) {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Toasts (place once in this page) */}
      <ToastContainer
        position="top-right"
        autoClose={1500}
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

      <h2 className="text-lg md:text-xl font-bold">🪙 Coin Transfer</h2>

      <div className="flex flex-col md:flex-row gap-4">
        <input
          className="flex-1 p-3 rounded-xl bg-slate-900/70 ring-1 ring-white/10 text-sm"
          placeholder="User Email"
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          disabled={loading}
        />
        <input
          className="w-full md:w-48 p-3 rounded-xl bg-slate-900/70 ring-1 ring-white/10 text-sm"
          placeholder="Amount"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className={`bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition shadow-md ${
            loading ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90'
          }`}
        >
          {loading ? 'Sending…' : '🚀 Send'}
        </button>
      </div>

      <div className="text-xs text-white/60">
        <span className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1 ring-1 ring-white/10">
          <span
            className={`h-2 w-2 rounded-full ${agentEmail ? 'bg-emerald-400' : 'bg-amber-400'}`}
          />
          <span className="truncate max-w-[260px]">
            {agentEmail ? `Agent: ${agentEmail}` : 'Sign in as Agent to transfer'}
          </span>
        </span>
      </div>
    </div>
  )
}
