import nachoData from "../../../../../DATA/nacho.json"

import type { PublicWeddingSiteDto } from "@/domains/wedding-sites/application/dtos/public-wedding-site.dto"
import type { WeddingSiteModuleDto } from "@/domains/wedding-sites/application/dtos/wedding-site-module.dto"
import type { WeddingSiteModuleType } from "@/domains/wedding-sites/domain/wedding-site-module"
import type { WeddingDto } from "@/domains/weddings/application/dtos/wedding.dto"

export const NACHO_WEDDING_SLUG = "nacho-y-maria-daniela"

export const WEDDING_SITE_MODULES: WeddingSiteModuleType[] = [
  "gallery",
  "location",
  "timeline",
  "menu",
  "gifts",
  "spotify",
  "guestbook",
]

export interface WeddingExperiencePlace {
  name: string
  address: string
  city: string
  time: string
  mapsUrl: string
}

export interface WeddingExperienceTimelineItem {
  id: string
  time: string
  title: string
  description: string
  illustration: "church" | "cocktails" | "dinner" | "party"
}

export interface WeddingExperienceMenuCourse {
  id: string
  course: string
  name: string
  items: string[]
  imageSrc?: string
}

export interface WeddingExperienceGalleryPhoto {
  id: string
  src: string
  alt: string
}

export interface WeddingExperienceSignature {
  id: string
  name: string
  message: string
}

export interface WeddingExperienceTrack {
  id: string
  title: string
  artist: string
}

/**
 * Las subpáginas de menú, música y galería todavía no tienen datos propios en
 * la base de datos, así que todos los templates comparten estos marcadores.
 * El menú se publica como propuesta: los platos se confirman con el catering.
 */
const DEFAULT_MENU_COURSES: WeddingExperienceMenuCourse[] = [
  {
    id: "starters",
    course: "Entrantes",
    name: "Para ir abriendo boca",
    items: [
      "Jamón ibérico cortado a cuchillo",
      "Ensaladilla de gambas y aguacate",
      "Croquetas cremosas de puchero",
      "Tartar de atún rojo con mango",
    ],
    imageSrc: "/images/dish-starter.webp",
  },
  {
    id: "main",
    course: "Plato principal",
    name: "El plato de la noche",
    items: [
      "Lubina salvaje con espárragos verdes",
      "Solomillo de ternera con reducción de Pedro Ximénez",
      "Opción vegetariana y sin gluten a petición",
    ],
    imageSrc: "/images/dish-main.webp",
  },
  {
    id: "dessert",
    course: "Postre",
    name: "El dulce final",
    items: ["Tarta nupcial", "Tarta de limón y frambuesa", "Petit fours y café"],
    imageSrc: "/images/dish-dessert.webp",
  },
  {
    id: "drinks",
    course: "Bebidas",
    name: "Para brindar",
    items: [
      "Vino blanco D.O. Rueda",
      "Vino tinto D.O. Ribera del Duero",
      "Cerveza, refrescos y agua",
      "Cava para el brindis y barra libre",
    ],
  },
]

/**
 * Contenido de ejemplo: solo para la vista previa del editor. La web publicada
 * no muestra galería ni firmas hasta que existen las reales.
 */
export const SAMPLE_GUESTBOOK_SIGNATURES: WeddingExperienceSignature[] = [
  {
    id: "sample-1",
    name: "Marta y Javi",
    message:
      "Qué ganas de veros dar el sí. Gracias por dejarnos formar parte de un día tan vuestro.",
  },
  {
    id: "sample-2",
    name: "Abuela Carmen",
    message: "Que no os falte nunca la salud, la paciencia y las ganas de reíros juntos.",
  },
  {
    id: "sample-3",
    name: "Los del grupo de Granada",
    message: "Prometemos ser los últimos en salir de la pista. Os queremos.",
  },
]

export const SAMPLE_GALLERY_PHOTOS: WeddingExperienceGalleryPhoto[] = [
  { id: "gallery-1", src: "/images/gallery-1.webp", alt: "Detalle floral de la celebración" },
  { id: "gallery-2", src: "/images/gallery-2.webp", alt: "Mesa preparada para el banquete" },
  { id: "couple", src: "/images/couple-hero.webp", alt: "La pareja el día de la boda" },
  { id: "venue", src: "/images/venue.webp", alt: "El lugar de la celebración" },
]

const DEFAULT_PLAYLIST: WeddingExperienceTrack[] = [
  { id: "elvis", title: "Can't Help Falling in Love", artist: "Elvis Presley" },
  { id: "ewf", title: "September", artist: "Earth, Wind & Fire" },
  { id: "paradisio", title: "Bailando", artist: "Paradisio" },
]

