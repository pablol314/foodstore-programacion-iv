import { useQuery } from '@tanstack/react-query'

import { messageFrom, storeApi } from '@/shared/api/foodstore'
import type { AdminSummary } from '@/shared/types/foodstore'

const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })
const panel = 'rounded-3xl border border-ink/10 bg-white p-5 shadow-sm'

export function AdminSummaryPage() {
  const query = useQuery({ queryKey: ['admin-summary'], queryFn: storeApi.summary })
  const cards: { label: string; key: keyof AdminSummary; currency?: boolean }[] = [
    { label: 'Pedidos de hoy', key: 'pedidos_hoy' },
    { label: 'Ingresos de pedidos entregados', key: 'ingresos_entregados', currency: true },
    { label: 'Pendientes', key: 'pendientes' },
    { label: 'En preparación', key: 'en_preparacion' },
    { label: 'Entregados', key: 'entregados' },
    { label: 'Cancelados', key: 'cancelados' },
  ]
  return <main className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest">Panel de control</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Administración</h1><p className="mt-2 text-sm text-ink/55">Resumen de pedidos y ventas entregadas.</p>
    {query.isLoading ? <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards.map((card) => <div key={card.key} className="h-32 animate-pulse rounded-3xl bg-white" />)}</div> : query.error ? <p role="alert" className="mt-7 rounded-2xl bg-[#f8ece7] p-5 text-[#9b3f28]">{messageFrom(query.error)} <button className="underline" onClick={() => void query.refetch()}>Reintentar</button></p> : <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards.map((card) => <article key={card.key} className={panel}><p className="text-xs font-bold text-ink/55">{card.label}</p><strong className="mt-5 block text-3xl tracking-tight">{card.currency ? money.format(query.data?.[card.key] ?? 0) : query.data?.[card.key]}</strong></article>)}</div>}
  </main>
}
