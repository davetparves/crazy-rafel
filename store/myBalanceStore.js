// /store/myBalanceStore.js
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const TTL_MS = 20 * 1000

export const useMyBalanceStore = create()(
  persist(
    (set, get) => ({
      user: null,          // { name, role, currency, wallet:{main,bonus,referral} }
      expiresAt: null,     // timestamp in ms
      loading: false,

      setFromServer: (user) => {
        const expiresAt = Date.now() + TTL_MS
        set({ user, expiresAt })
      },

      clear: () => set({ user: null, expiresAt: null }),

      isFresh: () => {
        const { user, expiresAt } = get()
        if (!user || !expiresAt) return false
        const ok = Date.now() < expiresAt
        if (!ok) set({ user: null, expiresAt: null })
        return ok
      },
    }),
    {
      name: 'my-balance-store',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user, expiresAt: s.expiresAt }),
    }
  )
)