export interface WeddingExperienceContent {
  slug: string
  partnerNames: [string, string]
  displayName: string
  dateIso: string
  dateLabel: string
  city: string
  story: string[]
  ceremony: WeddingExperiencePlace
  reception: WeddingExperiencePlace
  timeline: WeddingExperienceTimelineItem[]
  rsvpDeadline: string
  gifts: {
    iban: string
    accountHolder: string
  } | null
  contacts: Array<{
    name: string
    phone: string
    whatsappUrl: string
  }>
  menu: WeddingExperienceMenuCourse[]
  /** Fotos reales subidas por los novios. Vacío hasta que las suban. */
  gallery: WeddingExperienceGalleryPhoto[]
  /** Firmas y felicitaciones dejadas por los invitados desde su invitación. */
  guestbook: WeddingExperienceSignature[]
  playlist: WeddingExperienceTrack[]
  /** Playlist pública de Spotify. Cuando existe, se incrusta en la subpágina de música. */
  spotifyPlaylistUrl: string | null
  /** Acuerdo de alojamiento con el hotel, si la pareja lo ha negociado. */
  accommodation: {
    code: string
    note: string
  } | null
  enabledModules: WeddingSiteModuleType[]
}

/**
 * Playlist provisional mientras los novios no publiquen la suya. El embed de
 * Spotify es un iframe público: no necesita API ni credenciales.
 */
export const DEMO_SPOTIFY_PLAYLIST = "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M"

/** Convierte cualquier URL o URI de playlist de Spotify en su URL de embed. */
export function spotifyEmbedUrl(playlistUrl: string) {
  const id = playlistUrl.match(/playlist[/:]([a-zA-Z0-9]+)/)?.[1]

  return id ? `https://open.spotify.com/embed/playlist/${id}?theme=0` : null
}

function mapsUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

