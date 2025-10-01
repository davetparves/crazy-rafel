'use client'

import { useUserStore } from '@/store/userStore'
import React, { useEffect, useState } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

/** -------- UI bits -------- */
const IconButton = ({ title, onClick, children, disabled = false }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center h-9 w-9 rounded-xl ring-1 ring-white/10 transition
      ${disabled ? 'opacity-50 cursor-not-allowed bg-white/5' : 'bg-white/5 hover:bg-white/10'}`}
  >
    {children}
  </button>
)

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15.232 5.232l3.536 3.536M4 20h4l10.5-10.5a2.5 2.5 0 10-3.536-3.536L4 16v4z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 19V5" strokeLinecap="round"/>
    <path d="M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 7h16" strokeLinecap="round"/>
    <path d="M10 11v6M14 11v6" strokeLinecap="round"/>
    <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" strokeLinejoin="round"/>
    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" strokeLinejoin="round"/>
  </svg>
)

const NumberPill = ({ label, value }) => (
  <div className="flex flex-col items-center gap-1">
    <span className="text-[11px] uppercase tracking-wide text-white/60">{label}</span>
    <div className="px-3 py-2 rounded-xl bg-white/5 ring-1 ring-white/10">
      <span className="text-2xl font-extrabold leading-none select-none">
        <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(45deg,#a78bfa,#22d3ee)' }}>
          {value}
        </span>
      </span>
    </div>
  </div>
)

/** -------- Page -------- */
export default function SimpleCard() {
  // input + validate + loading
  const [value, setValue] = useState('')
  const [isValid, setIsValid] = useState(false)
  const [loading, setLoading] = useState(false)

  // top card state
  const [topNumbers, setTopNumbers] = useState(null)   // {single,double,triple} | null
  const [topId, setTopId] = useState(null)             // result _id
  const [editingId, setEditingId] = useState(null)     // if set -> PATCH on submit
  const [showInput, setShowInput] = useState(true)     // visibility control
  const [uploading, setUploading] = useState(false)    // Upload button spinner

  // store email
  const email = useUserStore((s) => s.email)

  // pattern: S-DD-TTT
  const pattern = /^\s*(\d)-(\d{2})-(\d{3})\s*$/

  const onChange = (e) => {
    const v = e.target.value
    setValue(v)
    setIsValid(pattern.test(v))
  }

  // fetch hold result for top card
  const fetchHold = async () => {
    try {
      const res = await fetch('/api/create-result', { method: 'GET' })
      const json = await res.json()
      if (json?.ok && Array.isArray(json.data) && json.data.length > 0) {
        setTopNumbers(json.data[0].numbers)
        setTopId(json.data[0]._id)
        setShowInput(false) // data found => hide input
      } else {
        setTopNumbers(null); setTopId(null)
        setShowInput(true)  // no data => show input
      }
    } catch {
      setTopNumbers(null); setTopId(null)
      setShowInput(true)
    }
  }

  useEffect(() => { fetchHold() }, [])

  /** ---- Top buttons ---- */
  // Edit: load to input + edit mode + show input
  const handleEdit = () => {
    if (!topNumbers) return
    const v = `${topNumbers.single}-${String(topNumbers.double).padStart(2,'0')}-${String(topNumbers.triple).padStart(3,'0')}`
    setValue(v)
    setIsValid(pattern.test(v))
    setEditingId(topId)
    setShowInput(true)
    toast.info('Edit mode enabled', { position: 'top-right' })
  }

  // Upload: call /api/win to process draw/win, then refresh card
  const handleUpload = async () => {
    if (!topId) return toast.error('No result to upload.', { position: 'top-right' })
    if (!email) return toast.error('Email not found.', { position: 'top-right' })
    if (uploading) return
    setUploading(true)
    try {
      const res = await fetch('/api/win', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, id: topId }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setUploading(false)
        return toast.error(json?.message || 'Upload failed', { position: 'top-right' })
      }
      toast.success('Result processed (draw).', { position: 'top-right' })
      await fetchHold() // hold result deleted -> card hides, input shows
    } catch {
      toast.error('Upload failed', { position: 'top-right' })
    } finally {
      setUploading(false)
    }
  }

  // Delete: remove current hold result
  const handleDelete = async () => {
    if (!topId) return
    if (!email) return toast.error('Email not found.', { position: 'top-right' })
    try {
      const res = await fetch('/api/create-result', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, id: topId }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) return toast.error(json?.message || 'Delete failed', { position: 'top-right' })
      toast.success('Deleted successfully', { position: 'top-right' })
      setTopNumbers(null); setTopId(null)
      setEditingId(null); setValue(''); setIsValid(false)
      setShowInput(true)
    } catch {
      toast.error('Delete failed', { position: 'top-right' })
    }
  }

  /** ---- Submit: POST (create) or PATCH (update) ---- */
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValid || loading) return
    if (!email) return toast.error('Email not found. Please set email first.', { position: 'top-right' })

    setLoading(true)
    try {
      if (editingId) {
        // update
        const res = await fetch('/api/create-result', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, id: editingId, numbers: value, status: 'hold' }),
        })
        const json = await res.json()
        if (!res.ok || !json.ok) {
          toast.error(json?.message || 'Update failed', { position: 'top-right' })
          setLoading(false); return
        }
        toast.success('Data updated successfully', { position: 'top-right' })
        // update card instantly + hide input
        setTopNumbers(json.data.numbers)
        setTopId(json.data._id)
        setEditingId(null)
        setShowInput(false)
        setLoading(false)
      } else {
        // create
        const res = await fetch('/api/create-result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, numbers: value, status: 'hold' }),
        })
        const json = await res.json()
        if (!res.ok || !json.ok) {
          toast.error(json?.message || 'Failed', { position: 'top-right' })
          setLoading(false); return
        }
        toast.success('Data upload successful', { position: 'top-right' })
        setTimeout(() => window.location.reload(), 2000)
      }
    } catch {
      toast.error('Something went wrong', { position: 'top-right' })
      setLoading(false)
    }
  }

  return (
    <main className="h-[50vh] rounded-2xl overflow-hidden bg-[#0A0E17] text-white grid place-items-center p-5">
      <div className="w-full max-w-2xl space-y-4">
        {/* Top Card — only when data exists */}
        {topNumbers && (
          <section className="rounded-2xl bg-[#0B0F19] ring-1 ring-white/10 shadow-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-sans text-yellow-400 uppercase sm:text-lg font-semibold tracking-tight">
                Result
              </h2>
              <div className="flex items-center gap-2">
                {/* Order: Edit → Upload → Delete */}
                <IconButton title="Edit" onClick={handleEdit}><EditIcon/></IconButton>
                <IconButton title={uploading ? 'Uploading...' : 'Upload'} onClick={handleUpload} disabled={uploading}>
                  {uploading ? (
                    <span className="h-4 w-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
                  ) : (
                    <UploadIcon/>
                  )}
                </IconButton>
                <IconButton title="Delete" onClick={handleDelete}><DeleteIcon/></IconButton>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 items-center gap-3">
              <NumberPill label="Single" value={String(topNumbers.single)} />
              <NumberPill label="Double" value={String(topNumbers.double)} />
              <NumberPill label="Triple" value={String(topNumbers.triple)} />
            </div>
          </section>
        )}

        {/* Input Card — visibility controlled */}
        {showInput && (
          <section className="w-full max-w-sm rounded-2xl bg-[#0B0F19] ring-1 ring-white/10 shadow-2xl">
            <form onSubmit={handleSubmit} className="p-4 sm:p-5">
              <h1 className="text-xl uppercase font-medium text-pink-500 tracking-tight">
                {editingId ? 'Edit Number' : 'Number'}
              </h1>

              <input
                id="simple-input"
                type="text"
                value={value}
                onChange={onChange}
                placeholder="5-48-957 (Single-Double-Triple)"
                className={`mt-1 w-full rounded-lg bg-black/60 px-3 py-2 text-[14px] ring-1 focus:outline-none placeholder:text-white/40
                  ${isValid ? 'ring-white/10 focus:ring-2 focus:ring-emerald-400' : 'ring-red-500/30 focus:ring-2 focus:ring-red-400'}`}
                autoComplete="off"
                spellCheck={false}
                inputMode="numeric"
                aria-invalid={!isValid}
              />

              <button
                type="submit"
                disabled={!isValid || loading}
                className={`mt-4 w-full rounded-lg px-4 py-2.5 text-[14px] font-semibold ring-1 ring-white/10 flex items-center justify-center gap-2
                  ${(!isValid || loading) ? 'bg-white/10 cursor-not-allowed opacity-60' : 'bg-indigo-600 hover:bg-indigo-500 cursor-pointer'}`}
              >
                {loading && <span className="h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />}
                {loading ? (editingId ? 'Updating...' : 'Processing...') : (editingId ? 'Update Number' : 'Upload Number')}
              </button>
            </form>
          </section>
        )}
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
    </main>
  )
}
