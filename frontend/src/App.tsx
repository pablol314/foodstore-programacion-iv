import { useEffect, useState } from 'react'

import { AppRouter } from '@/routes/AppRouter'
import { storeApi } from '@/shared/api/foodstore'
import { useSessionStore } from '@/features/auth/store'

export default function App() {
  const setUser = useSessionStore((state) => state.setUser)
  const clearUser = useSessionStore((state) => state.clearUser)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    const refresh = () => {
      void storeApi.me().then((user) => { if (active) setUser(user) }).catch(() => { if (active) clearUser() }).finally(() => { if (active) setReady(true) })
    }
    const expired = () => { clearUser(); setReady(true) }
    window.addEventListener('foodstore:session-expired', expired)
    refresh()
    return () => { active = false; window.removeEventListener('foodstore:session-expired', expired) }
  }, [setUser, clearUser])

  if (!ready) return <main className="grid min-h-screen place-items-center text-sm font-semibold text-forest">Cargando FoodStore…</main>
  return <AppRouter />
}
