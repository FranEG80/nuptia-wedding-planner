import Image from "next/image"
import { notFound } from "next/navigation"
import { Camera, Clock, Gift, MapPin, Music2, PenLine, UtensilsCrossed } from "lucide-react"

import { getPublicWeddingSiteUseCase } from "@/domains/wedding-sites/application/use-cases/get-public-wedding-site.use-case"
import { demoWeddingSiteRepository } from "@/domains/wedding-sites/adapters/demo/demo-wedding-site.repository"

const moduleIcons = {
  location: MapPin,
  menu: UtensilsCrossed,
  spotify: Music2,
  gallery: Camera,
  guestbook: PenLine,
  gifts: Gift,
  timeline: Clock,
} as const

export async function PublicWeddingSitePage({ slug }: { slug: string }) {
  let site = await getPublicWeddingSiteUseCase({
    weddingSiteRepository: demoWeddingSiteRepository,
    slug,
  })

  if (slug === "demo") {
    site = {
        slug,
        wedding: {
            id: "demo",
            ownerId: "demo-app-user",
            slug,
            date: new Date("2024-09-15T17:00:00Z").toISOString(),
            status: "published",
            partnerInviteCode: null,
            partnerInviteEmail: null,
            restaurantId: "demo-restaurant",
            menuId: "demo-menu",
            members: [
              {
                id: "demo-member-1",
                weddingId: "demo",
                appUserId: null,
                role: { id: "role-partner", code: "partner", label: "Pareja", sortOrder: 1 },
                displayName: "María",
                sortOrder: 1,
              },
              {
                id: "demo-member-2",
                weddingId: "demo",
                appUserId: null,
                role: { id: "role-partner", code: "partner", label: "Pareja", sortOrder: 1 },
                displayName: "Juan",
                sortOrder: 2,
              },
            ],
            partnerNames: ["María", "Juan"],
            displayName: "María & Juan",
            ceremonyLocation: {
              id: "demo-v1",
              name: "Salón de celebraciones",
              address: null,
              city: "Madrid",
              mapsUrl: null,
            },
            restaurant: {
              id: "demo-restaurant",
              name: "Salón de celebraciones",
              address: null,
              city: "Madrid",
              mapsUrl: null,
            },
            menu: {
              id: "demo-menu",
              restaurantId: "demo-restaurant",
              name: "Menú demo",
              description: null,
            },
            primaryCity: "Madrid",
        },
        modules: [
            { id: "1", type: "location", title: "Ubicación", desc: "Dónde se celebrará la boda", weddingId: "demo", enabled: true, sortOrder: 0 },
            { id: "2", type: "menu", title: "Menú", desc: "Qué se servirá en la boda", weddingId: "demo", enabled: true, sortOrder: 1 },
            { id: "3", type: "spotify", title: "Música", desc: "Canciones que nos gustan", weddingId: "demo", enabled: true, sortOrder: 2 },
            { id: "4", type: "gallery", title: "Galería", desc: "Fotos de nuestra historia", weddingId: "demo", enabled: true, sortOrder: 3 },
            { id: "5", type: "guestbook", title: "Libro de visitas", desc: "Deja tu mensaje para nosotros", weddingId: "demo", enabled: true, sortOrder: 4 },
            { id: "6", type: "gifts", title: "Regalos", desc: "Opciones para hacernos un regalo", weddingId: "demo", enabled: true, sortOrder: 5 },
        ],
        timeline: [
            { time: "17:00", label: "Ceremonia", icon: "Clock"},
            { time: "18:00", label: "Cóctel", icon: "Clock"},
            { time: "19:00", label: "Banquete", icon: "Clock"},
            { time: "21:00", label: "Baile", icon: "Clock"},
        ],    
    }
}


  if (!site) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative grid min-h-[72svh] place-items-center overflow-hidden px-5 text-center">
        <Image
          src="/images/couple-hero.png"
          alt="Pareja celebrando su boda"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-primary/65" />
        <div className="relative z-10 max-w-3xl text-primary-foreground">
          <p className="text-xs uppercase tracking-[0.34em]">Nos casamos</p>
          <h1 className="mt-4 font-serif text-5xl leading-tight sm:text-7xl">
            {site.wedding.displayName}
          </h1>
          <p className="mt-5 text-base text-primary-foreground/80">
            {new Date(site.wedding.date).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            {site.wedding.primaryCity ? `· ${site.wedding.primaryCity}` : ""}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-5 py-12 sm:grid-cols-2 lg:grid-cols-3">
        {site.modules.map((module) => {
          const Icon = moduleIcons[module.type]

          return (
            <article key={module.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <Icon className="h-5 w-5 text-accent" />
              <h2 className="mt-4 font-serif text-xl text-foreground">{module.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{module.desc}</p>
            </article>
          )
        })}
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-16">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-accent">
            <Clock className="h-5 w-5" />
            <h2 className="font-serif text-2xl text-foreground">Itinerario</h2>
          </div>
          <div className="mt-6 space-y-4">
            {site.timeline.map((item) => (
              <div key={item.time} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                <span className="font-mono text-sm text-muted-foreground">{item.time}</span>
                <span className="font-medium text-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
