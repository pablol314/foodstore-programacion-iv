import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { DataTable } from '@/shared/components/DataTable'
import { useNotificationStore } from '@/store/notificationStore'
import { messageFrom, storeApi } from '@/shared/api/foodstore'
import type { AdminSummary, Category, Order, Product, ProductPayload, User } from '@/shared/types/foodstore'

const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })
const panel = 'rounded-3xl border border-ink/10 bg-white p-5 shadow-sm'
const button = 'rounded-full bg-forest px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-45'
const borderButton = 'rounded-full border border-ink/15 px-4 py-2.5 text-xs font-bold text-forest disabled:opacity-45'

export function AdminDashboardPage() {
  const query = useQuery({ queryKey: ['admin-summary'], queryFn: storeApi.summary })
  const cards: { label: string; key: keyof AdminSummary; currency?: boolean }[] = [
    { label: 'Pedidos de hoy', key: 'pedidos_hoy' },
    { label: 'Ventas entregadas hoy', key: 'ventas_entregadas_hoy', currency: true },
    { label: 'Pendientes', key: 'pedidos_pendientes' },
    { label: 'En preparación', key: 'pedidos_en_preparacion' },
    { label: 'Productos activos', key: 'productos_activos' },
    { label: 'Usuarios activos', key: 'usuarios_activos' },
  ]
  return <main className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest">Panel de control</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Administración</h1><p className="mt-2 text-sm text-ink/55">Resumen operativo actualizado desde pedidos, catálogo y cuentas.</p>
    {query.isLoading ? <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards.map((card) => <div key={card.key} className="h-32 animate-pulse rounded-3xl bg-white" />)}</div> : query.error ? <p role="alert" className="mt-7 rounded-2xl bg-[#f8ece7] p-5 text-[#9b3f28]">{messageFrom(query.error)} <button className="underline" onClick={() => void query.refetch()}>Reintentar</button></p> : <><div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards.map((card) => <article key={card.key} className={panel}><p className="text-xs font-bold text-ink/55">{card.label}</p><strong className="mt-5 block text-3xl tracking-tight">{card.currency ? money.format(Number(query.data?.[card.key] ?? 0)) : query.data?.[card.key]}</strong></article>)}</div><article className={`${panel} mt-4 flex items-center justify-between gap-4`}><div><p className="text-xs font-bold text-ink/55">Pedidos entregados</p><strong className="mt-1 block text-2xl">{query.data?.pedidos_entregados ?? 0}</strong></div><span className="rounded-full bg-moss px-3 py-1.5 text-xs font-bold text-forest">Sincronizado con el servidor</span></article></>}
  </main>
}

