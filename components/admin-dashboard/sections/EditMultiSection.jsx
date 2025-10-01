'use client'

import React, { useCallback, useMemo, useState } from 'react'
import useSWR from 'swr'
import axios from 'axios'
import { ToastContainer, toast, Slide } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

/* 🔄 SWR fetcher */
const fetcher = (url) => axios.get(url).then((r) => r.data)

/* 🔤 লেবেল ম্যাপ */
const LABELS = { single: 'Single', double: 'Double', triple: 'Triple' }

/* ✏️ ইনপুট স্যানিটাইজ (ডেসিমাল অনুমোদিত) */
const cleanNumber = (s) => s.replace(/[^\d.]/g, '').replace(/^(\d*\.?\d*).*/, '$1')

/* 🧰 Normalizer: যেকোনো payload → docs[] */
function normalizeDocs(payload) {
  const raw = payload
  if (!raw) return []
  if (Array.isArray(raw)) return raw.filter(Boolean)

  const keys = ['single', 'double', 'triple']
  const isMapLike =
    typeof raw === 'object' &&
    raw !== null &&
    keys.some((k) => Object.prototype.hasOwnProperty.call(raw, k))

  if (isMapLike) {
    const out = []
    for (const k of keys) {
      if (raw[k] == null) continue
      if (typeof raw[k] === 'number') {
        out.push({ name: k, value: raw[k] })
      } else if (typeof raw[k] === 'object' && raw[k] !== null) {
        out.push({ name: k, ...raw[k] })
      }
    }
    return out
  }

  if (typeof raw === 'object' && raw !== null) {
    if (raw.name && raw.value != null) return [raw]
  }
  return []
}

