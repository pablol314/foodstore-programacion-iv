import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { Product } from '@/shared/types/foodstore'

export interface CartLine {
  product: Product
  quantity: number
}

interface CartState {
  items: CartLine[]
  add: (product: Product) => void
  setQuantity: (productId: number, quantity: number) => void
  remove: (productId: number) => void
  clear: () => void
}

export const useCartStore = create<CartState>()(persist(
  (set) => ({
    items: [],
    add: (product) => set((state) => {
      const existing = state.items.find((line) => line.product.id === product.id)
      if (existing) return { items: state.items.map((line) => line.product.id === product.id ? { ...line, product, quantity: Math.min(line.quantity + 1, product.stock) } : line) }
      return { items: [...state.items, { product, quantity: 1 }] }
    }),
    setQuantity: (productId, quantity) => set((state) => ({ items: quantity <= 0 ? state.items.filter((line) => line.product.id !== productId) : state.items.map((line) => line.product.id === productId ? { ...line, quantity: Math.min(quantity, line.product.stock) } : line) })),
    remove: (productId) => set((state) => ({ items: state.items.filter((line) => line.product.id !== productId) })),
    clear: () => set({ items: [] }),
  }),
  { name: 'foodstore-cart', storage: createJSONStorage(() => localStorage), partialize: (state) => ({ items: state.items }) },
))
