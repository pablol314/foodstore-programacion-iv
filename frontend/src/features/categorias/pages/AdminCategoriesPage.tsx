import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { useForm } from '@tanstack/react-form'
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { DataTable } from '@/shared/components/DataTable'
import { messageFrom, storeApi } from '@/shared/api/foodstore'
import { useNotificationStore } from '@/store/notificationStore'
import type { Category } from '@/shared/types/foodstore'

const button = 'rounded-full bg-forest px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-45'
const borderButton = 'rounded-full border border-ink/15 px-4 py-2.5 text-xs font-bold text-forest disabled:opacity-45'
const fieldClass = 'field mt-1.5'

interface CategoryFormValues {
  nombre: string
  descripcion: string
}

function CategoryEditor({
  category,
  pending,
  error,
  onSave,
  onCancel,
}: {
  category: Category | null
  pending: boolean
  error: string | null
  onSave: (payload: { nombre: string; descripcion: string | null }) => Promise<void>
  onCancel: () => void
}) {
  const form = useForm({
    defaultValues: { nombre: category?.nombre ?? '', descripcion: category?.descripcion ?? '' } satisfies CategoryFormValues,
    onSubmit: async ({ value }) => onSave({ nombre: value.nombre.trim(), descripcion: value.descripcion.trim() || null }),
  })
  return <form className="mt-7 grid gap-3 rounded-3xl border border-ink/10 bg-white p-5 sm:grid-cols-[1fr_1.4fr_auto]" onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); void form.handleSubmit() }}>
    <form.Field name="nombre" validators={{ onChange: ({ value }) => value.trim().length < 2 ? 'Usá al menos dos caracteres.' : value.trim().length > 100 ? 'El nombre admite hasta 100 caracteres.' : undefined }}>{(field) => <label className="text-xs font-bold">Nombre<input name="nombre" minLength={2} maxLength={100} required value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} className={fieldClass} /></label>}</form.Field>
    <form.Field name="descripcion">{(field) => <label className="text-xs font-bold">Descripción<input name="descripcion" maxLength={500} value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} className={fieldClass} /></label>}</form.Field>
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>{([canSubmit, isSubmitting]) => <button className={`${button} self-end`} disabled={!canSubmit || isSubmitting || pending}>{pending || isSubmitting ? 'Guardando…' : category ? 'Guardar edición' : 'Crear categoría'}</button>}</form.Subscribe>
    {error && <p role="alert" className="text-sm text-[#9b3f28] sm:col-span-3">{error}</p>}{category && <button type="button" className="text-xs text-ink/55 underline sm:col-span-3" onClick={onCancel}>Cancelar edición</button>}
  </form>
}

const categoryColumn = createColumnHelper<Category>()
export function AdminCategoriesPage() {
  const queryClient = useQueryClient()
  const notify = useNotificationStore((state) => state.showNotification)
  const categories = useQuery({ queryKey: ['categories'], queryFn: storeApi.categories })
  const [editing, setEditing] = useState<Category | null>(null)
  const save = useMutation({
    mutationFn: ({ category, payload }: { category: Category | null; payload: { nombre: string; descripcion: string | null } }) => category ? storeApi.updateCategory(category.id, payload) : storeApi.createCategory(payload),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['categories'] }); await queryClient.invalidateQueries({ queryKey: ['products'] }); setEditing(null); notify('Categoría guardada.') },
  })
  const deactivate = useMutation({
    mutationFn: storeApi.deactivateCategory,
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['categories'] }); await queryClient.invalidateQueries({ queryKey: ['products'] }); notify('Categoría dada de baja.') },
  })
  const columns = useMemo<ColumnDef<Category>[]>(() => [
    categoryColumn.accessor('nombre', { header: 'Categoría', cell: (info) => <span className="font-bold">{info.getValue()}</span> }),
    categoryColumn.accessor('descripcion', { header: 'Descripción', cell: (info) => info.getValue() || '—' }),
    categoryColumn.accessor((row) => row.activo ? 'Activa' : 'Inactiva', { id: 'estado', header: 'Estado' }),
    categoryColumn.display({ id: 'acciones', header: 'Acciones', cell: ({ row }) => row.original.activo ? <div className="flex gap-2"><button className={borderButton} onClick={() => setEditing(row.original)}>Editar</button><button className="rounded-full border border-coral/30 px-3 py-2 text-[10px] font-bold text-[#a34e35]" onClick={() => { if (window.confirm(`¿Dar de baja «${row.original.nombre}»? Sus productos permanecerán activos hasta darlos de baja individualmente.`)) deactivate.mutate(row.original.id) }}>Dar de baja</button></div> : <span className="text-xs text-ink/45">Baja lógica</span> }),
  ], [deactivate])
  return <main className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest">Administración · Catálogo</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Categorías</h1><p className="mt-2 text-sm text-ink/55">La baja lógica conserva el nombre y no retira por sí sola los productos.</p>
    <CategoryEditor key={editing?.id ?? 'new'} category={editing} pending={save.isPending} error={save.error ? messageFrom(save.error) : null} onSave={(payload) => save.mutateAsync({ category: editing, payload }).then(() => undefined)} onCancel={() => { setEditing(null); save.reset() }} />
    <section className="mt-5"><DataTable data={categories.data ?? []} columns={columns} loading={categories.isLoading} error={categories.error ? messageFrom(categories.error) : deactivate.error ? messageFrom(deactivate.error) : null} emptyMessage="Todavía no hay categorías." onRetry={() => void categories.refetch()} /></section>
  </main>
}
