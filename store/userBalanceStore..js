// /store/userBalanceStore.js
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const TTL_SECONDS_DEFAULT = 20

export const useUserBalanceStore = create()(
  persist(
    (set, get) => ({
      user: null,
      expiresAt: null,
      loading: false,

      setFromServer: (u, ttlSec = TTL_SECONDS_DEFAULT) => {
        const expiresAt = Date.now() + ttlSec * 1000
        set({ user: u, expiresAt })
      },

      clear: () => set({ user: null, expiresAt: null }),

      isFresh: () => {
        const { expiresAt, user } = get()
        if (!user || !expiresAt) return false
        const fresh = Date.now() < expiresAt
        if (!fresh) set({ user: null, expiresAt: null })
        return fresh
      },
    }),
    {
      name: 'topbar-balance-store',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        user: s.user,
        expiresAt: s.expiresAt,
      }),
    }
  )
)
