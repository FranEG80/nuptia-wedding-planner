import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Heart, LayoutDashboard } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="relative flex min-h-svh flex-col overflow-hidden bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-36 top-24 h-80 w-80 rounded-full bg-accent/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl"
      />

      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 sm:px-8 sm:py-8">
        <Link
          href="/"
          className="group flex w-fit items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-accent transition-transform duration-300 group-hover:scale-105">
            <Heart className="h-5 w-5 fill-current" aria-hidden="true" />
          </span>
          <span className="font-serif text-2xl text-foreground">Nuptia</span>
        </Link>

        <span className="hidden text-xs uppercase tracking-[0.2em] text-muted-foreground sm:block">
          Estudio de bodas digital
        </span>
      </header>

      <section className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 items-center gap-12 px-5 pb-12 pt-6 sm:px-8 sm:pb-16 lg:grid-cols-[minmax(0,0.92fr)_minmax(400px,0.78fr)] lg:gap-20 lg:py-12">
        <div className="mx-auto w-full max-w-2xl lg:mx-0">
          <div className="mb-7 flex items-center gap-3">
            <span className="h-px w-10 bg-accent" aria-hidden="true" />
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
              Error 404 · Página no encontrada
            </p>
          </div>

          <h1 className="max-w-xl font-serif text-5xl leading-[1.05] tracking-[-0.035em] text-foreground sm:text-6xl lg:text-7xl">
            Este enlace se ha perdido por el camino.
          </h1>

          <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            La página que buscas no existe, ha cambiado de dirección o ya no está
            disponible. Vuelve al inicio para seguir preparando cada detalle.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/85 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              <ArrowLeft
                className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
                aria-hidden="true"
              />
              Volver al inicio
            </Link>
            <Link
              href="/app"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 text-sm font-medium text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-muted hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              <LayoutDashboard className="h-4 w-4 text-accent" aria-hidden="true" />
              Ir al panel
            </Link>
          </div>

          <p className="mt-8 text-xs uppercase tracking-[0.16em] text-muted-foreground/75">
            Invitaciones · invitados · web de boda
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-[520px] lg:mx-0 lg:justify-self-end">
          <div
            aria-hidden="true"
            className="absolute -inset-4 rounded-t-[15rem] rounded-b-[2.25rem] border border-accent/20 sm:-inset-5"
          />

          <div className="relative aspect-[4/5] overflow-hidden rounded-t-[14rem] rounded-b-3xl border border-border bg-card shadow-2xl shadow-primary/10">
            <Image
              src="/images/invite-floral.webp"
              alt=""
              fill
              priority
              sizes="(min-width: 1024px) 42vw, (min-width: 640px) 520px, 90vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-card/10 via-card/5 to-primary/15" />

            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="flex aspect-square w-[72%] max-w-[320px] flex-col items-center justify-center rounded-full border border-primary/15 bg-card/75 shadow-xl shadow-primary/10 backdrop-blur-sm">
                <Heart
                  className="mb-3 h-5 w-5 fill-accent text-accent"
                  aria-hidden="true"
                />
                <p className="font-serif text-[clamp(4.75rem,15vw,8.5rem)] leading-none tracking-[-0.08em] text-primary">
                  404
                </p>
                <span className="mt-2 text-[0.65rem] uppercase tracking-[0.24em] text-muted-foreground">
                  Fuera de ruta
                </span>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-5 left-5 right-5 flex items-center justify-between rounded-2xl border border-border bg-card/95 px-5 py-4 shadow-lg shadow-primary/10 backdrop-blur-sm sm:left-10 sm:right-auto sm:min-w-64">
            <div>
              <p className="font-serif text-lg text-foreground">Siempre hay un camino</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Te llevamos de vuelta a Nuptia.</p>
            </div>
            <span className="ml-4 h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
          </div>
        </div>
      </section>
    </main>
  )
}
