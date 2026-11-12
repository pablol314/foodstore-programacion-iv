import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { useNotificationStore } from '@/store/notificationStore'
import { PageHeader } from '@/shared/components/PageHeader'
import { messageFrom, storeApi } from '@/shared/api/foodstore'
import { useCartStore } from '@/features/cart/store'
import type { Product } from '@/shared/types/foodstore'

const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })

export function CatalogPage() {
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>()
  const [page, setPage] = useState(1)
  const add = useCartStore((state) => state.add)
  const notify = useNotificationStore((state) => state.showNotification)
  const categories = useQuery({ queryKey: ['categories'], queryFn: storeApi.categories })
  const products = useQuery({ queryKey: ['products', page, search, categoryId], queryFn: () => storeApi.products({ page, page_size: 12, search: search || undefined, category_id: categoryId }) })

  function addToCart(product: Product) {
    add(product)
    notify(`${product.nombre} se agregó al carrito.`)
  }

  return <main className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8 sm:pt-11 lg:px-10">
    <PageHeader eyebrow="Almacén online · Catálogo" title="Lo fresco, cerca tuyo." description="Elegí tus productos, armá el pedido y recibilo en tu domicilio. El stock se confirma al finalizar la compra." />
    <section className="mt-7 grid gap-3 rounded-3xl border border-ink/10 bg-white p-4 sm:grid-cols-[1fr_15rem] sm:p-5">
      <label className="text-xs font-bold">Buscar productos<input className="field mt-1.5" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Ej.: manzanas" /></label>
      <label className="text-xs font-bold">Categoría<select className="field mt-1.5" value={categoryId ?? ''} onChange={(event) => { setCategoryId(event.target.value ? Number(event.target.value) : undefined); setPage(1) }}><option value="">Todas</option>{(categories.data ?? []).map((category) => <option key={category.id} value={category.id}>{category.nombre}</option>)}</select></label>
    </section>
    {products.isLoading ? <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true" role="status">{Array.from({ length: 8 }, (_, i) => <div key={i} className="h-64 animate-pulse rounded-3xl bg-white" />)}</div> : products.error ? <div role="alert" className="mt-7 rounded-2xl bg-[#f8ece7] p-5 text-[#9b3f28]">No se pudo cargar el catálogo: {messageFrom(products.error)} <button className="ml-3 underline" onClick={() => void products.refetch()}>Reintentar</button></div> : products.data?.items.length === 0 ? <p className="mt-7 rounded-3xl border border-dashed border-ink/20 px-5 py-16 text-center text-sm text-ink/55">No encontramos productos con esos filtros.</p> : <>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{products.data?.items.map((product) => <article key={product.id} className="flex flex-col overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-sm">
        <div className="grid aspect-[4/3] place-items-center overflow-hidden bg-gradient-to-br from-moss to-paper text-5xl">{product.imagen_url ? <img src={product.imagen_url} alt={product.nombre} loading="lazy" className="h-full w-full object-cover" /> : <span aria-hidden="true">🥬</span>}</div>
        <div className="flex flex-1 flex-col p-5"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-forest">{product.categoria_nombre}</p><h2 className="mt-2 text-lg font-bold">{product.nombre}</h2><p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-ink/55">{product.descripcion}</p><div className="mt-auto flex items-end justify-between gap-3 pt-5"><div><p className="text-xl font-extrabold">{money.format(product.precio)}</p><p className="mt-1 text-[10px] text-ink/50">Stock: {product.stock}</p></div><button type="button" disabled={!product.disponible || product.stock < 1} onClick={() => addToCart(product)} className="rounded-full bg-forest px-4 py-2.5 text-[11px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Agregar</button></div></div>
      </article>)}</div>
      <div className="mt-7 flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-xs"><span>{products.data?.total ?? 0} productos</span><div className="flex gap-2"><button className="rounded-full border border-ink/10 px-4 py-2 font-bold disabled:opacity-40" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Anterior</button><span className="px-2 py-2">Página {page} de {Math.max(1, Math.ceil((products.data?.total ?? 0) / 12))}</span><button className="rounded-full border border-ink/10 px-4 py-2 font-bold disabled:opacity-40" disabled={page * 12 >= (products.data?.total ?? 0)} onClick={() => setPage((value) => value + 1)}>Siguiente</button></div></div>
    </>}
  </main>
}
