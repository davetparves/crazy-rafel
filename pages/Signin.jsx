'use client'
import React, { useEffect, useState } from 'react'
import { Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useUserStore } from '@/store/userStore'

export default function Signin() {
  const router = useRouter()
  const setEmail = useUserStore((s) => s.setEmail)

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [valid, setValid] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = () => {
    let newErrors = {}

    if (!form.email.trim()) newErrors.email = 'Email is required'
    else if (!/^[\w.%+-]+@gmail\.com$/i.test(form.email))
      newErrors.email = 'Only Gmail addresses allowed'

    if (!form.password) newErrors.password = 'Password is required'
    else if (form.password.length < 6) newErrors.password = 'At least 6 characters'
    else if (form.password.length > 18) newErrors.password = 'Maximum 18 characters'

    setErrors(newErrors)
    setValid(Object.keys(newErrors).length === 0)
  }

  useEffect(() => {
    validate()
  }, [form])

  const handleSubmit = async (e) => {
    e.preventDefault()
    validate()
    if (!valid || isSubmitting) return

    setIsSubmitting(true)

    const payload = {
      email: form.email.trim().toLowerCase(),
      password: form.password,
    }

    const req = axios.post('/api/sign-in', payload, { timeout: 15000 })

    try {
      const { data } = await toast.promise(
        req,
        {
          pending: 'Signing in...',
          success: { render: ({ data }) => data?.data?.message || 'Signed in successfully ✅' },
          error: { render: ({ data }) => data?.response?.data?.message || 'Signin failed ❌' },
        },
        { position: 'top-center' },
      )

      if (data?.success) {
        setEmail(payload.email)
        const to = data?.redirectTo || '/users/home'
        setTimeout(() => {
          router.replace(to)
        }, 2000)
      }
    } catch {
      // toast already handled
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const handleBlur = (e) => setTouched({ ...touched, [e.target.name]: true })

  const renderFeedback = (field) => {
    if (!touched[field]) return null
    if (errors[field]) {
      return (
        <div className="flex items-center gap-1 text-rose-400 text-[11px] mt-1">
          <XCircle size={12} /> {errors[field]}
        </div>
      )
    } else {
      return (
        <div className="flex items-center gap-1 text-emerald-400 text-[11px] mt-1">
          <CheckCircle2 size={12} /> Looks good
        </div>
      )
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-3 text-white bg-[radial-gradient(80%_60%_at_20%_10%,#3b0764_0%,#0b1220_60%,#030712_100%)] overflow-hidden">
      <ToastContainer position="top-center" />

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-20 -left-20 h-52 w-52 rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm sm:max-w-md p-[2px] rounded-2xl sm:rounded-3xl bg-gradient-to-br from-fuchsia-500/40 via-violet-500/40 to-sky-500/40 shadow-[0_0_40px_-10px_rgba(99,102,241,0.45)]">
        <div className="rounded-2xl sm:rounded-3xl bg-slate-950/80 backdrop-blur-xl p-4 sm:p-6 ring-1 ring-white/10">
          <h1 className="text-xl sm:text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-300 via-violet-300 to-sky-300">
            Sign In
          </h1>
          <p className="mt-1 text-center text-white/60 text-xs sm:text-sm">
            Welcome back! Please log in
          </p>

          <form onSubmit={handleSubmit} className="mt-3 space-y-3 text-xs sm:text-sm">
            {/* Email */}
            <div>
              <label className="block text-[11px] text-white/70 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="you@gmail.com"
                disabled={isSubmitting}
                className={`w-full rounded-lg bg-slate-900/70 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm ring-1 focus:outline-none focus:ring-2 transition
                  ${
                    touched.email && errors.email
                      ? 'ring-rose-500 focus:ring-rose-400'
                      : touched.email && !errors.email
                      ? 'ring-emerald-500 focus:ring-emerald-400'
                      : 'ring-white/10'
                  } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              />
              {renderFeedback('email')}
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] text-white/70 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="••••••"
                  disabled={isSubmitting}
                  className={`w-full rounded-lg bg-slate-900/70 px-2 sm:px-3 py-1.5 sm:py-2 pr-7 sm:pr-8 text-xs sm:text-sm ring-1 focus:outline-none focus:ring-2 transition
                    ${
                      touched.password && errors.password
                        ? 'ring-rose-500 focus:ring-rose-400'
                        : touched.password && !errors.password
                        ? 'ring-emerald-500 focus:ring-emerald-400'
                        : 'ring-white/10'
                    } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white disabled:opacity-40"
                >
                  {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              </div>
              {renderFeedback('password')}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!valid || isSubmitting}
              className={`w-full mt-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold text-white ring-1 ring-white/10 shadow-md transition
                ${
                  valid && !isSubmitting
                    ? 'bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 hover:opacity-90'
                    : 'bg-slate-800 cursor-not-allowed opacity-60'
                }`}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Signup link */}
            <p className="mt-4 text-center text-xs sm:text-sm text-white/70">
              Don’t have an account?{' '}
              <Link
                href="/users/sign-up"
                className="font-semibold bg-gradient-to-r from-fuchsia-400 via-violet-300 to-sky-400 bg-clip-text text-transparent hover:opacity-80"
              >
                Sign up here
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
