import { Link } from 'react-router-dom'

import { useCartStore } from '@/features/cart/store'

const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })

export function CartPage() {
  const items = useCartStore((state) => state.items)
  const setQuantity = useCartStore((state) => state.setQuantity)
  const remove = useCartStore((state) => state.remove)
  const total = items.reduce((sum, line) => sum + line.product.precio_base * line.quantity, 0)

  if (items.length === 0) return <main className="mx-auto max-w-5xl px-5 py-16 text-center"><p className="text-5xl">🧺</p><h1 className="mt-4 text-3xl font-semibold">Tu carrito está vacío</h1><p className="mt-2 text-sm text-ink/55">Sumá productos del catálogo para iniciar tu pedido.</p><Link className="mt-6 inline-flex rounded-full bg-forest px-5 py-3 text-xs font-bold text-white" to="/">Ver catálogo</Link></main>

  return <main className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest">Compra segura · Stock confirmado al enviar</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Tu carrito</h1>
    <div className="mt-7 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
      <section className="space-y-3">{items.map((line) => <article key={line.product.id} className="flex items-center gap-4 rounded-3xl border border-ink/10 bg-white p-4"><div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-moss text-3xl">🥬</div><div className="min-w-0 flex-1"><h2 className="truncate font-bold">{line.product.nombre}</h2><p className="mt-1 text-xs text-ink/55">{money.format(line.product.precio_base)} por unidad</p><div className="mt-3 flex items-center gap-2"><button aria-label={`Restar ${line.product.nombre}`} onClick={() => setQuantity(line.product.id, line.quantity - 1)} className="grid size-7 place-items-center rounded-full border border-ink/15">−</button><span className="w-7 text-center text-sm font-bold">{line.quantity}</span><button aria-label={`Sumar ${line.product.nombre}`} onClick={() => setQuantity(line.product.id, line.quantity + 1)} disabled={line.quantity >= line.product.stock} className="grid size-7 place-items-center rounded-full border border-ink/15 disabled:opacity-40">+</button><button onClick={() => remove(line.product.id)} className="ml-2 text-xs font-bold text-[#a34e35] underline">Quitar</button></div></div><p className="text-sm font-extrabold">{money.format(line.product.precio_base * line.quantity)}</p></article>)}</section>
      <aside className="h-fit rounded-3xl border border-ink/10 bg-white p-5 sm:p-7"><div className="flex justify-between border-b border-ink/10 pb-4 text-sm"><span className="text-ink/60">Total estimado</span><strong className="text-xl">{money.format(total)}</strong></div><p className="mt-4 text-xs leading-5 text-ink/55">El precio y el stock se vuelven a validar cuando confirmás el pedido.</p><Link to="/checkout" className="mt-5 inline-flex w-full justify-center rounded-full bg-forest px-5 py-3.5 text-xs font-extrabold text-white">Continuar al checkout</Link><Link to="/" className="mt-3 inline-flex w-full justify-center text-xs font-bold text-forest underline">Seguir comprando</Link></aside>
    </div>
  </main>
}
