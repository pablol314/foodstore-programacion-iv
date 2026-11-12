import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { DataTable } from '@/shared/components/DataTable'
import { messageFrom, storeApi } from '@/shared/api/foodstore'
import { useNotificationStore } from '@/store/notificationStore'
import type { Order } from '@/shared/types/foodstore'

const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })
const borderButton = 'rounded-full border border-ink/15 px-4 py-2.5 text-xs font-bold text-forest disabled:opacity-45'
const fieldClass = 'field mt-1.5'

const orderColumn = createColumnHelper<Order>()
export function AdminOrdersPage() {
  const queryClient = useQueryClient()
  const notify = useNotificationStore((state) => state.showNotification)
  const [estado, setEstado] = useState<Order['estado'] | ''>('')
  const orders = useQuery({ queryKey: ['admin-orders', estado], queryFn: () => storeApi.adminOrders(estado || undefined) })
  const update = useMutation({
    mutationFn: ({ id, state }: { id: number; state: Order['estado'] }) => storeApi.setOrderState(id, state),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['admin-orders'] }); await queryClient.invalidateQueries({ queryKey: ['admin-summary'] }); await queryClient.invalidateQueries({ queryKey: ['admin-products'] }); await queryClient.invalidateQueries({ queryKey: ['products'] }); notify('Estado del pedido actualizado.') },
  })
  const columns = useMemo<ColumnDef<Order>[]>(() => [
    orderColumn.accessor((order) => `#${order.id}`, { id: 'id', header: 'Pedido' }),
    orderColumn.accessor((order) => `Usuario #${order.usuario_id}`, { id: 'usuario', header: 'Cliente' }),
    orderColumn.accessor('created_at', { header: 'Fecha', cell: (info) => new Date(info.getValue()).toLocaleString('es-AR') }),
    orderColumn.accessor('total', { header: 'Total', cell: (info) => money.format(info.getValue()) }),
    orderColumn.accessor('estado', { header: 'Estado', cell: (info) => <span className="rounded-full bg-moss px-3 py-1.5 text-[10px] font-bold text-forest">{info.getValue().replace('_', ' ')}</span> }),
    orderColumn.display({ id: 'acciones', header: 'Actualizar', cell: ({ row }) => {
      const order = row.original
      const next: Order['estado'][] = order.estado === 'PENDIENTE' ? ['EN_PREPARACION', 'CANCELADO'] : order.estado === 'EN_PREPARACION' ? ['ENTREGADO', 'CANCELADO'] : []
      return next.length ? <div className="flex flex-wrap gap-2">{next.map((state) => <button key={state} className={state === 'CANCELADO' ? 'rounded-full border border-coral/30 px-3 py-2 text-[10px] font-bold text-[#a34e35]' : borderButton} onClick={() => { if (state === 'CANCELADO' && !window.confirm(`¿Cancelar el pedido #${order.id} y reponer el stock?`)) return; update.mutate({ id: order.id, state }) }}>{state.replace('_', ' ')}</button>)}</div> : <span className="text-xs text-ink/45">Finalizado</span>
    } }),
  ], [update])
  return <main className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest">Administración · Operaciones</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Pedidos</h1><p className="mt-2 text-sm text-ink/55">Filtrá por estado y aplicá las transiciones permitidas. La cancelación repone el stock.</p><label className="mt-6 block max-w-xs text-xs font-bold">Estado<select className={fieldClass} value={estado} onChange={(event) => setEstado(event.target.value as Order['estado'] | '')}><option value="">Todos</option><option value="PENDIENTE">Pendiente</option><option value="EN_PREPARACION">En preparación</option><option value="ENTREGADO">Entregado</option><option value="CANCELADO">Cancelado</option></select></label><section className="mt-5"><DataTable data={orders.data ?? []} columns={columns} loading={orders.isLoading} error={orders.error ? messageFrom(orders.error) : update.error ? messageFrom(update.error) : null} emptyMessage="Todavía no hay pedidos para este filtro." onRetry={() => void orders.refetch()} /></section></main>
}
