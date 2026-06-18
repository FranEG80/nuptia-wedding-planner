"use client"

import { useState } from "react"
import { TIMELINE } from "@/lib/wedding-data"
import { cn } from "@/lib/utils"
import {
  MapPin,
  UtensilsCrossed,
  Clock,
  Gift,
  Music2,
  Camera,
  Church,
  Wine,
  PartyPopper,
  Heart,
} from "lucide-react"

interface ModuleDef {
  id: string
  title: string
  desc: string
  icon: typeof MapPin
  defaultOn: boolean
}

const MODULES: ModuleDef[] = [
  { id: "location", title: "Localización", desc: "Mapa de Google para ceremonia y celebración.", icon: MapPin, defaultOn: true },
  { id: "menu", title: "Menú del Banquete", desc: "Detalle de platos con fotos y alergias.", icon: UtensilsCrossed, defaultOn: true },
  { id: "timeline", title: "Itinerario", desc: "Línea de tiempo visual del evento.", icon: Clock, defaultOn: true },
  { id: "gifts", title: "Mesa de Regalos", desc: "Cuenta IBAN o enlace a lista de bodas.", icon: Gift, defaultOn: false },
  { id: "spotify", title: "Música Spotify", desc: "Lista colaborativa de canciones.", icon: Music2, defaultOn: false },
  { id: "gallery", title: "Live Gallery", desc: "Los invitados suben sus fotos del día.", icon: Camera, defaultOn: true },
]

const TIMELINE_ICONS: Record<string, typeof Church> = {
  church: Church,
  glass: Wine,
  utensils: UtensilsCrossed,
  music: PartyPopper,
}

const DISHES = [
  { course: "Entrante", name: "Burrata con tomate de temporada", img: "/images/dish-starter.png" },
  { course: "Principal", name: "Lubina salvaje con espárragos", img: "/images/dish-main.png" },
  { course: "Postre", name: "Tarta de limón y frambuesa", img: "/images/dish-dessert.png" },
]

const GALLERY = [
  "/images/gallery-1.png",
  "/images/gallery-2.png",
  "/images/couple-hero.png",
  "/images/venue.png",
]

type PageId = "inicio" | "menu" | "itinerario" | "regalos" | "musica" | "galeria"

const PAGE_BY_MODULE: Record<string, PageId> = {
  location: "inicio",
  menu: "menu",
  timeline: "itinerario",
  gifts: "regalos",
  spotify: "musica",
  gallery: "galeria",
}

