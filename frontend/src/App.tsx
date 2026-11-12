import { useEffect } from 'react'

import { AppRouter } from '@/routes/AppRouter'
import { useAuthStore } from '@/store/authStore'

export default function App() {
  const checkSession = useAuthStore((state) => state.checkSession)
  const clearUser = useAuthStore((state) => state.clearUser)
  const loading = useAuthStore((state) => state.loading)

  useEffect(() => {
    let active = true
    const refresh = () => { if (active) void checkSession() }
    const expired = () => clearUser()
    window.addEventListener('foodstore:session-expired', expired)
    refresh()
    return () => { active = false; window.removeEventListener('foodstore:session-expired', expired) }
  }, [checkSession, clearUser])

  if (loading) return <main className="grid min-h-screen place-items-center text-sm font-semibold text-forest">Cargando FoodStore…</main>
  return <AppRouter />
}
