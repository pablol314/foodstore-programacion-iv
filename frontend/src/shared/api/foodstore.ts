import { authApi } from '@/features/auth/api/auth'
import { categoriasApi } from '@/features/categorias/api/categorias'
import { pedidosApi } from '@/features/pedidos/api/pedidos'
import { productosApi } from '@/features/productos/api/productos'
import { usuariosApi } from '@/features/usuarios/api/usuarios'
import type { ProductPayload } from '@/shared/types/foodstore'
export { messageFrom } from './handleApiError'

export const storeApi = {
  login: authApi.login,
  register: authApi.register,
  me: authApi.me,
  logout: authApi.logout,
  categories: categoriasApi.list,
  createCategory: categoriasApi.create,
  updateCategory: categoriasApi.update,
  deactivateCategory: categoriasApi.deactivate,
  products: productosApi.list,
  async adminProducts() {
    return productosApi.list({ skip: 0, limit: 100 })
  },
  createProduct: productosApi.create,
  updateProduct: (id: number, payload: Partial<ProductPayload>) => productosApi.update(id, payload),
  updateStock: productosApi.updateStock,
  deactivateProduct: productosApi.deactivate,
  createOrder: pedidosApi.create,
  orders: () => pedidosApi.list(),
  cancelOrder: pedidosApi.cancel,
  adminOrders: pedidosApi.list,
  setOrderState: pedidosApi.setState,
  summary: pedidosApi.summary,
  users: usuariosApi.list,
  setUserDisabled: usuariosApi.setDisabled,
}
