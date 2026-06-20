import type {
  PublicWeddingSite,
  UpdateWeddingSiteModuleInput,
  WeddingSiteRepository,
} from "@/domains/wedding-sites/domain/ports/wedding-site.repository"
import type {
  WeddingSiteModule,
  WeddingTimelineItem,
} from "@/domains/wedding-sites/domain/wedding-site-module"
import {
  DEMO_WEDDING_ID,
  demoWeddingRepository,
} from "@/domains/weddings/adapters/demo/demo-wedding.repository"

let demoModules: WeddingSiteModule[] = [
  { id: "module-location", weddingId: DEMO_WEDDING_ID, type: "location", title: "Localización", desc: "Mapa de Google para ceremonia y celebración.", enabled: true, sortOrder: 10 },
  { id: "module-menu", weddingId: DEMO_WEDDING_ID, type: "menu", title: "Menú del Banquete", desc: "Detalle de platos con fotos y alergias.", enabled: true, sortOrder: 20 },
  { id: "module-timeline", weddingId: DEMO_WEDDING_ID, type: "timeline", title: "Itinerario", desc: "Línea de tiempo visual del evento.", enabled: true, sortOrder: 30 },
  { id: "module-gifts", weddingId: DEMO_WEDDING_ID, type: "gifts", title: "Mesa de Regalos", desc: "Cuenta IBAN o enlace a lista de bodas.", enabled: false, sortOrder: 40 },
  { id: "module-spotify", weddingId: DEMO_WEDDING_ID, type: "spotify", title: "Música Spotify", desc: "Lista colaborativa de canciones.", enabled: false, sortOrder: 50 },
  { id: "module-gallery", weddingId: DEMO_WEDDING_ID, type: "gallery", title: "Live Gallery", desc: "Los invitados suben sus fotos del día.", enabled: true, sortOrder: 60 },
  { id: "module-guestbook", weddingId: DEMO_WEDDING_ID, type: "guestbook", title: "Firmas y felicitaciones", desc: "Libro de firmas digital con mensajes de invitados.", enabled: true, sortOrder: 70 },
]

const demoTimeline: WeddingTimelineItem[] = [
  { time: "17:00", label: "Ceremonia", icon: "church" },
  { time: "18:30", label: "Cóctel de bienvenida", icon: "glass" },
  { time: "21:00", label: "Cena", icon: "utensils" },
  { time: "00:00", label: "Fiesta", icon: "music" },
]

function sortedModules(modules: WeddingSiteModule[]) {
  return [...modules].sort((a, b) => a.sortOrder - b.sortOrder)
}

export const demoWeddingSiteRepository: WeddingSiteRepository = {
  async listModulesByWeddingId(weddingId) {
    return sortedModules(
      demoModules.filter((module) => module.weddingId === weddingId),
    )
  },

  async findPublicBySlug(slug): Promise<PublicWeddingSite | null> {
    const wedding = await demoWeddingRepository.findBySlug(slug)

    if (!wedding) {
      return null
    }

    return {
      slug,
      wedding,
      modules: sortedModules(demoModules).filter((module) => module.enabled),
      timeline: demoTimeline,
    }
  },

  async updateModule(weddingId, type, input: UpdateWeddingSiteModuleInput) {
    const current = demoModules.find(
      (module) => module.weddingId === weddingId && module.type === type,
    )

    if (!current) {
      return null
    }

    const next = { ...current, ...input }
    demoModules = demoModules.map((module) =>
      module.id === current.id ? next : module,
    )

    return next
  },
}
