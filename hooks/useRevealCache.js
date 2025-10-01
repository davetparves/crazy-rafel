// /hooks/useRevealCache.js
import { useMyNumberStore, MY_NUMBER_TTL_MS } from '@/store/myNumberStore'

/**
 * Reveal cache helper:
 * - padNumber: single/double/triple অনুযায়ী জিরো-প্যাডিং
 * - getCached: valid হলে স্টোর থেকে রিটার্ন করে
 * - cacheNow: স্টোরে সেভ (ডিফল্ট 2h TTL)
 */
export function useRevealCache() {
  const getNumber = useMyNumberStore((s) => s.getNumber)
  const setNumber = useMyNumberStore((s) => s.setNumber)
  const clearExpired = useMyNumberStore((s) => s.clearExpired)

  const padNumber = (key, num) => {
    const n = String(num ?? '')
    if (key === 'single') return n.padStart(1, '0')
    if (key === 'double') return n.padStart(2, '0')
    return n.padStart(3, '0') // triple
  }

  const getCached = (key) => {
    clearExpired()
    const v = getNumber(key)
    return v ? String(v) : null
  }

  const cacheNow = (key, value, ttlMs = MY_NUMBER_TTL_MS) => {
    const padded = padNumber(key, value)
    setNumber(key, padded, ttlMs)
    return padded
  }
  console.log(1,getCached, cacheNow, padNumber)


  return { getCached, cacheNow, padNumber }
}
