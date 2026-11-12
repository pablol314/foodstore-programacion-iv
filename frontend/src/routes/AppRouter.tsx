import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, NavLink, Outlet, Route, Routes, useNavigate } from 'react-router-dom'

import { useCartStore } from '@/features/cart/store'
import { useSessionStore } from '@/features/auth/store'
import { storeApi } from '@/shared/api/foodstore'
import { Toast } from '@/shared/components/Toast'

const CatalogPage = lazy(() => import('@/features/catalog').then((module) => ({ default: module.CatalogPage })))
const CartPage = lazy(() => import('@/features/cart').then((module) => ({ default: module.CartPage })))
const OrdersPage = lazy(() => import('@/features/orders').then((module) => ({ default: module.OrdersPage })))
const LoginPage = lazy(() => import('@/features/auth').then((module) => ({ default: module.LoginPage })))
const RegisterPage = lazy(() => import('@/features/auth').then((module) => ({ default: module.RegisterPage })))
const AdminDashboardPage = lazy(() => import('@/features/admin').then((module) => ({ default: module.AdminDashboardPage })))
const AdminProductsPage = lazy(() => import('@/features/admin').then((module) => ({ default: module.AdminProductsPage })))
const AdminCategoriesPage = lazy(() => import('@/features/admin').then((module) => ({ default: module.AdminCategoriesPage })))
const AdminOrdersPage = lazy(() => import('@/features/admin').then((module) => ({ default: module.AdminOrdersPage })))
const AdminUsersPage = lazy(() => import('@/features/admin').then((module) => ({ default: module.AdminUsersPage })))

function LinkItem({ to, children }: { to: string; children: ReactNode }) {
  return <NavLink to={to} end className={({ isActive }) => `rounded-full px-3 py-2 text-xs font-bold transition ${isActive ? 'bg-moss text-forest' : 'text-ink/65 hover:bg-paper hover:text-forest'}`}>{children}</NavLink>
}

function Layout() {
  const user = useSessionStore((state) => state.user)
  const clearUser = useSessionStore((state) => state.clearUser)
  const count = useCartStore((state) => state.items.reduce((sum, line) => sum + line.quantity, 0))
  const navigate = useNavigate()
  async function logout() {
    try { await storeApi.logout() } finally { clearUser(); navigate('/', { replace: true }) }
  }
  return <div className="min-h-screen bg-paper text-ink"><header className="sticky top-0 z-30 border-b border-ink/10 bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8"><NavLink to="/" className="flex items-center gap-2"><span className="grid size-10 place-items-center rounded-2xl bg-forest text-xl text-white">F</span><span><strong className="block text-sm tracking-tight">FoodStore</strong><span className="block text-[9px] uppercase tracking-[0.18em] text-ink/45">Mercado online</span></span></NavLink>
    <nav className="flex flex-wrap items-center gap-1" aria-label="Navegación principal"><LinkItem to="/">Catálogo</LinkItem>{user && <><LinkItem to="/orders">Mis pedidos</LinkItem><LinkItem to="/cart">Carrito{count > 0 ? ` · ${count}` : ''}</LinkItem>{user.role === 'admin' && <LinkItem to="/admin">Admin</LinkItem>}</>}{!user && <><LinkItem to="/login">Ingresar</LinkItem><LinkItem to="/register">Crear cuenta</LinkItem></>}{user && <button onClick={() => void logout()} className="ml-1 rounded-full border border-ink/10 px-3 py-2 text-xs font-bold text-ink/60 hover:bg-paper">Salir</button>}</nav>
  </div>{user?.role === 'admin' && <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-5 pb-2 sm:px-8" aria-label="Administración"><LinkItem to="/admin/products">Productos</LinkItem><LinkItem to="/admin/categories">Categorías</LinkItem><LinkItem to="/admin/orders">Pedidos</LinkItem><LinkItem to="/admin/users">Usuarios</LinkItem></nav>}</header><Outlet /><Toast /></div>
}

function Protected() {
  const user = useSessionStore((state) => state.user)
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

function AdminOnly() {
  const user = useSessionStore((state) => state.user)
  return user?.role === 'admin' ? <Outlet /> : <Navigate to={user ? '/' : '/login'} replace />
}

export function AppRouter() {
  return <Suspense fallback={<main className="grid min-h-[60vh] place-items-center text-sm font-semibold text-forest">Cargando la página…</main>}><Routes><Route element={<Layout />}>
    <Route path="/" element={<CatalogPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route element={<Protected />}><Route path="/cart" element={<CartPage />} /><Route path="/orders" element={<OrdersPage />} /></Route>
    <Route element={<AdminOnly />}><Route path="/admin" element={<AdminDashboardPage />} /><Route path="/admin/products" element={<AdminProductsPage />} /><Route path="/admin/categories" element={<AdminCategoriesPage />} /><Route path="/admin/orders" element={<AdminOrdersPage />} /><Route path="/admin/users" element={<AdminUsersPage />} /></Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Route></Routes></Suspense>
}
