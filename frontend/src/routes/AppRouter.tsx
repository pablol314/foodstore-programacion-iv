import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, NavLink, Outlet, Route, Routes, useNavigate } from 'react-router-dom'

import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { Toast } from '@/shared/components/Toast'
import { ProtectedRoute } from '@/routes/ProtectedRoute'

const CatalogPage = lazy(() => import('@/features/productos').then((module) => ({ default: module.CatalogPage })))
const CartPage = lazy(() => import('@/features/cart').then((module) => ({ default: module.CartPage })))
const CheckoutPage = lazy(() => import('@/features/cart/pages/CheckoutPage').then((module) => ({ default: module.CheckoutPage })))
const OrdersPage = lazy(() => import('@/features/pedidos').then((module) => ({ default: module.OrdersPage })))
const LoginPage = lazy(() => import('@/features/auth').then((module) => ({ default: module.LoginPage })))
const RegisterPage = lazy(() => import('@/features/auth').then((module) => ({ default: module.RegisterPage })))
const AdminSummaryPage = lazy(() => import('@/features/pedidos').then((module) => ({ default: module.AdminSummaryPage })))
const AdminProductsPage = lazy(() => import('@/features/productos').then((module) => ({ default: module.AdminProductsPage })))
const AdminCategoriesPage = lazy(() => import('@/features/categorias').then((module) => ({ default: module.AdminCategoriesPage })))
const AdminOrdersPage = lazy(() => import('@/features/pedidos').then((module) => ({ default: module.AdminOrdersPage })))
const AdminUsersPage = lazy(() => import('@/features/usuarios').then((module) => ({ default: module.AdminUsersPage })))

function LinkItem({ to, children }: { to: string; children: ReactNode }) {
  return <NavLink to={to} end className={({ isActive }) => `rounded-full px-3 py-2 text-xs font-bold transition ${isActive ? 'bg-moss text-forest' : 'text-ink/65 hover:bg-paper hover:text-forest'}`}>{children}</NavLink>
}

function Layout() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const count = useCartStore((state) => state.items.reduce((sum, line) => sum + line.quantity, 0))
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await logout()
    } finally {
      navigate('/', { replace: true })
    }
  }

  return <div className="min-h-screen bg-paper text-ink"><header className="sticky top-0 z-30 border-b border-ink/10 bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8"><NavLink to="/" className="flex items-center gap-2"><span className="grid size-10 place-items-center rounded-2xl bg-forest text-xl text-white">F</span><span><strong className="block text-sm tracking-tight">FoodStore</strong><span className="block text-[9px] uppercase tracking-[0.18em] text-ink/45">Mercado online</span></span></NavLink>
    <nav className="flex flex-wrap items-center gap-1" aria-label="Navegación principal"><LinkItem to="/">Catálogo</LinkItem><LinkItem to="/carrito">Carrito{count > 0 ? ` · ${count}` : ''}</LinkItem>{user && <LinkItem to="/mis-pedidos">Mis pedidos</LinkItem>}{user?.role === 'admin' && <LinkItem to="/admin/resumen">Admin</LinkItem>}{!user && <><LinkItem to="/login">Ingresar</LinkItem><LinkItem to="/register">Crear cuenta</LinkItem></>}{user && <button onClick={() => void handleLogout()} className="ml-1 rounded-full border border-ink/10 px-3 py-2 text-xs font-bold text-ink/60 hover:bg-paper">Salir</button>}</nav>
  </div>{user?.role === 'admin' && <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-5 pb-2 sm:px-8" aria-label="Administración"><LinkItem to="/admin/categorias">Categorías</LinkItem><LinkItem to="/admin/productos">Productos</LinkItem><LinkItem to="/admin/pedidos">Pedidos</LinkItem><LinkItem to="/admin/usuarios">Usuarios</LinkItem></nav>}</header><Outlet /><Toast /></div>
}

function UnauthorizedPage() {
  return <main className="mx-auto max-w-xl px-5 py-20 text-center"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest">Acceso restringido</p><h1 className="mt-2 text-3xl font-semibold">No tenés permiso para esta sección</h1><p className="mt-3 text-sm text-ink/55">Tu cuenta no tiene el rol requerido para abrir esta página.</p><NavLink className="mt-6 inline-flex rounded-full bg-forest px-5 py-3 text-xs font-bold text-white" to="/">Volver al catálogo</NavLink></main>
}

export function AppRouter() {
  return <Suspense fallback={<main className="grid min-h-[60vh] place-items-center text-sm font-semibold text-forest">Cargando la página…</main>}><Routes><Route element={<Layout />}>
    <Route path="/" element={<CatalogPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/carrito" element={<CartPage />} />
    <Route element={<ProtectedRoute />}><Route path="/checkout" element={<CheckoutPage />} /><Route path="/mis-pedidos" element={<OrdersPage />} /></Route>
    <Route element={<ProtectedRoute allowedRoles={['admin']} />}><Route path="/admin" element={<Navigate to="/admin/resumen" replace />} /><Route path="/admin/resumen" element={<AdminSummaryPage />} /><Route path="/admin/categorias" element={<AdminCategoriesPage />} /><Route path="/admin/productos" element={<AdminProductsPage />} /><Route path="/admin/pedidos" element={<AdminOrdersPage />} /><Route path="/admin/usuarios" element={<AdminUsersPage />} /></Route>
    <Route path="/unauthorized" element={<UnauthorizedPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Route></Routes></Suspense>
}