export function WebsiteView() {
  const [active, setActive] = useState<Record<string, boolean>>(
    Object.fromEntries(MODULES.map((m) => [m.id, m.defaultOn])),
  )
  const [page, setPage] = useState<PageId>("inicio")
  const enabledCount = Object.values(active).filter(Boolean).length

  // Build the visible nav based on enabled modules. "Inicio" always shows.
  const nav: { id: PageId; label: string }[] = [{ id: "inicio", label: "Inicio" }]
  if (active.menu) nav.push({ id: "menu", label: "Menú" })
  if (active.timeline) nav.push({ id: "itinerario", label: "Itinerario" })
  if (active.gifts) nav.push({ id: "regalos", label: "Regalos" })
  if (active.spotify) nav.push({ id: "musica", label: "Música" })
  if (active.gallery) nav.push({ id: "galeria", label: "Galería" })

  // Keep current page valid when modules toggle off.
  const currentPage = nav.some((n) => n.id === page) ? page : "inicio"

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Module configuration */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {enabledCount} de {MODULES.length} módulos activos
          </p>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
            velvet.com/ana-y-carlos
          </span>
        </div>
        <div className="space-y-3">
          {MODULES.map((m) => {
            const Icon = m.icon
            const on = active[m.id]
            return (
              <div
                key={m.id}
                className={cn(
                  "flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm transition-colors",
                  on ? "border-accent/40" : "border-border",
                )}
              >
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                    on ? "bg-accent/10 text-accent" : "bg-secondary text-muted-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{m.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.desc}</p>
                </div>
                <button
                  onClick={() => {
                    const next = !active[m.id]
                    setActive((s) => ({ ...s, [m.id]: next }))
                    // Jump preview to the section the user just enabled.
                    if (next && PAGE_BY_MODULE[m.id]) setPage(PAGE_BY_MODULE[m.id])
                  }}
                  role="switch"
                  aria-checked={on}
                  aria-label={`Activar ${m.title}`}
                  className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                    on ? "bg-accent" : "bg-border",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform",
                      on ? "translate-x-5" : "translate-x-0.5",
                    )}
                  />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Live website preview (a real navigable mini-site) */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-3 text-center text-xs uppercase tracking-widest text-muted-foreground">
          Lo que verán tus invitados
        </p>
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 border-b border-border bg-secondary/60 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-border" />
            <span className="h-2.5 w-2.5 rounded-full bg-border" />
            <span className="h-2.5 w-2.5 rounded-full bg-border" />
            <span className="ml-3 truncate rounded-md bg-card px-2 py-0.5 text-[10px] text-muted-foreground">
              velvet.com/ana-y-carlos
            </span>
          </div>

          {/* Site header + internal navigation */}
          <div className="border-b border-border px-5 pb-3 pt-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-accent">
              <Heart className="h-3.5 w-3.5 fill-current" strokeWidth={1.5} />
              <span className="font-serif text-sm tracking-wide text-foreground">Ana &amp; Carlos</span>
            </div>
            <nav className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
              {nav.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setPage(n.id)}
                  className={cn(
                    "relative pb-1 text-xs transition-colors",
                    currentPage === n.id
                      ? "font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {n.label}
                  {currentPage === n.id && (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-accent" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Page content */}
          <div className="max-h-[460px] overflow-y-auto">
            {currentPage === "inicio" && <HomePage hasLocation={active.location} />}
            {currentPage === "menu" && <MenuPage />}
            {currentPage === "itinerario" && <TimelinePage />}
            {currentPage === "regalos" && <GiftsPage />}
            {currentPage === "musica" && <MusicPage />}
            {currentPage === "galeria" && <GalleryPage />}
          </div>
        </div>
      </div>
    </div>
  )
}

function HomePage({ hasLocation }: { hasLocation: boolean }) {
  return (
    <div>
      <div className="relative">
        <img src="/images/couple-hero.png" alt="Ana y Carlos" className="h-44 w-full object-cover" />
        <div className="absolute inset-0 bg-primary/45" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-primary-foreground">
          <p className="text-[10px] uppercase tracking-[0.35em]">Nos casamos</p>
          <h3 className="mt-1 font-serif text-3xl">Ana &amp; Carlos</h3>
          <p className="mt-1 text-xs tracking-wide">14 · Septiembre · 2026</p>
        </div>
      </div>
      <div className="space-y-5 p-5">
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { k: "Fecha", v: "14 Sep" },
            { k: "Ceremonia", v: "17:30 h" },
            { k: "Lugar", v: "Toledo" },
          ].map((i) => (
            <div key={i.k} className="rounded-xl bg-secondary/60 py-3">
              <p className="font-serif text-base text-foreground">{i.v}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{i.k}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          Nos hace mucha ilusión compartir este día tan especial con vosotros. Aquí encontraréis
          toda la información que necesitáis.
        </p>
        {hasLocation && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" strokeWidth={1.75} />
              <h4 className="font-serif text-base text-foreground">Cómo llegar</h4>
            </div>
            <div className="flex h-32 items-center justify-center rounded-xl bg-secondary/60 text-xs text-muted-foreground">
              Mapa de Google · Iglesia de San Andrés, Toledo
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Ceremonia 17:30 h · Celebración a continuación en Cigarral del Ángel.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function MenuPage() {
  return (
    <div className="space-y-4 p-5">
      <div className="text-center">
        <h4 className="font-serif text-xl text-foreground">Nuestro Menú</h4>
        <p className="text-xs text-muted-foreground">Un banquete pensado con cariño</p>
      </div>
      <div className="space-y-4">
        {DISHES.map((d) => (
          <div key={d.course} className="overflow-hidden rounded-2xl border border-border bg-card">
            <img src={d.img || "/placeholder.svg"} alt={d.name} className="h-36 w-full object-cover" />
            <div className="p-3">
              <p className="text-[10px] uppercase tracking-widest text-accent">{d.course}</p>
              <p className="font-serif text-base text-foreground">{d.name}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-secondary/60 p-3 text-center text-xs text-muted-foreground">
        ¿Alguna alergia o intolerancia? Indícanoslo al confirmar tu asistencia.
      </div>
    </div>
  )
}

function TimelinePage() {
  return (
    <div className="space-y-4 p-5">
      <div className="text-center">
        <h4 className="font-serif text-xl text-foreground">Itinerario</h4>
        <p className="text-xs text-muted-foreground">El plan del gran día</p>
      </div>
      <ul className="space-y-3">
        {TIMELINE.map((t) => {
          const TIcon = TIMELINE_ICONS[t.icon] ?? Clock
          return (
            <li key={t.time} className="flex items-center gap-3 text-sm">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent">
                <TIcon className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <span className="w-14 font-serif text-foreground tabular-nums">{t.time}</span>
              <span className="text-muted-foreground">{t.label}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function GiftsPage() {
  return (
    <div className="space-y-4 p-5 text-center">
      <Gift className="mx-auto h-8 w-8 text-accent" strokeWidth={1.5} />
      <h4 className="font-serif text-xl text-foreground">Mesa de Regalos</h4>
      <p className="mx-auto max-w-xs text-xs leading-relaxed text-muted-foreground">
        Vuestra presencia es nuestro mejor regalo. Si aun así queréis tener un detalle, os dejamos
        nuestra cuenta.
      </p>
      <div className="rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-3 font-mono text-xs text-foreground">
        ES12 3456 7890 1234 5678 9012
      </div>
    </div>
  )
}

function MusicPage() {
  return (
    <div className="space-y-4 p-5 text-center">
      <Music2 className="mx-auto h-8 w-8 text-accent" strokeWidth={1.5} />
      <h4 className="font-serif text-xl text-foreground">La Banda Sonora</h4>
      <p className="mx-auto max-w-xs text-xs leading-relaxed text-muted-foreground">
        Ayúdanos a crear la lista perfecta. Añade las canciones que no pueden faltar en la fiesta.
      </p>
      <div className="space-y-2 text-left">
        {["Can't Help Falling in Love — Elvis", "September — Earth, Wind & Fire", "Bailando — Paradisio"].map(
          (s) => (
            <div key={s} className="flex items-center gap-3 rounded-xl bg-secondary/60 px-3 py-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/15 text-accent">
                <Music2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              </span>
              <span className="text-xs text-foreground">{s}</span>
            </div>
          ),
        )}
      </div>
    </div>
  )
}

function GalleryPage() {
  return (
    <div className="space-y-4 p-5">
      <div className="text-center">
        <h4 className="font-serif text-xl text-foreground">Live Gallery</h4>
        <p className="text-xs text-muted-foreground">Sube tus fotos del gran día</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {GALLERY.map((src, i) => (
          <img
            key={i}
            src={src || "/placeholder.svg"}
            alt={`Foto de la boda ${i + 1}`}
            className="aspect-square w-full rounded-xl object-cover"
          />
        ))}
      </div>
      <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-xs font-medium text-accent-foreground">
        <Camera className="h-4 w-4" strokeWidth={1.75} />
        Subir mis fotos
      </button>
    </div>
  )
}
