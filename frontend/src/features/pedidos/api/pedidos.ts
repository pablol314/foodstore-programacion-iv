import { api } from '@/shared/api/api'
import type { AdminSummary, Order, OrderPage } from '@/shared/types/foodstore'

export const pedidosApi = {
  async create(payload: {
    items: { producto_id: number; cantidad: number }[]
    forma_pago: 'EFECTIVO' | 'TRANSFERENCIA'
    direccion_entrega: string
    notas: string | null
  }): Promise<Order> { return (await api.post<Order>('/pedidos', payload)).data },
  async list(estado?: Order['estado']): Promise<Order[]> {
    const params = { skip: 0, limit: 100, ...(estado ? { estado } : {}) }
    return (await api.get<OrderPage>('/pedidos', { params })).data.items
  },
  async get(id: number): Promise<Order> { return (await api.get<Order>(`/pedidos/${id}`)).data },
  async cancel(id: number): Promise<Order> { return (await api.patch<Order>(`/pedidos/${id}/cancelar`)).data },
  async summary(): Promise<AdminSummary> { return (await api.get<AdminSummary>('/pedidos/resumen')).data },
  async setState(id: number, estado: Order['estado']): Promise<Order> {
    return (await api.patch<Order>(`/pedidos/${id}/estado`, { estado })).data
  },
}
