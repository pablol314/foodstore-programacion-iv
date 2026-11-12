export interface User {
  id: number
  username: string
  full_name: string
  email: string
  role: 'user' | 'admin'
  disabled: boolean
  created_at: string
}

export interface Category {
  id: number
  nombre: string
  descripcion: string | null
  activo: boolean
}

export interface Product {
  id: number
  categoria_id: number
  categoria_nombre: string
  nombre: string
  descripcion: string | null
  precio: number
  imagen_url: string | null
  stock: number
  disponible: boolean
  activo: boolean
}

export interface ProductPage {
  items: Product[]
  total: number
  page: number
  page_size: number
}

export interface OrderItem {
  id: number
  producto_id: number
  cantidad: number
  nombre_producto: string
  precio_unitario: number
  subtotal: number
}

export interface Order {
  id: number
  usuario_id: number
  usuario_nombre: string
  estado: 'PENDIENTE' | 'EN_PREPARACION' | 'ENTREGADO' | 'CANCELADO'
  forma_pago: 'EFECTIVO' | 'TRANSFERENCIA'
  direccion_entrega: string
  notas: string | null
  total: number
  created_at: string
  updated_at: string
  items: OrderItem[]
}

export interface AdminSummary {
  pedidos_hoy: number
  ventas_entregadas_hoy: number
  pedidos_pendientes: number
  pedidos_en_preparacion: number
  pedidos_entregados: number
  productos_activos: number
  usuarios_activos: number
}

export interface ProductPayload {
  categoria_id: number
  nombre: string
  descripcion: string | null
  precio: number
  imagen_url: string | null
  stock: number
  disponible: boolean
}
