import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from '@tanstack/react-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { useCartStore } from '@/features/cart/store'
import { messageFrom, storeApi } from '@/shared/api/foodstore'

const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })
const fieldClass = 'field mt-1.5'

export function CheckoutPage() {
  const items = useCartStore((state) => state.items)
  const clear = useCartStore((state) => state.clear)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const total = items.reduce((sum, line) => sum + line.product.precio_base * line.quantity, 0)
  const checkout = useMutation({
    mutationFn: storeApi.createOrder,
    onSuccess: async (order) => {
      clear()
      await queryClient.invalidateQueries({ queryKey: ['orders'] })
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      navigate('/mis-pedidos', { replace: true, state: { createdOrderId: order.id } })
    },
  })
  const form = useForm({
    defaultValues: { direccion_entrega: '', forma_pago: 'EFECTIVO' as 'EFECTIVO' | 'TRANSFERENCIA', notas: '' },
    onSubmit: async ({ value }) => checkout.mutateAsync({
      ...value,
      direccion_entrega: value.direccion_entrega.trim(),
      notas: value.notas.trim() || null,
      items: items.map((line) => ({ producto_id: line.product.id, cantidad: line.quantity })),
    }),
  })

  if (items.length === 0) return <Navigate to="/carrito" replace />

  return <main className="mx-auto max-w-5xl px-5 pb-16 pt-8 sm:px-8"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest">Confirmación del pedido</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Checkout</h1><p className="mt-2 text-sm text-ink/55">Completá la dirección y elegí cómo vas a pagar.</p>
    <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_.8fr]">
      <form className="space-y-4 rounded-3xl border border-ink/10 bg-white p-5 sm:p-7" onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); void form.handleSubmit() }}>
        <form.Field name="direccion_entrega" validators={{ onChange: ({ value }) => value.trim().length < 5 ? 'Ingresá una dirección de al menos 5 caracteres.' : value.length > 200 ? 'La dirección no puede superar 200 caracteres.' : undefined }}>
          {(field) => <label className="block text-xs font-bold">Dirección de entrega<input className={fieldClass} value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} maxLength={200} placeholder="Calle, número, localidad" />{field.state.meta.errors[0] && <span className="mt-1 block text-xs font-normal text-[#9b3f28]">{field.state.meta.errors[0]}</span>}</label>}
        </form.Field>
        <form.Field name="forma_pago">{(field) => <label className="block text-xs font-bold">Forma de pago<select className={fieldClass} value={field.state.value} onChange={(event) => field.handleChange(event.target.value as 'EFECTIVO' | 'TRANSFERENCIA')}><option value="EFECTIVO">Efectivo</option><option value="TRANSFERENCIA">Transferencia</option></select></label>}</form.Field>
        <form.Field name="notas">{(field) => <label className="block text-xs font-bold">Notas para el pedido <span className="font-normal text-ink/50">(opcional)</span><textarea className={`${fieldClass} min-h-20 resize-y`} value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} maxLength={1000} /></label>}</form.Field>
        {checkout.error && <p role="alert" className="rounded-xl bg-[#f8ece7] p-3 text-sm text-[#9b3f28]">{messageFrom(checkout.error)}</p>}
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>{([canSubmit, isSubmitting]) => <button type="submit" disabled={!canSubmit || isSubmitting || checkout.isPending} className="w-full rounded-full bg-forest px-5 py-3.5 text-xs font-extrabold text-white disabled:opacity-50">{isSubmitting || checkout.isPending ? 'Confirmando…' : 'Confirmar pedido'}</button>}</form.Subscribe>
      </form>
      <aside className="h-fit rounded-3xl border border-ink/10 bg-white p-5 sm:p-7"><h2 className="text-lg font-bold">Resumen</h2><div className="mt-4 space-y-3">{items.map((line) => <div key={line.product.id} className="flex justify-between gap-4 text-xs"><span>{line.quantity} × {line.product.nombre}</span><strong>{money.format(line.product.precio_base * line.quantity)}</strong></div>)}</div><div className="mt-5 flex justify-between border-t border-ink/10 pt-4"><span className="text-sm text-ink/60">Total</span><strong className="text-xl">{money.format(total)}</strong></div><p className="mt-4 text-[10px] leading-5 text-ink/45">El servidor confirma disponibilidad y stock dentro de la transacción antes de guardar el pedido.</p><Link to="/carrito" className="mt-5 inline-flex text-xs font-bold text-forest underline">Volver al carrito</Link></aside>
    </div>
  </main>
}