const productColumn = createColumnHelper<Product>()
export function AdminProductsPage() {
  const queryClient = useQueryClient()
  const notify = useNotificationStore((state) => state.showNotification)
  const products = useQuery({ queryKey: ['admin-products'], queryFn: storeApi.adminProducts })
  const categories = useQuery({ queryKey: ['categories'], queryFn: storeApi.categories })
  const [editing, setEditing] = useState<Product | null>(null)
  const [open, setOpen] = useState(false)
  const save = useMutation({
    mutationFn: (payload: ProductPayload) => editing ? storeApi.updateProduct(editing.id, payload) : storeApi.createProduct(payload),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['admin-products'] }); await queryClient.invalidateQueries({ queryKey: ['products'] }); setOpen(false); setEditing(null); notify('Producto guardado.') },
  })
  const stock = useMutation({ mutationFn: ({ id, value }: { id: number; value: number }) => storeApi.updateStock(id, { stock: value }), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['admin-products'] }); await queryClient.invalidateQueries({ queryKey: ['products'] }); notify('Stock actualizado.') } })
  const deactivate = useMutation({ mutationFn: storeApi.deactivateProduct, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['admin-products'] }); await queryClient.invalidateQueries({ queryKey: ['products'] }); notify('Producto retirado del catálogo.') } })
  const columns = useMemo<ColumnDef<Product>[]>(() => [
    productColumn.accessor('nombre', { header: 'Producto', cell: (info) => <span className="font-bold">{info.getValue()}</span> }),
    productColumn.accessor('categoria_nombre', { header: 'Categoría' }),
    productColumn.accessor('precio', { header: 'Precio', cell: (info) => money.format(Number(info.getValue())) }),
    productColumn.accessor('stock', { header: 'Stock' }),
    productColumn.accessor((row) => row.activo && row.disponible ? 'Disponible' : row.activo ? 'Pausado' : 'Inactivo', { id: 'estado', header: 'Estado' }),
    productColumn.display({ id: 'acciones', header: 'Acciones', cell: ({ row }) => <div className="flex flex-wrap gap-2"><button className={borderButton} onClick={() => { setEditing(row.original); setOpen(true) }}>Editar</button><button className={borderButton} onClick={() => { const value = window.prompt(`Nuevo stock para ${row.original.nombre}`, String(row.original.stock)); if (value !== null && /^\d+$/.test(value)) stock.mutate({ id: row.original.id, value: Number(value) }) }}>Stock</button>{row.original.activo && <button className="rounded-full border border-coral/30 px-3 py-2 text-[10px] font-bold text-[#a34e35]" onClick={() => { if (window.confirm(`¿Retirar «${row.original.nombre}» del catálogo?`)) deactivate.mutate(row.original.id) }}>Retirar</button>}</div> }),
  ], [stock, deactivate])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    save.mutate({
      categoria_id: Number(data.get('categoria_id')),
      nombre: String(data.get('nombre')).trim(),
      descripcion: String(data.get('descripcion')).trim() || null,
      precio: Number(data.get('precio')),
      imagen_url: String(data.get('imagen_url')).trim() || null,
      stock: Number(data.get('stock')),
      disponible: data.get('disponible') === 'on',
    })
  }

  const error = products.error ?? categories.error
  return <main className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest">Administración · Catálogo</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Productos</h1><p className="mt-2 text-sm text-ink/55">Alta, edición, disponibilidad y stock del catálogo.</p></div><button className={button} onClick={() => { setEditing(null); setOpen(true) }}>+ Nuevo producto</button></div>
    <section className="mt-7"><DataTable data={products.data?.items ?? []} columns={columns} loading={products.isLoading || categories.isLoading} error={error ? messageFrom(error) : null} emptyMessage="No hay productos cargados." onRetry={() => { void products.refetch(); void categories.refetch() }} /></section>
    {open && <div className="fixed inset-0 z-40 grid place-items-center bg-ink/45 p-4"><section role="dialog" aria-modal="true" aria-labelledby="product-dialog-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6"><div className="flex justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-forest">Catálogo</p><h2 id="product-dialog-title" className="mt-1 text-2xl font-semibold">{editing ? 'Editar producto' : 'Nuevo producto'}</h2></div><button aria-label="Cerrar" onClick={() => { setOpen(false); setEditing(null); save.reset() }} className="grid size-9 place-items-center rounded-full border border-ink/10">×</button></div><form onSubmit={submit} className="mt-5 grid gap-3 sm:grid-cols-2">
      <label className="text-xs font-bold sm:col-span-2">Nombre<input name="nombre" required minLength={2} defaultValue={editing?.nombre} className="field mt-1.5" /></label>
      <label className="text-xs font-bold">Categoría<select name="categoria_id" required defaultValue={editing?.categoria_id ?? ''} className="field mt-1.5"><option value="" disabled>Elegir categoría</option>{(categories.data ?? []).filter((category) => category.activo).map((category) => <option key={category.id} value={category.id}>{category.nombre}</option>)}</select></label>
      <label className="text-xs font-bold">Precio<input name="precio" type="number" min="0" step="0.01" required defaultValue={editing?.precio ?? ''} className="field mt-1.5" /></label>
      <label className="text-xs font-bold">Stock<input name="stock" type="number" min="0" step="1" required defaultValue={editing?.stock ?? 0} className="field mt-1.5" /></label>
      <label className="text-xs font-bold">Imagen (URL)<input name="imagen_url" type="url" defaultValue={editing?.imagen_url ?? ''} className="field mt-1.5" /></label>
      <label className="text-xs font-bold sm:col-span-2">Descripción<textarea name="descripcion" maxLength={1000} defaultValue={editing?.descripcion ?? ''} className="field mt-1.5 min-h-20" /></label>
      <label className="flex items-center gap-2 text-xs font-bold sm:col-span-2"><input name="disponible" type="checkbox" defaultChecked={editing?.disponible ?? true} /> Disponible para la venta</label>
      {save.error && <p role="alert" className="text-sm text-[#9b3f28] sm:col-span-2">{messageFrom(save.error)}</p>}
      <button type="submit" disabled={save.isPending} className={`${button} sm:col-span-2`}>{save.isPending ? 'Guardando…' : 'Guardar producto'}</button>
    </form></section></div>}
  </main>
}

