// /components/agent/tabs/LinksTab.jsx
'use client'

import { useMemo, useState } from 'react'
import { toast, ToastContainer, Slide } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useUserStore } from '../../../store/userStore'

const PLATFORMS = [
  {
    id: 'whatsapp',
    title: 'WhatsApp',
    type: 'bd_phone', // BD 11-digit, starts with 0
    tint: 'from-emerald-500/20 to-emerald-400/10',
    ring: 'ring-emerald-400/40',
    badge: 'bg-emerald-400',
    placeholder: '01XXXXXXXXX (১১-সংখ্যা, 0 দিয়ে শুরু)',
    logo: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
        <path d="M20.52 3.48A11.94 11.94 0 0012 0C5.37 0 0 5.37 0 12c0 2.1.54 4.06 1.5 5.77L0 24l6.4-1.66A12 12 0 0012 24c6.63 0 12-5.37 12-12 0-3.2-1.3-6.1-3.48-8.52zM12 21.6c-1.98 0-3.84-.6-5.37-1.62l-.38-.25-3.79.98 1.02-3.68-.24-.39A9.57 9.57 0 012.4 12C2.4 6.7 6.7 2.4 12 2.4s9.6 4.3 9.6 9.6-4.3 9.6-9.6 9.6zm5.28-6.83c-.29-.15-1.72-.85-1.99-.95-.27-.1-.47-.15-.67.15-.2.29-.77.95-.95 1.15-.18.2-.35.22-.64.07-.29-.15-1.2-.44-2.29-1.41-.84-.75-1.41-1.68-1.58-1.97-.16-.29-.02-.45.13-.6.13-.13.29-.35.44-.53.15-.18.2-.29.29-.49.1-.2.05-.37-.02-.53-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.58-.01c-.2 0-.53.08-.81.37-.28.29-1.07 1.05-1.07 2.56s1.09 2.97 1.24 3.18c.15.2 2.13 3.25 5.16 4.55.72.31 1.28.5 1.72.64.72.23 1.37.2 1.89.12.58-.09 1.72-.7 1.96-1.38.24-.67.24-1.25.17-1.38-.07-.13-.26-.2-.55-.35z" />
      </svg>
    ),
  },
  {
    id: 'telegram',
    title: 'Telegram',
    type: 'tg_username', // @username only
    tint: 'from-sky-500/20 to-sky-400/10',
    ring: 'ring-sky-400/40',
    badge: 'bg-sky-400',
    placeholder: '@username',
    logo: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
        <path d="M9.04 15.19l-.39 5.5c.56 0 .8-.24 1.08-.53l2.6-2.5 5.39 3.95c.99.54 1.69.26 1.96-.91l3.55-16.66c.35-1.63-.59-2.27-1.65-1.88L1.04 9.36C-.55 9.98-.53 10.9.76 11.3l5.77 1.8L18.9 5.7c.54-.35 1.03-.16.63.22L9.04 15.19z" />
      </svg>
    ),
  },
]

// ---------- Validators & builders ----------
function isValidBD11(num) {
  // exactly 11 digits and starts with '0'
  return /^0\d{10}$/.test(num)
}
function buildWaLinkFromBD(num) {
  // num like 01XXXXXXXXX -> 8801XXXXXXXXX
  const intl = `+880${num.slice(1)}`
  return `https://wa.me/${intl}`
}
function normalizeDigits(s) {
  return String(s || '')
    .replace(/\D/g, '')
    .slice(0, 11)
}
function normalizeTgHandle(s) {
  let v = String(s || '').trim()
  if (!v) return ''
  if (!v.startsWith('@')) v = '@' + v
  return v.replace(/^@+/, '@') // single @
}
function isValidTgHandle(s) {
  // Telegram username: 5–32 chars, letters/digits/_ (no '@' in regex part)
  const m = String(s || '')
  const u = m.startsWith('@') ? m.slice(1) : m
  return /^[A-Za-z0-9_]{5,32}$/.test(u)
}
function buildTgLink(handle) {
  const u = handle.startsWith('@') ? handle.slice(1) : handle
  return `https://t.me/${u}`
}

