import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from '@tanstack/react-form'
import { Link, useNavigate } from 'react-router-dom'

import { useNotificationStore } from '@/store/notificationStore'
import { messageFrom, storeApi } from '@/shared/api/foodstore'
import { useCartStore } from '@/features/cart/store'

const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })
const fieldClass = 'field mt-1.5'

export function CartPage() {
  const items = useCartStore((state) => state.items)
  const setQuantity = useCartStore((state) => state.setQuantity)
  const remove = useCartStore((state) => state.remove)
  const clear = useCartStore((state) => state.clear)
  const notify = useNotificationStore((state) => state.showNotification)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const total = items.reduce((sum, line) => sum + line.product.precio * line.quantity, 0)
  const checkout = useMutation({
    mutationFn: storeApi.createOrder,
    onSuccess: (order) => {
      clear()
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      notify(`Pedido #${order.id} confirmado.`)
      navigate('/orders')
    },
  })
  const form = useForm({
    defaultValues: { direccion_entrega: '', forma_pago: 'EFECTIVO' as 'EFECTIVO' | 'TRANSFERENCIA', notas: '' },
    onSubmit: async ({ value }) => {
      await checkout.mutateAsync({
        ...value,
        notas: value.notas.trim() || null,
        items: items.map((line) => ({ producto_id: line.product.id, cantidad: line.quantity })),
      })
    },
  })

  if (items.length === 0) return <main className="mx-auto max-w-5xl px-5 py-16 text-center"><p className="text-5xl">🧺</p><h1 className="mt-4 text-3xl font-semibold">Tu carrito está vacío</h1><p className="mt-2 text-sm text-ink/55">Sumá productos del catálogo para iniciar tu pedido.</p><Link className="mt-6 inline-flex rounded-full bg-forest px-5 py-3 text-xs font-bold text-white" to="/">Ver catálogo</Link></main>

  return <main className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8 sm:pt-11 lg:px-10"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest">Compra segura · Stock confirmado al enviar</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Tu pedido</h1>
    <div className="mt-7 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
      <section className="space-y-3">{items.map((line) => <article key={line.product.id} className="flex items-center gap-4 rounded-3xl border border-ink/10 bg-white p-4"><div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-moss text-3xl">🥬</div><div className="min-w-0 flex-1"><h2 className="truncate font-bold">{line.product.nombre}</h2><p className="mt-1 text-xs text-ink/55">{money.format(line.product.precio)} por unidad</p><div className="mt-3 flex items-center gap-2"><button aria-label={`Restar ${line.product.nombre}`} onClick={() => setQuantity(line.product.id, line.quantity - 1)} className="grid size-7 place-items-center rounded-full border border-ink/15">−</button><span className="w-7 text-center text-sm font-bold">{line.quantity}</span><button aria-label={`Sumar ${line.product.nombre}`} onClick={() => setQuantity(line.product.id, line.quantity + 1)} disabled={line.quantity >= line.product.stock} className="grid size-7 place-items-center rounded-full border border-ink/15 disabled:opacity-40">+</button><button onClick={() => remove(line.product.id)} className="ml-2 text-xs font-bold text-[#a34e35] underline">Quitar</button></div></div><p className="text-sm font-extrabold">{money.format(line.product.precio * line.quantity)}</p></article>)}</section>
      <section className="rounded-3xl border border-ink/10 bg-white p-5 sm:p-7"><div className="flex justify-between border-b border-ink/10 pb-4 text-sm"><span className="text-ink/60">Total</span><strong className="text-xl">{money.format(total)}</strong></div>
        <form className="mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); void form.handleSubmit() }}>
          <form.Field name="direccion_entrega" validators={{ onChange: ({ value }) => value.trim().length < 5 ? 'Ingresá una dirección de al menos 5 caracteres.' : undefined }}>
            {(field) => <label className="block text-xs font-bold">Dirección de entrega<input className={fieldClass} value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} placeholder="Calle, número, localidad" /></label>}
          </form.Field>
          <form.Field name="forma_pago">{(field) => <label className="block text-xs font-bold">Forma de pago<select className={fieldClass} value={field.state.value} onChange={(event) => field.handleChange(event.target.value as 'EFECTIVO' | 'TRANSFERENCIA')}><option value="EFECTIVO">Efectivo</option><option value="TRANSFERENCIA">Transferencia</option></select></label>}</form.Field>
          <form.Field name="notas">{(field) => <label className="block text-xs font-bold">Notas para el pedido <span className="font-normal text-ink/50">(opcional)</span><textarea className={`${fieldClass} min-h-20 resize-y`} value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} maxLength={1000} /></label>}</form.Field>
          {checkout.error && <p role="alert" className="rounded-xl bg-[#f8ece7] p-3 text-sm text-[#9b3f28]">{messageFrom(checkout.error)}</p>}
          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>{([canSubmit, isSubmitting]) => <button type="submit" disabled={!canSubmit || isSubmitting || checkout.isPending} className="w-full rounded-full bg-forest px-5 py-3.5 text-xs font-extrabold text-white disabled:opacity-50">{isSubmitting || checkout.isPending ? 'Confirmando…' : 'Confirmar pedido'}</button>}</form.Subscribe>
        </form><p className="mt-4 text-[10px] leading-5 text-ink/45">El pedido se guarda junto con sus productos y el descuento de stock en una operación única. Si algún artículo no tiene stock suficiente, no se confirma ningún cambio.</p>
      </section>
    </div>
  </main>
}
