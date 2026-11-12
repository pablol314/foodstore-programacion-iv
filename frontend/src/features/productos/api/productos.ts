import { api } from '@/shared/api/api'
import type { Product, ProductPage, ProductPayload } from '@/shared/types/foodstore'

export const productosApi = {
  async list(params: {
    skip: number
    limit: number
    search?: string
    categoria_id?: number
    disponible?: boolean
  }): Promise<ProductPage> {
    return (await api.get<ProductPage>('/productos', { params })).data
  },
  async create(payload: ProductPayload): Promise<Product> { return (await api.post<Product>('/productos', payload)).data },
  async update(id: number, payload: Partial<ProductPayload>): Promise<Product> {
    return (await api.put<Product>(`/productos/${id}`, payload)).data
  },
  async updateStock(id: number, payload: { stock?: number; disponible?: boolean }): Promise<Product> {
    return (await api.patch<Product>(`/productos/${id}/stock`, payload)).data
  },
  async deactivate(id: number): Promise<void> { await api.delete(`/productos/${id}`) },
}
