import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { useForm } from '@tanstack/react-form'
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { DataTable } from '@/shared/components/DataTable'
import { messageFrom, storeApi } from '@/shared/api/foodstore'
import { useNotificationStore } from '@/store/notificationStore'
import type { Category, Product, ProductPayload } from '@/shared/types/foodstore'

const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })
const button = 'rounded-full bg-forest px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-45'
const borderButton = 'rounded-full border border-ink/15 px-4 py-2.5 text-xs font-bold text-forest disabled:opacity-45'
const fieldClass = 'field mt-1.5'

interface ProductFormValues {
  categoria_id: number
  nombre: string
  descripcion: string
  precio_base: number
  imagen_url: string
  stock: number
  disponible: boolean
}

function ProductEditor({
  product,
  categories,
  pending,
  error,
  onSave,
  onClose,
}: {
  product: Product | null
  categories: Category[]
  pending: boolean
  error: string | null
  onSave: (payload: ProductPayload) => Promise<void>
  onClose: () => void
}) {
  const form = useForm({
    defaultValues: {
      categoria_id: product?.categoria_id ?? (categories.find((category) => category.activo)?.id ?? 0),
      nombre: product?.nombre ?? '',
      descripcion: product?.descripcion ?? '',
      precio_base: product?.precio_base ?? 0,
      imagen_url: product?.imagen_url ?? '',
      stock: product?.stock ?? 0,
      disponible: product?.disponible ?? true,
    } satisfies ProductFormValues,
    onSubmit: async ({ value }) => onSave({
      ...value,
      descripcion: value.descripcion.trim() || null,
      imagen_url: value.imagen_url.trim() || null,
    }),
  })

  return <div className="fixed inset-0 z-40 grid place-items-center bg-ink/45 p-4"><section role="dialog" aria-modal="true" aria-labelledby="product-dialog-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6"><div className="flex justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-forest">Catálogo</p><h2 id="product-dialog-title" className="mt-1 text-2xl font-semibold">{product ? 'Editar producto' : 'Nuevo producto'}</h2></div><button aria-label="Cerrar" onClick={onClose} className="grid size-9 place-items-center rounded-full border border-ink/10">×</button></div>
    <form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); void form.handleSubmit() }}>
      <form.Field name="nombre" validators={{ onChange: ({ value }) => value.trim().length < 2 ? 'Ingresá al menos dos caracteres.' : undefined }}>{(field) => <label className="text-xs font-bold sm:col-span-2">Nombre<input name="nombre" required minLength={2} value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} className={fieldClass} /></label>}</form.Field>
      <form.Field name="categoria_id" validators={{ onChange: ({ value }) => value > 0 ? undefined : 'Elegí una categoría.' }}>{(field) => <label className="text-xs font-bold">Categoría<select name="categoria_id" required value={field.state.value} onChange={(event) => field.handleChange(Number(event.target.value))} className={fieldClass}><option value={0} disabled>Elegir categoría</option>{categories.map((category) => <option key={category.id} value={category.id} disabled={!category.activo && category.id !== product?.categoria_id}>{category.nombre}{category.activo ? '' : ' (inactiva)'}</option>)}</select></label>}</form.Field>
      <form.Field name="precio_base" validators={{ onChange: ({ value }) => value >= 0 ? undefined : 'El precio no puede ser negativo.' }}>{(field) => <label className="text-xs font-bold">Precio<input name="precio_base" type="number" min="0" step="0.01" required value={field.state.value} onChange={(event) => field.handleChange(Number(event.target.value))} className={fieldClass} /></label>}</form.Field>
      <form.Field name="stock" validators={{ onChange: ({ value }) => Number.isInteger(value) && value >= 0 ? undefined : 'El stock debe ser un entero no negativo.' }}>{(field) => <label className="text-xs font-bold">Stock inicial<input name="stock" type="number" min="0" step="1" required value={field.state.value} onChange={(event) => field.handleChange(Number(event.target.value))} className={fieldClass} /></label>}</form.Field>
      <form.Field name="imagen_url">{(field) => <label className="text-xs font-bold">Imagen (URL)<input name="imagen_url" type="url" value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} className={fieldClass} /></label>}</form.Field>
      <form.Field name="descripcion">{(field) => <label className="text-xs font-bold sm:col-span-2">Descripción<textarea name="descripcion" maxLength={1000} value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} className={`${fieldClass} min-h-20`} /></label>}</form.Field>
      <form.Field name="disponible">{(field) => <label className="flex items-center gap-2 text-xs font-bold sm:col-span-2"><input name="disponible" type="checkbox" checked={field.state.value} onChange={(event) => field.handleChange(event.target.checked)} /> Disponible para la venta</label>}</form.Field>
      {error && <p role="alert" className="text-sm text-[#9b3f28] sm:col-span-2">{error}</p>}
      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>{([canSubmit, isSubmitting]) => <button type="submit" disabled={!canSubmit || isSubmitting || pending} className={`${button} sm:col-span-2`}>{pending || isSubmitting ? 'Guardando…' : 'Guardar producto'}</button>}</form.Subscribe>
    </form>
  </section></div>
}

