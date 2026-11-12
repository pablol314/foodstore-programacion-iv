import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuthStore } from '@/store/authStore'
import { DataTable } from '@/shared/components/DataTable'
import { messageFrom, storeApi } from '@/shared/api/foodstore'
import { useNotificationStore } from '@/store/notificationStore'
import type { User } from '@/shared/types/foodstore'

const borderButton = 'rounded-full border border-ink/15 px-4 py-2.5 text-xs font-bold text-forest disabled:opacity-45'

const userColumn = createColumnHelper<User>()
export function AdminUsersPage() {
  const queryClient = useQueryClient()
  const notify = useNotificationStore((state) => state.showNotification)
  const currentUser = useAuthStore((state) => state.user)
  const users = useQuery({ queryKey: ['admin-users'], queryFn: storeApi.users })
  const change = useMutation({
    mutationFn: ({ id, disabled }: { id: number; disabled: boolean }) => storeApi.setUserDisabled(id, disabled),
    onSuccess: async (_, variables) => { await queryClient.invalidateQueries({ queryKey: ['admin-users'] }); notify(variables.disabled ? 'Cuenta desactivada.' : 'Cuenta activada.') },
  })
  const columns = useMemo<ColumnDef<User>[]>(() => [
    userColumn.accessor('full_name', { header: 'Nombre', cell: (info) => <span className="font-bold">{info.getValue()}</span> }),
    userColumn.accessor('username', { header: 'Usuario' }),
    userColumn.accessor('email', { header: 'Correo' }),
    userColumn.accessor('role', { header: 'Rol', cell: (info) => info.getValue() === 'admin' ? 'Administrador' : 'Cliente' }),
    userColumn.accessor((user) => user.disabled ? 'Desactivada' : 'Activa', { id: 'estado', header: 'Estado' }),
    userColumn.display({ id: 'acciones', header: 'Acciones', cell: ({ row }) => row.original.id === currentUser?.id ? <span className="text-xs text-ink/45">Sesión actual</span> : <button className={borderButton} onClick={() => change.mutate({ id: row.original.id, disabled: !row.original.disabled })}>{row.original.disabled ? 'Activar' : 'Desactivar'}</button> }),
  ], [change, currentUser?.id])
  return <main className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest">Administración · Accesos</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Usuarios</h1><p className="mt-2 text-sm text-ink/55">Activá o desactivá cuentas sin borrar su historial. No se puede desactivar la cuenta de la sesión actual.</p><section className="mt-7"><DataTable data={users.data ?? []} columns={columns} loading={users.isLoading} error={users.error ? messageFrom(users.error) : change.error ? messageFrom(change.error) : null} emptyMessage="Todavía no hay usuarios registrados." onRetry={() => void users.refetch()} /></section></main>
}
