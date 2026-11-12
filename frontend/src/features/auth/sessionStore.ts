import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { User } from '@/shared/types/foodstore'

interface SessionState {
  user: User | null
  setUser: (user: User) => void
  clearUser: () => void
}

export const useSessionStore = create<SessionState>()(persist(
  (set) => ({ user: null, setUser: (user) => set({ user }), clearUser: () => set({ user: null }) }),
  { name: 'foodstore-session', storage: createJSONStorage(() => localStorage), partialize: (state) => ({ user: state.user }) },
))
