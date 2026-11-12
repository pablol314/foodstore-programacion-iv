import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { storeApi } from '@/shared/api/foodstore'
import type { User } from '@/shared/types/foodstore'

interface RegistrationData {
  username: string
  full_name: string
  email: string
  password: string
}

interface AuthState {
  user: User | null
  loading: boolean
  setUser: (user: User) => void
  clearUser: () => void
  login: (username: string, password: string) => Promise<User>
  register: (data: RegistrationData) => Promise<User>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(persist(
  (set) => ({
    user: null,
    loading: true,
    setUser: (user) => set({ user }),
    clearUser: () => set({ user: null, loading: false }),
    login: async (username, password) => {
      await storeApi.login(username, password)
      const user = await storeApi.me()
      set({ user, loading: false })
      return user
    },
    register: async (data) => {
      await storeApi.register(data)
      await storeApi.login(data.username, data.password)
      const user = await storeApi.me()
      set({ user, loading: false })
      return user
    },
    logout: async () => {
      try {
        await storeApi.logout()
      } finally {
        set({ user: null, loading: false })
      }
    },
    checkSession: async () => {
      set({ loading: true })
      try {
        set({ user: await storeApi.me(), loading: false })
      } catch {
        set({ user: null, loading: false })
      }
    },
  }),
  {
    name: 'foodstore-auth',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({ user: state.user }),
  },
))
