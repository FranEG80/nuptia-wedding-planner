"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"

import type { DashboardSummaryDto } from "@/domains/weddings/application/dtos/dashboard-summary.dto"
import type { WeddingDto } from "@/domains/weddings/application/dtos/wedding.dto"
import { DEFAULT_WEDDING_TASKS } from "@/domains/weddings/application/dtos/wedding-task.dto"
import { Progress } from "@/shared/components/ui/progress"
import {
  Mail,
  Globe,
  Users,
  CheckCircle2,
  ListChecks,
  ArrowRight,
  CalendarHeart,
} from "lucide-react"

function useCountdown(target: string) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const diff = Math.max(0, new Date(target).getTime() - now)
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return { days, hours, minutes, seconds }
}

export function DashboardView({
  summary,
  wedding,
}: {
  summary: DashboardSummaryDto
  wedding: WeddingDto
}) {
  const cd = useCountdown(wedding.date)
  const { confirmed, pending, declined, total } = summary
  const safeTotal = Math.max(total, 1)
  const confirmedPct = Math.round((confirmed / safeTotal) * 100)
  const pendingPct = Math.round((pending / safeTotal) * 100)
  const declinedPct = Math.max(0, 100 - confirmedPct - pendingPct)
  const pendingTasks = DEFAULT_WEDDING_TASKS.filter((t) => !t.done).length
  const welcomeName = wedding.displayName.replace(" & ", " y ")

  const cdItems = [
    { v: cd.days, l: "días" },
    { v: cd.hours, l: "horas" },
    { v: cd.minutes, l: "min" },
    { v: cd.seconds, l: "seg" },
  ]

  const formattedDate = new Date(wedding.date).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="space-y-8">
      {/* Hero / welcome */}
      <section className="relative h-72 overflow-hidden rounded-3xl border border-border shadow-sm sm:h-80">
        <Image
          src="/images/couple-hero.png"
          alt="Pareja de novios en un entorno natural"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 1152px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/85 via-primary/55 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center gap-3 p-8 text-primary-foreground sm:p-12">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-background/20 px-3 py-1 text-xs backdrop-blur-sm">
            <CalendarHeart className="h-3.5 w-3.5" />
            {formattedDate}
          </span>
          <h1 className="max-w-lg text-balance font-serif text-3xl leading-tight sm:text-4xl">
            ¡Bienvenidos, {welcomeName}!
          </h1>
          <p className="max-w-md text-sm text-primary-foreground/80">
            Vuestra historia se celebra en {wedding.primaryCity}. Aquí tenéis todo
            listo para brillar el gran día.
          </p>
        </div>
      </section>

      {/* Countdown */}
      <section className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <p className="font-serif text-lg text-muted-foreground">
          Cuenta atrás para el «sí, quiero»
        </p>
        <div className="mt-4 flex items-center justify-center gap-3 sm:gap-6">
          {cdItems.map((item, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary font-serif text-2xl text-secondary-foreground tabular-nums sm:h-20 sm:w-20 sm:text-3xl">
                {item.v === undefined ? "—" : String(item.v).padStart(2, "0")}
              </span>
              <span className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
                {item.l}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Widgets */}
      <section className="grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <span className="font-serif text-3xl text-foreground">{confirmedPct}%</span>
          </div>
          <p className="mt-4 text-sm font-medium text-foreground">Invitados confirmados</p>
          <p className="text-xs text-muted-foreground">
            {confirmed} de {total} invitaciones
          </p>
          <Progress value={confirmedPct} className="mt-3 h-2" />
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent">
              <ListChecks className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <span className="font-serif text-3xl text-foreground">{pendingTasks}</span>
          </div>
          <p className="mt-4 text-sm font-medium text-foreground">Tareas pendientes</p>
          <ul className="mt-3 space-y-2">
            {DEFAULT_WEDDING_TASKS.slice(0, 3).map((t) => (
              <li key={t.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span
                  className={
                    t.done
                      ? "h-1.5 w-1.5 rounded-full bg-primary"
                      : "h-1.5 w-1.5 rounded-full bg-accent"
                  }
                />
                <span className={t.done ? "line-through" : ""}>{t.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-foreground">Accesos rápidos</p>
          <div className="mt-4 space-y-2">
            {[
              { href: "/app/invitacion", label: "Editar invitación", icon: Mail },
              { href: "/app/web", label: "Configurar web", icon: Globe },
              { href: "/app/invitados", label: "Gestionar invitados", icon: Users },
            ].map((s) => {
              const Icon = s.icon
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  className="group flex w-full items-center justify-between rounded-lg bg-secondary/60 px-3 py-2.5 text-sm text-secondary-foreground transition-colors hover:bg-secondary"
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                    {s.label}
                  </span>
                  <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              )
            })}
          </div>
        </div>

        <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm md:col-span-3">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,18rem)_minmax(0,1fr)] lg:items-center lg:gap-10">
            <div className="flex h-full flex-col justify-between gap-6">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <Users className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium tracking-[0.16em] text-secondary-foreground">
                    RSVP
                  </span>
                </div>
                <h2 className="mt-5 max-w-xs text-balance font-serif text-2xl leading-tight text-foreground sm:text-3xl">
                  Confirmación de asistencia
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Una vista circular para comparar de un vistazo las respuestas de
                  vuestra lista de invitados.
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {declined} {declined === 1 ? "persona no asistirá" : "personas no asistirán"}
              </p>
            </div>

            <figure className="flex flex-col items-center">
              <div
                className="relative grid aspect-square w-full max-w-64 place-items-center"
                role="progressbar"
                aria-label={`${confirmed} de ${total} invitados confirmados`}
                aria-valuemin={0}
                aria-valuemax={total}
                aria-valuenow={confirmed}
              >
                <svg aria-hidden="true" className="h-full w-full -rotate-90" viewBox="0 0 120 120"><circle cx="60" cy="60" r="48" fill="none" stroke="currentColor" strokeWidth="12" className="text-muted" pathLength="100"/><circle cx="60" cy="60" r="48" fill="none" stroke="currentColor" strokeWidth="12" className="text-primary" strokeDasharray={`${confirmedPct} ${100 - confirmedPct}`} pathLength="100"/><circle cx="60" cy="60" r="48" fill="none" stroke="currentColor" strokeWidth="12" className="text-accent" strokeDasharray={`${pendingPct} ${100 - pendingPct}`} strokeDashoffset={-confirmedPct} pathLength="100"/></svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <strong className="font-serif text-4xl font-normal tabular-nums text-foreground sm:text-5xl">
                    {confirmed}
                  </strong>
                  <span className="mt-1 text-sm text-muted-foreground">
                    de {total} confirmados
                  </span>
                </div>
              </div>
              <figcaption className="sr-only">
                {confirmedPct}% confirmados, {pendingPct}% por confirmar y {declinedPct}% no asistirán.
              </figcaption>
            </figure>

            <div className="flex h-full flex-col justify-between gap-6">
              <dl className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-secondary/60 p-4">
                  <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                    Confirmados
                  </dt>
                  <dd className="mt-2 font-serif text-2xl text-foreground">
                    {confirmedPct}%
                  </dd>
                </div>
                <div className="rounded-2xl bg-accent/10 p-4">
                  <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                    Por confirmar
                  </dt>
                  <dd className="mt-2 font-serif text-2xl text-foreground">
                    {pendingPct}%
                  </dd>
                </div>
              </dl>
              <Link
                href="/app/invitados"
                className="group flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                Gestionar invitados
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </article>
      </section>
    </div>
  )
}
