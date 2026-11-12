import type { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}

export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <section className="relative isolate overflow-hidden rounded-[2rem] bg-forest px-6 py-8 text-white sm:px-10 sm:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 -z-10 size-80 rounded-full border border-white/10" />
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/65">{eyebrow}</p>
      <div className="mt-3 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-2xl"><h1 className="text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">{title}</h1><p className="mt-3 text-sm leading-6 text-white/70">{description}</p></div>
        {action}
      </div>
    </section>
  )
}