export default function LinksTab() {
  const email = useUserStore((s) => s.email)
  const [selected, setSelected] = useState(null)
  const [waNumber, setWaNumber] = useState('') // only digits
  const [tgUser, setTgUser] = useState('') // with @
  const [submitting, setSubmitting] = useState(false)

  const platform = useMemo(() => PLATFORMS.find((p) => p.id === selected) || null, [selected])

  const isValid = useMemo(() => {
    if (!email || !platform) return false
    if (platform.type === 'bd_phone') return isValidBD11(waNumber)
    if (platform.type === 'tg_username') return isValidTgHandle(tgUser)
    return false
  }, [email, platform, waNumber, tgUser])

  const onSave = async () => {
    if (!email) return toast.warn('সাইন-ইন করা নেই (email required)')
    if (!platform) return toast.warn('WhatsApp অথবা Telegram সিলেক্ট করুন')

    let link = ''
    if (platform.type === 'bd_phone') {
      if (!isValidBD11(waNumber)) return toast.warn('১১-সংখ্যার BD নম্বর দিন (01… ফরম্যাট)')
      link = buildWaLinkFromBD(waNumber)
    } else {
      if (!isValidTgHandle(tgUser)) return toast.warn('ভ্যালিড Telegram @username দিন (5–32 chars)')
      link = buildTgLink(tgUser)
    }

    try {
      setSubmitting(true)
      const res = await fetch('/api/agents/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, title: platform.id, link }),
      })
      const json = await res.json()
      if (!json?.success) return toast.error(json?.message || 'Failed to save link')
      toast.success(json?.message || 'Link saved ✅')
      setWaNumber('')
      setTgUser('')
    } catch {
      toast.error('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <ToastContainer
        position="top-right"
        autoClose={1200}
        theme="dark"
        transition={Slide}
        limit={2}
        style={{ zIndex: 9999, top: 12, right: 12 }}
        toastClassName={() =>
          'relative flex items-center gap-2 p-3 min-h-10 rounded-xl bg-slate-900/90 text-white backdrop-blur-xl ring-1 ring-white/10'
        }
        bodyClassName={() => 'text-sm font-medium'}
        progressStyle={{ height: '2px' }}
      />

      <h2 className="text-lg md:text-xl font-bold">🔗 Social Links</h2>
      <p className="text-white/70 text-sm">
        WhatsApp: <strong>১১-সংখ্যা</strong> BD নম্বর (0 দিয়ে শুরু) দিন — আমি নিজে{' '}
        <code>https://wa.me/880…</code> লিংক বানাবো। Telegram: শুধু <code>@username</code> দিন।
      </p>

      {/* Select cards */}
      <div className="grid grid-cols-2 gap-3">
        {PLATFORMS.map((p) => {
          const active = selected === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p.id)}
              className={`group relative rounded-2xl p-4 text-left transition
                bg-gradient-to-br ${p.tint} ring-1 ${p.ring}
                hover:brightness-110 hover:-translate-y-0.5
                ${active ? 'outline-2 outline-offset-2 outline-white/60' : ''}`}
              aria-pressed={active}
              title={`Select ${p.title}`}
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
                  {p.logo}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{p.title}</span>
                    <span className={`h-2 w-2 rounded-full ${p.badge}`} />
                  </div>
                  <p className="text-xs text-white/60 truncate">
                    {active ? 'Selected' : 'Click to select'}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Dynamic input */}
      <div className="space-y-2">
        <label className="text-xs text-white/70">
          {!platform
            ? 'একটা প্ল্যাটফর্ম সিলেক্ট করুন'
            : platform.type === 'bd_phone'
            ? 'WhatsApp Number (BD)'
            : 'Telegram @username'}
        </label>

        {platform?.type === 'bd_phone' ? (
          <input
            className="w-full p-3 rounded-xl bg-slate-900/70 ring-1 ring-white/10 text-sm"
            placeholder={platform.placeholder}
            value={waNumber}
            onChange={(e) => setWaNumber(normalizeDigits(e.target.value))}
            inputMode="numeric"
            maxLength={11}
            disabled={!platform || submitting}
          />
        ) : (
          <input
            className="w-full p-3 rounded-xl bg-slate-900/70 ring-1 ring-white/10 text-sm"
            placeholder={platform?.placeholder || '@username'}
            value={tgUser}
            onChange={(e) => setTgUser(normalizeTgHandle(e.target.value))}
            disabled={!platform || submitting}
          />
        )}

        {/* Live Preview */}
        <div className="text-xs text-white/60">
          {platform?.type === 'bd_phone' && isValidBD11(waNumber) && (
            <span>Preview: {buildWaLinkFromBD(waNumber)}</span>
          )}
          {platform?.type === 'tg_username' && isValidTgHandle(tgUser) && (
            <span>Preview: {buildTgLink(tgUser)}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onSave}
          disabled={!isValid || submitting}
          className={`px-5 py-2 rounded-xl text-sm font-semibold transition
            ${
              !isValid || submitting
                ? 'bg-white/10 text-white/60 cursor-not-allowed'
                : 'bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 hover:opacity-90'
            }`}
        >
          {submitting ? 'Saving…' : 'Save'}
        </button>
        {!!selected && (
          <button
            onClick={() => {
              setWaNumber('')
              setTgUser('')
            }}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-xs bg-white/10 hover:bg-white/15 ring-1 ring-white/10"
          >
            Clear
          </button>
        )}
      </div>

      <div className="text-xs text-white/60">
        <span className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1 ring-1 ring-white/10">
          <span className={`h-2 w-2 rounded-full ${email ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span className="truncate max-w-[260px]">
            {email ? `Agent: ${email}` : 'Sign in to save links'}
          </span>
        </span>
      </div>
    </div>
  )
}