export default function EditMultiSection() {
  /* লোকাল ইনপুট */
  const [values, setValues] = useState({ single: '', double: '', triple: '' })
  const [touched, setTouched] = useState({ single: false, double: false, triple: false })
  const [pending, setPending] = useState({ single: false, double: false, triple: false })

  /* GET: /api/multipliers/userget */
  const { data, error, isLoading, mutate } = useSWR('/api/multipliers/userget', fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })

  /* 🔧 সব রেসপন্স শেপকে docs[] এ কনভার্ট */
  const docs = useMemo(() => normalizeDocs(data?.data), [data])

  /* নামভিত্তিক দ্রুত লুকআপ */
  const byName = useMemo(() => {
    const map = { single: null, double: null, triple: null }
    docs.forEach((d) => {
      if (d?.name && ['single', 'double', 'triple'].includes(d.name)) {
        map[d.name] = d
      }
    })
    return map
  }, [docs])

  /* ভ্যালিডেশন */
  const valid = {
    single: values.single !== '' && Number.isFinite(Number(values.single)),
    double: values.double !== '' && Number.isFinite(Number(values.double)),
    triple: values.triple !== '' && Number.isFinite(Number(values.triple)),
  }

  /* সাবমিট (PATCH → update/upsert) */
  const submitOne = async (name) => {
    const label = LABELS[name]
    const raw = values[name]
    const value = Number(raw)

    if (!raw || !Number.isFinite(value)) {
      toast.warning(`${label}: সঠিক সংখ্যা দিন।`)
      setTouched((t) => ({ ...t, [name]: true }))
      return
    }

    try {
      setPending((p) => ({ ...p, [name]: true }))
      const res = await axios.patch('/api/multipliers/update', { name, value })

      if (res?.data?.success) {
        toast.success(`${label} আপডেট হয়েছে ✅`)
        setValues((p) => ({ ...p, [name]: '' }))
        mutate() // রিফ্রেশ
      } else {
        toast.error(res?.data?.message || 'সেভ হয়নি')
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || 'সার্ভারে সমস্যা')
    } finally {
      setPending((p) => ({ ...p, [name]: false }))
    }
  }

  const handleRefresh = useCallback(() => mutate(), [mutate])

  /* একেকটা কার্ড */
  const Card = ({ name, accent }) => {
    const label = LABELS[name]
    const current = byName[name]?.value
    const isPending = pending[name]
    const isTouched = touched[name]
    const isValid = valid[name]

    const onKeyDown = (e) => {
      if (e.key === 'Enter') submitOne(name)
    }

    return (
      <div className="rounded-2xl overflow-hidden ring-1 ring-white/10 bg-[#0B0F19]">
        {/* Header */}
        <div className={`px-4 py-3 text-center text-white/90 text-sm font-semibold border-b border-white/10 ${accent}`}>
          {label} Multiplier
        </div>

        {/* Display row */}
        <div className="px-5 pt-4">
          <div className="rounded-xl bg-black/50 ring-1 ring-white/10 p-3 text-center">
            <span className="text-xs text-white/60 mr-2">Current</span>
            <span className="text-2xl font-extrabold tabular-nums">
              {current != null ? `${current}x` : '—'}
            </span>
          </div>
        </div>

        {/* Input + Submit */}
        <div className="p-5 space-y-3">
          <input
            type="text"
            inputMode="decimal"
            placeholder={`${label} multiplier e.g. 9`}
            value={values[name]}
            onChange={(e) =>
              setValues((p) => ({
                ...p,
                [name]: cleanNumber(e.target.value),
              }))
            }
            onBlur={() => setTouched((t) => ({ ...t, [name]: true }))}
            onKeyDown={onKeyDown}
            disabled={isPending}
            className={`w-full rounded-xl bg-slate-900/70 px-3 py-3 text-white ring-1 outline-none placeholder:text-white/40
              ${isTouched && !isValid ? 'ring-rose-500/40 focus:ring-rose-400' : 'ring-white/10 focus:ring-2 focus:ring-indigo-400'}`}
            autoComplete="off"
            spellCheck={false}
          />
          {isTouched && !isValid && (
            <p className="text-xs text-rose-300">সঠিক সংখ্যা দিন</p>
          )}

          <button
            onClick={() => submitOne(name)}
            disabled={isPending}
            className={`w-full rounded-xl px-4 py-2.5 font-bold text-white transition
              ${isPending ? 'bg-white/10 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-[0_10px_30px_-8px_rgba(79,70,229,0.55)] ring-1 ring-white/10'}`}
          >
            {isPending ? 'Saving…' : `Submit ${label}`}
          </button>

          <div className="inline-flex items-center justify-center rounded-lg px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 bg-emerald-500/15 text-emerald-300 ring-emerald-500/30 w-full">
            {current != null ? 'Updating will overwrite the current value' : 'Will create if missing (upsert)'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <section className="space-y-5 text-white">
      {/* Toast */}
      <ToastContainer
        position="top-right"
        autoClose={1200}
        newestOnTop
        transition={Slide}
        theme="dark"
        hideProgressBar={false}
        closeOnClick
        draggable
        pauseOnFocusLoss={false}
        pauseOnHover={false}
        style={{ zIndex: 9999, top: 12, right: 12 }}
        toastClassName={() =>
          'relative flex p-3 min-h-10 rounded-xl bg-slate-900/90 text-white backdrop-blur-xl ring-1 ring-white/10 shadow-lg'
        }
        bodyClassName={() => 'text-sm font-medium'}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">✏️ Edit Multi</h2>

        <button
          type="button"
          onClick={handleRefresh}
          className="rounded-lg bg-white/5 hover:bg-white/10 px-3 py-2 ring-1 ring-white/10 text-sm"
          aria-label="Refresh"
        >
          Refresh
        </button>
      </div>

      {/* লোডিং/এরর */}
      {isLoading && (
        <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-44 rounded-xl bg-slate-800/50 animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {!!error && !isLoading && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-center text-sm text-rose-200">
          ডেটা লোড করা যায়নি।
        </div>
      )}

      {/* ৩টা কার্ড */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card name="single" accent="bg-gradient-to-r from-fuchsia-500/20 to-fuchsia-700/20" />
          <Card name="double" accent="bg-gradient-to-r from-violet-500/20 to-violet-700/20" />
          <Card name="triple" accent="bg-gradient-to-r from-sky-500/20 to-sky-700/20" />
        </div>
      )}
    </section>
  )
}