const categoryColumn = createColumnHelper<Category>()
export function AdminCategoriesPage() {
  const queryClient = useQueryClient()
  const notify = useNotificationStore((state) => state.showNotification)
  const categories = useQuery({ queryKey: ['categories'], queryFn: storeApi.categories })
  const [editing, setEditing] = useState<Category | null>(null)
  const save = useMutation({
    mutationFn: (payload: { nombre: string; descripcion: string | null }) => editing ? storeApi.updateCategory(editing.id, payload) : storeApi.createCategory(payload),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['categories'] }); await queryClient.invalidateQueries({ queryKey: ['products'] }); setEditing(null); notify('Categoría guardada.') },
  })
  const deactivate = useMutation({ mutationFn: storeApi.deactivateCategory, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['categories'] }); await queryClient.invalidateQueries({ queryKey: ['products'] }); notify('Categoría desactivada.') } })
  const columns = useMemo<ColumnDef<Category>[]>(() => [
    categoryColumn.accessor('nombre', { header: 'Categoría', cell: (info) => <span className="font-bold">{info.getValue()}</span> }),
    categoryColumn.accessor('descripcion', { header: 'Descripción', cell: (info) => info.getValue() || '—' }),
    categoryColumn.accessor((row) => row.activo ? 'Activa' : 'Inactiva', { id: 'estado', header: 'Estado' }),
    categoryColumn.display({ id: 'acciones', header: 'Acciones', cell: ({ row }) => <div className="flex gap-2"><button className={borderButton} onClick={() => setEditing(row.original)}>Editar</button>{row.original.activo && <button className="rounded-full border border-coral/30 px-3 py-2 text-[10px] font-bold text-[#a34e35]" onClick={() => { if (window.confirm(`¿Desactivar «${row.original.nombre}» y ocultar sus productos?`)) deactivate.mutate(row.original.id) }}>Desactivar</button>}</div> }),
  ], [deactivate])
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    save.mutate({ nombre: String(data.get('nombre')).trim(), descripcion: String(data.get('descripcion')).trim() || null })
    event.currentTarget.reset()
  }
  return <main className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest">Administración · Catálogo</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Categorías</h1><p className="mt-2 text-sm text-ink/55">Las categorías se desactivan sin borrar el historial de productos y pedidos.</p>
    <form key={editing?.id ?? 'new-category'} onSubmit={submit} className="mt-7 grid gap-3 rounded-3xl border border-ink/10 bg-white p-5 sm:grid-cols-[1fr_1.4fr_auto]"><label className="text-xs font-bold">Nombre<input name="nombre" minLength={2} maxLength={100} required defaultValue={editing?.nombre ?? ''} className="field mt-1.5" /></label><label className="text-xs font-bold">Descripción<input name="descripcion" maxLength={500} defaultValue={editing?.descripcion ?? ''} className="field mt-1.5" /></label><button className={`${button} self-end`} disabled={save.isPending}>{editing ? 'Guardar edición' : 'Crear categoría'}</button>{editing && <button type="button" className="text-xs text-ink/55 underline sm:col-span-3" onClick={() => setEditing(null)}>Cancelar edición</button>}{save.error && <p className="text-sm text-[#9b3f28] sm:col-span-3">{messageFrom(save.error)}</p>}</form>
    <section className="mt-5"><DataTable data={categories.data ?? []} columns={columns} loading={categories.isLoading} error={categories.error ? messageFrom(categories.error) : null} emptyMessage="Todavía no hay categorías." onRetry={() => void categories.refetch()} /></section>
  </main>
}

