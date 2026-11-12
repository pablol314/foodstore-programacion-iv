import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Link, useNavigate } from 'react-router-dom'

import { useNotificationStore } from '@/store/notificationStore'
import { messageFrom, storeApi } from '@/shared/api/foodstore'
import { useSessionStore } from '@/features/auth/store'

const fieldClass = 'field mt-1.5'
const buttonClass = 'rounded-full bg-forest px-5 py-3 text-xs font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'

export function LoginPage() {
  const navigate = useNavigate()
  const setUser = useSessionStore((state) => state.setUser)
  const [error, setError] = useState<string | null>(null)
  const form = useForm({
    defaultValues: { username: '', password: '' },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        await storeApi.login(value.username, value.password)
        setUser(await storeApi.me())
        navigate('/', { replace: true })
      } catch (cause) { setError(messageFrom(cause)) }
    },
  })
  return <main className="mx-auto grid min-h-[75vh] max-w-6xl place-items-center px-5 py-10">
    <section className="w-full max-w-md rounded-[2rem] border border-ink/10 bg-white p-7 shadow-sm sm:p-9">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest">FoodStore · Tu mercado</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Ingresar</h1>
      <p className="mt-2 text-sm text-ink/60">Accedé a tu cuenta para comprar y consultar tus pedidos.</p>
      <form className="mt-7 space-y-4" onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); void form.handleSubmit() }}>
        <form.Field name="username" validators={{ onChange: ({ value }) => value.trim() ? undefined : 'Ingresá tu usuario o correo.' }}>
          {(field) => <label className="block text-xs font-bold">Usuario o correo<input className={fieldClass} autoComplete="username" value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} /></label>}
        </form.Field>
        <form.Field name="password" validators={{ onChange: ({ value }) => value ? undefined : 'Ingresá tu contraseña.' }}>
          {(field) => <label className="block text-xs font-bold">Contraseña<input className={fieldClass} type="password" autoComplete="current-password" value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} /></label>}
        </form.Field>
        {error && <p role="alert" className="rounded-xl bg-[#f8ece7] p-3 text-sm text-[#9b3f28]">{error}</p>}
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, isSubmitting]) => <button className={`${buttonClass} w-full`} disabled={!canSubmit || isSubmitting} type="submit">{isSubmitting ? 'Ingresando…' : 'Ingresar'}</button>}
        </form.Subscribe>
      </form>
      <p className="mt-6 text-center text-sm text-ink/60">¿Todavía no tenés cuenta? <Link className="font-bold text-forest underline" to="/register">Crear cuenta</Link></p>
    </section>
  </main>
}

export function RegisterPage() {
  const navigate = useNavigate()
  const setUser = useSessionStore((state) => state.setUser)
  const notify = useNotificationStore((state) => state.showNotification)
  const [error, setError] = useState<string | null>(null)
  const form = useForm({
    defaultValues: { username: '', full_name: '', email: '', password: '' },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        await storeApi.register(value)
        await storeApi.login(value.username, value.password)
        setUser(await storeApi.me())
        notify('Cuenta creada. ¡Bienvenido a FoodStore!')
        navigate('/', { replace: true })
      } catch (cause) { setError(messageFrom(cause)) }
    },
  })
  return <main className="mx-auto grid min-h-[75vh] max-w-6xl place-items-center px-5 py-10">
    <section className="w-full max-w-lg rounded-[2rem] border border-ink/10 bg-white p-7 shadow-sm sm:p-9">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest">FoodStore · Cuenta nueva</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Crear cuenta</h1>
      <form className="mt-7 space-y-4" onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); void form.handleSubmit() }}>
        {([
          ['full_name', 'Nombre y apellido', 'text'], ['username', 'Usuario', 'text'], ['email', 'Correo electrónico', 'email'], ['password', 'Contraseña (8 caracteres mínimo)', 'password'],
        ] as const).map(([name, label, type]) => <form.Field key={name} name={name} validators={{ onChange: ({ value }) => {
          if (!value.trim()) return 'Este campo es obligatorio.'
          if (name === 'password' && value.length < 8) return 'Usá al menos 8 caracteres.'
          if (name === 'email' && !/^\S+@\S+\.\S+$/.test(value)) return 'Ingresá un correo válido.'
          return undefined
        } }}>
          {(field) => <label className="block text-xs font-bold">{label}<input className={fieldClass} type={type} autoComplete={name === 'password' ? 'new-password' : undefined} value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} /></label>}
        </form.Field>)}
        {error && <p role="alert" className="rounded-xl bg-[#f8ece7] p-3 text-sm text-[#9b3f28]">{error}</p>}
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, isSubmitting]) => <button className={`${buttonClass} w-full`} disabled={!canSubmit || isSubmitting} type="submit">{isSubmitting ? 'Creando…' : 'Crear cuenta'}</button>}
        </form.Subscribe>
      </form>
      <p className="mt-6 text-center text-sm text-ink/60">¿Ya tenés cuenta? <Link className="font-bold text-forest underline" to="/login">Ingresar</Link></p>
    </section>
  </main>
}