function whatsappUrl(phone: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}`
}

function addressLine(address: {
  street: string
  number: string
  postal_code: string
  city: string
  province: string
  country: string
}) {
  return `${address.street}, ${address.number} · ${address.postal_code} ${address.city}, ${address.province}`
}

function enabledModulesFromDtos(modules: WeddingSiteModuleDto[] | undefined) {
  if (!modules?.length) {
    return [...WEDDING_SITE_MODULES]
  }

  return modules
    .filter((module) => module.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((module) => module.type)
}

export function createNachoWeddingExperience(
  modules?: WeddingSiteModuleDto[],
): WeddingExperienceContent {
  const ceremonyAddress = addressLine(nachoData.wedding.location.address)
  const receptionAddress = addressLine(nachoData.cocktail.location.address)

  return {
    slug: NACHO_WEDDING_SLUG,
    // Mismo orden que la invitación y que el dominio de la boda.
    partnerNames: [nachoData.wife.name, nachoData.husband.name],
    displayName: `${nachoData.wife.name} & ${nachoData.husband.name}`,
    dateIso: `${nachoData.wedding.date}T${nachoData.wedding.time}:00+02:00`,
    dateLabel: "16 de octubre de 2026",
    city: nachoData.wedding.location.city,
    story: nachoData.history,
    ceremony: {
      name: nachoData.wedding.location.venue,
      address: ceremonyAddress,
      city: nachoData.wedding.location.city,
      time: nachoData.wedding.time,
      mapsUrl: mapsUrl(`${nachoData.wedding.location.venue}, ${ceremonyAddress}`),
    },
    reception: {
      name: nachoData.cocktail.location.venue,
      address: receptionAddress,
      city: nachoData.cocktail.location.city,
      time: nachoData.cocktail.time,
      mapsUrl: mapsUrl(`${nachoData.cocktail.location.venue}, ${receptionAddress}`),
    },
    timeline: [
      {
        id: "ceremony",
        time: nachoData.wedding.time,
        title: "Ceremonia",
        description: nachoData.wedding.location.venue,
        illustration: "church",
      },
      {
        id: "cocktail",
        time: nachoData.cocktail.time,
        title: "Cóctel",
        description: "El primer brindis frente al mar",
        illustration: "cocktails",
      },
      {
        id: "banquet",
        time: nachoData.banquet.time,
        title: "Banquete",
        description: nachoData.banquet.location.venue,
        illustration: "dinner",
      },
      {
        id: "party",
        time: nachoData.party.time,
        title: "Fiesta",
        description: "Bailaremos hasta que el cuerpo aguante",
        illustration: "party",
      },
    ],
    rsvpDeadline: "30 de septiembre de 2026",
    gifts: {
      iban: nachoData.gifts.bank_account.iban,
      accountHolder: nachoData.gifts.bank_account.account_holder,
    },
    contacts: [nachoData.husband, nachoData.wife].map((person) => ({
      name: person.name,
      phone: person.phone,
      whatsappUrl: whatsappUrl(person.phone),
    })),
    menu: DEFAULT_MENU_COURSES,
    gallery: [],
    guestbook: [],
    playlist: DEFAULT_PLAYLIST,
    spotifyPlaylistUrl: DEMO_SPOTIFY_PLAYLIST,
    accommodation: {
      code: "BODAD&N2026",
      note: "Tenemos un código para reservar directamente en la web del hotel con un descuento adicional sobre la tarifa publicada. Es válido para todas las habitaciones, en régimen de alojamiento y desayuno.",
    },
    enabledModules: enabledModulesFromDtos(modules),
  }
}

function genericExperience(
  wedding: WeddingDto,
  modules: WeddingSiteModuleDto[],
  timeline: PublicWeddingSiteDto["timeline"] = [],
): WeddingExperienceContent {
  const firstName = wedding.partnerNames[0] ?? "Nuestra"
  const secondName = wedding.partnerNames[1] ?? "boda"
  const ceremony = wedding.ceremonyLocation
  const reception = wedding.restaurant
  const date = new Date(wedding.date)
  const formattedDate = date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return {
    slug: wedding.slug,
    partnerNames: [firstName, secondName],
    displayName: wedding.displayName,
    dateIso: wedding.date,
    dateLabel: formattedDate,
    city: wedding.primaryCity,
    story: [
      "Hay encuentros que llegan sin avisar y terminan convirtiéndose en hogar.",
      "Nos hace muchísima ilusión compartir este nuevo capítulo con las personas que forman parte de nuestra historia.",
    ],
    ceremony: {
      name: ceremony?.name ?? "Lugar de la ceremonia",
      address: ceremony?.address ?? "Dirección pendiente de confirmar",
      city: ceremony?.city ?? wedding.primaryCity,
      time: timeline[0]?.time ?? "17:00",
      mapsUrl: ceremony?.mapsUrl ?? mapsUrl(`${ceremony?.name ?? "Ceremonia"}, ${wedding.primaryCity}`),
    },
    reception: {
      name: reception?.name ?? "Lugar de la celebración",
      address: reception?.address ?? "Dirección pendiente de confirmar",
      city: reception?.city ?? wedding.primaryCity,
      time: timeline[1]?.time ?? "19:00",
      mapsUrl: reception?.mapsUrl ?? mapsUrl(`${reception?.name ?? "Celebración"}, ${wedding.primaryCity}`),
    },
    timeline: (timeline.length ? timeline : [
      { time: "17:00", label: "Ceremonia", icon: "church" },
      { time: "18:30", label: "Cóctel", icon: "glass" },
      { time: "20:30", label: "Banquete", icon: "utensils" },
      { time: "23:30", label: "Fiesta", icon: "music" },
    ]).map((item, index) => ({
      id: `${index}-${item.time}`,
      time: item.time,
      title: item.label,
      description: index === 0 ? (ceremony?.name ?? wedding.primaryCity) : (reception?.name ?? wedding.primaryCity),
      illustration: (["church", "cocktails", "dinner", "party"] as const)[Math.min(index, 3)],
    })),
    rsvpDeadline: "Consulta la fecha límite en tu invitación",
    gifts: null,
    contacts: [],
    menu: DEFAULT_MENU_COURSES,
    gallery: [],
    guestbook: [],
    playlist: DEFAULT_PLAYLIST,
    spotifyPlaylistUrl: DEMO_SPOTIFY_PLAYLIST,
    accommodation: null,
    enabledModules: enabledModulesFromDtos(modules),
  }
}

export function createWeddingExperienceFromPublicSite(
  site: PublicWeddingSiteDto,
) {
  if (site.slug === NACHO_WEDDING_SLUG) {
    return createNachoWeddingExperience(site.modules)
  }

  return genericExperience(site.wedding, site.modules, site.timeline)
}

export function createWeddingExperienceFromWedding(
  wedding: WeddingDto,
  modules: WeddingSiteModuleDto[],
) {
  if (wedding.slug === NACHO_WEDDING_SLUG) {
    return createNachoWeddingExperience(modules)
  }

  return genericExperience(wedding, modules)
}
