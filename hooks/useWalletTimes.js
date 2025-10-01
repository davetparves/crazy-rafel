import { useEffect, useMemo, useRef, useState } from 'react'
import { useUserStore } from '@/store/userStore'
import { postWallet } from '@/utils/api'

export default function useWalletTimes() {
  const email = useUserStore((s) => s.email)

  const [balance, setBalance] = useState(null)
  const [currency, setCurrency] = useState('BDT')        // ⬅️ NEW
  const [loading, setLoading] = useState(false)
  const [resultTimes, setResultTimes] = useState({ single: null, double: null, triple: null })
  const lastEmailRef = useRef(null)

  useEffect(() => {
    if (!email) {
      setBalance(null)
      setCurrency('BDT')                                  // reset currency
      setResultTimes({ single: null, double: null, triple: null })
      lastEmailRef.current = null
      return
    }
    if (lastEmailRef.current === email && balance !== null) return

    const ctrl = new AbortController()
    let mounted = true

    ;(async () => {
      try {
        setLoading(true)
        const { data } = await postWallet(email, ctrl.signal)
        if (!mounted) return

        const nextVal = Number(data?.data?.walletBalance ?? 0)
        setBalance((prev) => (prev === nextVal ? prev : nextVal))
        setCurrency(String(data?.data?.currency || 'BDT')) // ⬅️ NEW
        lastEmailRef.current = email

        const resMap = data?.data?.results || {}
        const nextTimes = {
          single: resMap?.single?.time || '--',
          double: resMap?.double?.time || '--',
          triple: resMap?.triple?.time || '--',
        }
        setResultTimes((prev) =>
          prev.single === nextTimes.single &&
          prev.double === nextTimes.double &&
          prev.triple === nextTimes.triple
            ? prev
            : nextTimes,
        )
      } catch {
        // silent
      } finally {
        mounted && setLoading(false)
      }
    })()

    return () => {
      mounted = false
      ctrl.abort()
    }
  }, [email])

  const balanceText = useMemo(
    () => (loading ? 'Loading…' : `${balance !== null ? balance : '--'} Coins`),
    [loading, balance],
  )

  // ⬅️ currency-সহ রিটার্ন
  return { email, balance, setBalance, currency, loading, balanceText, resultTimes }
}
