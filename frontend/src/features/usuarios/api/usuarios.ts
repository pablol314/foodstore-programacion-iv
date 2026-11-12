import { api } from '@/shared/api/api'
import type { User } from '@/shared/types/foodstore'

export const usuariosApi = {
  async list(): Promise<User[]> { return (await api.get<User[]>('/admin/usuarios')).data },
  async setDisabled(id: number, disabled: boolean): Promise<User> {
    const action = disabled ? 'desactivar' : 'activar'
    return (await api.post<User>(`/admin/usuarios/${id}/${action}`)).data
  },
}