const orderColumn = createColumnHelper<Order>()
export function AdminOrdersPage() {
  const queryClient = useQueryClient()
  const notify = useNotificationStore((state) => state.showNotification)
  const orders = useQuery({ queryKey: ['admin-orders'], queryFn: storeApi.adminOrders })
  const update = useMutation({ mutationFn: ({ id, state }: { id: number; state: Order['estado'] }) => storeApi.setOrderState(id, state), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['admin-orders'] }); await queryClient.invalidateQueries({ queryKey: ['admin-summary'] }); await queryClient.invalidateQueries({ queryKey: ['admin-products'] }); await queryClient.invalidateQueries({ queryKey: ['products'] }); notify('Estado del pedido actualizado.') } })
  const columns = useMemo<ColumnDef<Order>[]>(() => [
    orderColumn.accessor((order) => `#${order.id}`, { id: 'id', header: 'Pedido' }),
    orderColumn.accessor('usuario_nombre', { header: 'Cliente' }),
    orderColumn.accessor('created_at', { header: 'Fecha', cell: (info) => new Date(info.getValue()).toLocaleString('es-AR') }),
    orderColumn.accessor('total', { header: 'Total', cell: (info) => money.format(Number(info.getValue())) }),
    orderColumn.accessor('estado', { header: 'Estado', cell: (info) => <span className="rounded-full bg-moss px-3 py-1.5 text-[10px] font-bold text-forest">{info.getValue().replace('_', ' ')}</span> }),
    orderColumn.display({ id: 'acciones', header: 'Actualizar', cell: ({ row }) => {
      const order = row.original
      const next: Order['estado'][] = order.estado === 'PENDIENTE' ? ['EN_PREPARACION', 'CANCELADO'] : order.estado === 'EN_PREPARACION' ? ['ENTREGADO', 'CANCELADO'] : []
      return next.length ? <div className="flex flex-wrap gap-2">{next.map((state) => <button key={state} className={state === 'CANCELADO' ? 'rounded-full border border-coral/30 px-3 py-2 text-[10px] font-bold text-[#a34e35]' : borderButton} onClick={() => { if (state === 'CANCELADO' && !window.confirm(`¿Cancelar el pedido #${order.id} y reponer el stock?`)) return; update.mutate({ id: order.id, state }) }}>{state.replace('_', ' ')}</button>)}</div> : <span className="text-xs text-ink/45">Finalizado</span>
    } }),
  ], [update])
  return <main className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest">Administración · Operaciones</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Pedidos</h1><p className="mt-2 text-sm text-ink/55">Cada cambio sigue el flujo permitido; al cancelar, el sistema restituye el stock dentro de la misma transacción.</p><section className="mt-7"><DataTable data={orders.data ?? []} columns={columns} loading={orders.isLoading} error={orders.error ? messageFrom(orders.error) : update.error ? messageFrom(update.error) : null} emptyMessage="Todavía no hay pedidos." onRetry={() => void orders.refetch()} /></section></main>
}

const userColumn = createColumnHelper<User>()
export function AdminUsersPage() {
  const queryClient = useQueryClient()
  const notify = useNotificationStore((state) => state.showNotification)
  const users = useQuery({ queryKey: ['admin-users'], queryFn: storeApi.users })
  const change = useMutation({ mutationFn: ({ id, disabled }: { id: number; disabled: boolean }) => storeApi.setUserDisabled(id, disabled), onSuccess: async (_, variables) => { await queryClient.invalidateQueries({ queryKey: ['admin-users'] }); notify(variables.disabled ? 'Cuenta desactivada.' : 'Cuenta activada.') } })
  const columns = useMemo<ColumnDef<User>[]>(() => [
    userColumn.accessor('full_name', { header: 'Nombre', cell: (info) => <span className="font-bold">{info.getValue()}</span> }),
    userColumn.accessor('username', { header: 'Usuario' }),
    userColumn.accessor('email', { header: 'Correo' }),
    userColumn.accessor('role', { header: 'Rol', cell: (info) => info.getValue() === 'admin' ? 'Administrador' : 'Cliente' }),
    userColumn.accessor((user) => user.disabled ? 'Desactivada' : 'Activa', { id: 'estado', header: 'Estado' }),
    userColumn.display({ id: 'acciones', header: 'Acciones', cell: ({ row }) => <button className={borderButton} onClick={() => change.mutate({ id: row.original.id, disabled: !row.original.disabled })}>{row.original.disabled ? 'Activar' : 'Desactivar'}</button> }),
  ], [change])
  return <main className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest">Administración · Accesos</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Usuarios</h1><p className="mt-2 text-sm text-ink/55">Administrá el acceso de las cuentas registradas sin borrar su historial.</p><section className="mt-7"><DataTable data={users.data ?? []} columns={columns} loading={users.isLoading} error={users.error ? messageFrom(users.error) : change.error ? messageFrom(change.error) : null} emptyMessage="Todavía no hay usuarios registrados." onRetry={() => void users.refetch()} /></section></main>
}