function StockEditor({
  product,
  pending,
  error,
  onSave,
  onClose,
}: {
  product: Product
  pending: boolean
  error: string | null
  onSave: (payload: { stock: number; disponible: boolean }) => Promise<void>
  onClose: () => void
}) {
  const form = useForm({
    defaultValues: { stock: product.stock, disponible: product.disponible },
    onSubmit: async ({ value }) => onSave(value),
  })
  return <div className="fixed inset-0 z-40 grid place-items-center bg-ink/45 p-4"><section role="dialog" aria-modal="true" aria-labelledby="stock-dialog-title" className="w-full max-w-md rounded-3xl bg-white p-6"><div className="flex justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-forest">Inventario</p><h2 id="stock-dialog-title" className="mt-1 text-xl font-semibold">{product.nombre}</h2></div><button aria-label="Cerrar" onClick={onClose} className="grid size-9 place-items-center rounded-full border border-ink/10">×</button></div>
    <form className="mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); void form.handleSubmit() }}><form.Field name="stock" validators={{ onChange: ({ value }) => Number.isInteger(value) && value >= 0 ? undefined : 'El stock debe ser un entero no negativo.' }}>{(field) => <label className="block text-xs font-bold">Stock<input type="number" min="0" step="1" required value={field.state.value} onChange={(event) => field.handleChange(Number(event.target.value))} className={fieldClass} /></label>}</form.Field><form.Field name="disponible">{(field) => <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={field.state.value} onChange={(event) => field.handleChange(event.target.checked)} /> Disponible para la venta</label>}</form.Field>{error && <p role="alert" className="text-sm text-[#9b3f28]">{error}</p>}<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>{([canSubmit, isSubmitting]) => <button className={`${button} w-full`} disabled={!canSubmit || isSubmitting || pending}>{pending || isSubmitting ? 'Guardando…' : 'Guardar inventario'}</button>}</form.Subscribe></form>
  </section></div>
}

const productColumn = createColumnHelper<Product>()
export function AdminProductsPage() {
  const queryClient = useQueryClient()
  const notify = useNotificationStore((state) => state.showNotification)
  const products = useQuery({ queryKey: ['admin-products'], queryFn: storeApi.adminProducts })
  const categories = useQuery({ queryKey: ['categories'], queryFn: storeApi.categories })
  const [editing, setEditing] = useState<Product | null>(null)
  const [stockEditing, setStockEditing] = useState<Product | null>(null)
  const [open, setOpen] = useState(false)
  const save = useMutation({
    mutationFn: ({ product, payload }: { product: Product | null; payload: ProductPayload }) => product ? storeApi.updateProduct(product.id, payload) : storeApi.createProduct(payload),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['admin-products'] }); await queryClient.invalidateQueries({ queryKey: ['products'] }); setOpen(false); setEditing(null); notify('Producto guardado.') },
  })
  const stock = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { stock: number; disponible: boolean } }) => storeApi.updateStock(id, payload),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['admin-products'] }); await queryClient.invalidateQueries({ queryKey: ['products'] }); setStockEditing(null); notify('Stock y disponibilidad actualizados.') },
  })
  const deactivate = useMutation({
    mutationFn: storeApi.deactivateProduct,
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['admin-products'] }); await queryClient.invalidateQueries({ queryKey: ['products'] }); notify('Producto retirado del catálogo.') },
  })
  const columns = useMemo<ColumnDef<Product>[]>(() => [
    productColumn.accessor('nombre', { header: 'Producto', cell: (info) => <span className="font-bold">{info.getValue()}</span> }),
    productColumn.accessor((row) => row.categoria.nombre, { id: 'categoria', header: 'Categoría' }),
    productColumn.accessor('precio_base', { header: 'Precio', cell: (info) => money.format(info.getValue()) }),
    productColumn.accessor('stock', { header: 'Stock' }),
    productColumn.accessor((row) => row.activo && row.disponible ? 'Disponible' : row.activo ? 'Pausado' : 'Inactivo', { id: 'estado', header: 'Estado' }),
    productColumn.display({ id: 'acciones', header: 'Acciones', cell: ({ row }) => row.original.activo ? <div className="flex flex-wrap gap-2"><button className={borderButton} onClick={() => { setEditing(row.original); setOpen(true) }}>Editar</button><button className={borderButton} onClick={() => setStockEditing(row.original)}>Stock y disponibilidad</button><button className="rounded-full border border-coral/30 px-3 py-2 text-[10px] font-bold text-[#a34e35]" onClick={() => { if (window.confirm(`¿Dar de baja «${row.original.nombre}»?`)) deactivate.mutate(row.original.id) }}>Dar de baja</button></div> : <span className="text-xs text-ink/45">Baja lógica</span> }),
  ], [deactivate])
  const queryError = products.error ?? categories.error
  return <main className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest">Administración · Catálogo</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Productos</h1><p className="mt-2 text-sm text-ink/55">Alta, edición, baja lógica, disponibilidad y stock.</p></div><button className={button} onClick={() => { setEditing(null); setOpen(true) }}>+ Nuevo producto</button></div>
    <section className="mt-7"><DataTable data={products.data?.items ?? []} columns={columns} loading={products.isLoading || categories.isLoading} error={queryError ? messageFrom(queryError) : null} emptyMessage="No hay productos cargados." onRetry={() => { void products.refetch(); void categories.refetch() }} /></section>
    {open && <ProductEditor key={editing?.id ?? 'new'} product={editing} categories={categories.data ?? []} pending={save.isPending} error={save.error ? messageFrom(save.error) : null} onSave={(payload) => save.mutateAsync({ product: editing, payload }).then(() => undefined)} onClose={() => { setOpen(false); setEditing(null); save.reset() }} />}
    {stockEditing && <StockEditor key={stockEditing.id} product={stockEditing} pending={stock.isPending} error={stock.error ? messageFrom(stock.error) : null} onSave={(payload) => stock.mutateAsync({ id: stockEditing.id, payload }).then(() => undefined)} onClose={() => { setStockEditing(null); stock.reset() }} />}
  </main>
}
