import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuthStore } from '@/store/authStore'
import type { User } from '@/shared/types/foodstore'

interface ProtectedRouteProps {
  allowedRoles?: User['role'][]
  children?: ReactNode
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const user = useAuthStore((state) => state.user)
  const loading = useAuthStore((state) => state.loading)
  const location = useLocation()

  if (loading) return <main className="grid min-h-[50vh] place-items-center text-sm font-semibold text-forest">Verificando sesión…</main>
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />
  return children ?? <Outlet />
}
