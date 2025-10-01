// /hooks/useHistoryData.js
'use client'
import { useEffect, useState } from 'react'
import { useUserStore } from '@/store/userStore' // <-- পাথটা তোমার প্রোজেক্ট অনুযায়ী অ্যাডজাস্ট করো

export default function useHistoryData() {
  const { email } = useUserStore()
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState([]) // ResultList[]
  const [bets, setBets] = useState([]) // UserNumberList[]
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!email) {
        setLoading(false)
        setError('Please sign in.')
        return
      }
      try {
        const res = await fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
          cache: 'no-store',
        })
        const json = await res.json()
        if (!alive) return
        if (json?.success) {
          setResults(Array.isArray(json.data?.results) ? json.data.results : [])
          setBets(Array.isArray(json.data?.bets) ? json.data.bets : [])
          setError(null)
        } else {
          setError(json?.message || 'Failed to load history.')
        }
      } catch {
        if (alive) setError('Network error')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [email])

  return { email, loading, results, bets, error }
}
