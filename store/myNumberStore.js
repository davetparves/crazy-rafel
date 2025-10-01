'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const MY_NUMBER_TTL_MS = 2 * 60 * 60 * 1000 // 2h

export const useMyNumberStore = create(
  persist(
    (set, get) => ({
      data: { single: null, double: null, triple: null }, // { value, exp }

      setNumber(name, value, ttlMs = MY_NUMBER_TTL_MS) {
        const exp = Date.now() + Math.max(10_000, ttlMs)
        console.log('[store] setNumber:', name, value, 'exp=', new Date(exp).toISOString())
        set((s) => ({ data: { ...s.data, [name]: { value: String(value), exp } } }))
      },

      getNumber(name) {
        const entry = get().data?.[name]
        if (!entry) {
          console.log('[store] getNumber MISS:', name)
          return null
        }
        if (Date.now() > entry.exp) {
          console.log('[store] getNumber EXPIRED:', name)
          set((s) => ({ data: { ...s.data, [name]: null } }))
          return null
        }
        console.log('[store] getNumber HIT:', name, entry.value)
        return entry.value
      },

      clear(name) {
        console.log('[store] clear:', name)
        set((s) => ({ data: { ...s.data, [name]: null } }))
      },

      clearExpired() {
        const now = Date.now()
        console.log('[store] clearExpired at', new Date(now).toISOString())
        set((s) => {
          const next = { ...s.data }
          for (const k of ['single', 'double', 'triple']) {
            if (next[k] && next[k].exp <= now) {
              console.log(' - expired key cleared:', k)
              next[k] = null
            }
          }
          return { data: next }
        })
      },
    }),
    {
      name: 'my-number-store',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
)

// helper: pad by key
export function padByKey(key, num) {
  const n = String(num ?? '')
  if (key === 'single') return n.padStart(1, '0')
  if (key === 'double') return n.padStart(2, '0')
  return n.padStart(3, '0')
}
