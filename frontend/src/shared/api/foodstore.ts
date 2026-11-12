import axios from 'axios'

import { api } from '@/shared/api/api'
import type { AdminSummary, Category, Order, Product, ProductPage, ProductPayload, User } from '@/shared/types/foodstore'

const normalizeProduct = (product: Product): Product => ({ ...product, precio: Number(product.precio) })
const normalizeProductPage = (page: ProductPage): ProductPage => ({ ...page, items: page.items.map(normalizeProduct) })
const normalizeOrder = (order: Order): Order => ({
  ...order,
  total: Number(order.total),
  items: order.items.map((item) => ({ ...item, precio_unitario: Number(item.precio_unitario), subtotal: Number(item.subtotal) })),
})

export function messageFrom(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail: unknown = error.response?.data?.detail
    return typeof detail === 'string' ? detail : error.message
  }
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.'
}

export const storeApi = {
  async login(username: string, password: string): Promise<void> {
    const body = new URLSearchParams({ username, password })
    await api.post('/auth/token', body, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
  },
  async register(payload: { username: string; full_name: string; email: string; password: string }): Promise<User> {
    return (await api.post<User>('/auth/register', payload)).data
  },
  async me(): Promise<User> { return (await api.get<User>('/auth/me')).data },
  async logout(): Promise<void> { await api.post('/auth/logout') },
  async categories(): Promise<Category[]> { return (await api.get<Category[]>('/categories')).data },
  async products(params: { page: number; page_size: number; search?: string; category_id?: number }): Promise<ProductPage> {
    return normalizeProductPage((await api.get<ProductPage>('/products', { params })).data)
  },
  async createOrder(payload: { items: { producto_id: number; cantidad: number }[]; forma_pago: string; direccion_entrega: string; notas: string | null }): Promise<Order> {
    return normalizeOrder((await api.post<Order>('/orders', payload)).data)
  },
  async orders(): Promise<Order[]> { return (await api.get<Order[]>('/orders')).data.map(normalizeOrder) },
  async cancelOrder(id: number): Promise<Order> { return normalizeOrder((await api.post<Order>(`/orders/${id}/cancel`)).data) },
  async summary(): Promise<AdminSummary> {
    const summary = (await api.get<AdminSummary>('/admin/summary')).data
    return { ...summary, ventas_entregadas_hoy: Number(summary.ventas_entregadas_hoy) }
  },
  async adminProducts(): Promise<ProductPage> { return normalizeProductPage((await api.get<ProductPage>('/products', { params: { page: 1, page_size: 100 } })).data) },
  async createProduct(payload: ProductPayload): Promise<Product> { return normalizeProduct((await api.post<Product>('/products', payload)).data) },
  async updateProduct(id: number, payload: Partial<ProductPayload>): Promise<Product> { return normalizeProduct((await api.patch<Product>(`/products/${id}`, payload)).data) },
  async updateStock(id: number, payload: { stock?: number; disponible?: boolean }): Promise<Product> { return normalizeProduct((await api.patch<Product>(`/products/${id}/stock`, payload)).data) },
  async deactivateProduct(id: number): Promise<void> { await api.delete(`/products/${id}`) },
  async createCategory(payload: { nombre: string; descripcion: string | null }): Promise<Category> { return (await api.post<Category>('/categories', payload)).data },
  async updateCategory(id: number, payload: Partial<Category>): Promise<Category> { return (await api.patch<Category>(`/categories/${id}`, payload)).data },
  async deactivateCategory(id: number): Promise<Category> { return (await api.delete<Category>(`/categories/${id}`)).data },
  async adminOrders(): Promise<Order[]> { return (await api.get<Order[]>('/admin/orders')).data.map(normalizeOrder) },
  async setOrderState(id: number, estado: Order['estado']): Promise<Order> { return normalizeOrder((await api.patch<Order>(`/admin/orders/${id}/state`, { estado })).data) },
  async users(): Promise<User[]> { return (await api.get<User[]>('/admin/users')).data },
  async setUserDisabled(id: number, disabled: boolean): Promise<User> {
    return (await api.patch<User>(`/admin/users/${id}/disabled`, null, { params: { disabled } })).data
  },
}
