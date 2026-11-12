import { api } from '@/shared/api/api'
import type { Category } from '@/shared/types/foodstore'

export const categoriasApi = {
  async list(): Promise<Category[]> { return (await api.get<Category[]>('/categorias')).data },
  async create(payload: { nombre: string; descripcion: string | null }): Promise<Category> {
    return (await api.post<Category>('/categorias', payload)).data
  },
  async update(id: number, payload: Partial<Category>): Promise<Category> {
    return (await api.put<Category>(`/categorias/${id}`, payload)).data
  },
  async deactivate(id: number): Promise<void> { await api.delete(`/categorias/${id}`) },
}
