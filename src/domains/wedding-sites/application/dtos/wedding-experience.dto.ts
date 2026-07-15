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
  enabledModules: WeddingSiteModuleType[]
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
    partnerNames: [nachoData.husband.name, nachoData.wife.name],
    displayName: `${nachoData.husband.name} & ${nachoData.wife.name}`,
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
