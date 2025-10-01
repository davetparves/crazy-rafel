// ✅ বাংলা কমেন্ট: Zustand স্টোর + persist middleware
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useUserStore = create(
  persist(
    (set) => ({
      // ✅ কেবল এই ইমেইলটাই পারসিস্ট করবো
      email: null,

      // ✅ ইমেইল সেট
      setEmail: (email) => set({ email }),

      // ✅ ক্লিয়ার (লগআউট ইত্যাদিতে দরকার হলে)
      clear: () => set({ email: null }),
    }),
    {
      name: 'user-store',            // ✅ localStorage key
      version: 1,                    // ✅ মাইগ্রেশন লাগলে ভার্সন বাড়াবে
      storage: createJSONStorage(() => localStorage), // ✅ লোকালস্টোরেজে সেভ
      partialize: (state) => ({ email: state.email }), // ✅ শুধু email স্টোর করো
    }
  )
)
