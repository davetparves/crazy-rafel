'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SignOutButton() {
  const [signingOut, setSigningOut] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    try {
      await fetch('/api/sign-out', { method: 'POST' })
      // localStorage.removeItem('role-store') // optional cleanup
    } catch (_) {
      // ignore
    } finally {
      router.replace('/users/sign-in')
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={signingOut}
      className={`w-full h-10 rounded-sm font-semibold text-sm md:text-base transition-all shadow-lg ${
        signingOut
          ? 'bg-rose-500/40 text-white/80 cursor-not-allowed'
          : 'bg-gradient-to-r from-rose-500 to-red-500 text-white font-bold hover:opacity-90'
      }`}
      title="Sign Out"
      aria-busy={signingOut}
    >
      {signingOut ? 'Signing out...' : 'Sign Out'}
    </button>
  )
}
