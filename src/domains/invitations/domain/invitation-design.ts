import {
  DEFAULT_INVITATION_COLOR_PRESET_ID,
  DEFAULT_INVITATION_FONT_PAIR_ID,
  DEFAULT_INVITATION_PHOTO_ASSET_ID,
  DEFAULT_INVITATION_SECTION_VISIBILITY,
  type InvitationColorPresetId,
  type InvitationFontPairId,
  type InvitationPhotoAssetId,
  type InvitationSectionVisibility,
  type InvitationTemplateId,
} from "@/domains/invitations/domain/invitation-template-options"

export type { InvitationTemplateId }

export interface InvitationScheduleItem {
  id: string
  title: string
  date: string
  time: string
  location: string
  mapsUrl: string
  description: string
}

export interface InvitationTravelItem {
  id: string
  title: string
  description: string
  imageSrc: string
  websiteUrl: string
  mapsUrl: string
}

export interface InvitationRegistryItem {
  id: string
  title: string
  url: string
}

export type InvitationRsvpPanelMotion = "slide-up" | "slide-left"

export interface InvitationContent {
  fontPairId: InvitationFontPairId
  colorPresetId: InvitationColorPresetId
  photoAssetId: InvitationPhotoAssetId
  visibleSections: InvitationSectionVisibility
  eyebrow: string
  heroWord: string
  storyTitle: string
  story: string[]
  scheduleTitle: string
  schedule: InvitationScheduleItem[]
  venueTitle: string
  venueNote: string
  travelTitle: string
  travel: InvitationTravelItem[]
  registryTitle: string
  registryIntro: string
  registryNote: string
  registry: InvitationRegistryItem[]
  questionsTitle: string
  contactEmail: string
  rsvpTitle: string
  rsvpSubtitle: string
  rsvpPanelMotion: InvitationRsvpPanelMotion
  whatsappMessage: string
  heroImageSrc: string
  monogramImageSrc: string
}

export const DEFAULT_INVITATION_CONTENT: InvitationContent = {
  fontPairId: DEFAULT_INVITATION_FONT_PAIR_ID,
  colorPresetId: DEFAULT_INVITATION_COLOR_PRESET_ID,
  photoAssetId: DEFAULT_INVITATION_PHOTO_ASSET_ID,
  visibleSections: DEFAULT_INVITATION_SECTION_VISIBILITY,
  eyebrow: "ACOMPAÑADNOS A CELEBRAR",
  heroWord: "SÍ",
  storyTitle: "Nuestra historia",
  story: [
    "Nos conocimos casi por casualidad y desde entonces hemos construido una historia llena de viajes, sobremesas y planes compartidos.",
    "Nos hace mucha ilusión celebrar este paso con las personas que más queremos.",
  ],
  scheduleTitle: "El itinerario",
  schedule: [
    {
      id: "ceremony",
      title: "Ceremonia",
      date: "Sábado, 12 de septiembre",
      time: "17:00",
      location: "Lugar de la ceremonia",
      mapsUrl: "",
      description:
        "La ceremonia comenzará puntual. Después seguiremos celebrando juntos.",
    },
    {
      id: "reception",
      title: "Cóctel y banquete",
      date: "Sábado, 12 de septiembre",
      time: "18:30",
      location: "Lugar de la celebración",
      mapsUrl: "",
      description: "Cena, brindis y baile para continuar la noche.",
    },
    {
      id: "brunch",
      title: "Despedida",
      date: "Domingo, 13 de septiembre",
      time: "11:00",
      location: "Por confirmar",
      mapsUrl: "",
      description: "Un último encuentro informal antes de despedir el fin de semana.",
    },
  ],
  venueTitle: "Ubicación",
  venueNote: "La ubicación final aparecerá aquí cuando esté configurada.",
  travelTitle: "Viaje y alojamiento",
  travel: [
    {
      id: "hotel",
      title: "Hotel recomendado",
      description:
        "Recomendamos reservar alojamiento cerca del lugar de celebración para disfrutar del fin de semana con calma.",
      imageSrc: "/images/venue.png",
      websiteUrl: "",
      mapsUrl: "",
    },
    {
      id: "transport",
      title: "Transporte",
      description:
        "Compartiremos más información sobre accesos, aparcamiento y transporte cuando se acerque la fecha.",
      imageSrc: "/images/gallery-1.png",
      websiteUrl: "",
      mapsUrl: "",
    },
  ],
  registryTitle: "Lista de regalos",
  registryIntro: "Vuestra presencia es nuestro mejor regalo.",
  registryNote:
    "Para quien quiera tener un detalle, hemos preparado algunas opciones.",
  registry: [
    { id: "IBAN", title: "ES39 12345 1234 12345 1234 53", url: "" },
  ],
  questionsTitle: "¿Alguna pregunta?",
  contactEmail: "hola@nuptia.app",
  rsvpTitle: "Nos casamos y queremos celebrarlo contigo",
  rsvpSubtitle:
    "Pulsa el botón para confirmar tu asistencia y ayudarnos a organizarlo todo.",
  rsvpPanelMotion: "slide-up",
  whatsappMessage:
    "Hola {guestName}, nos hace mucha ilusión invitarte a nuestra boda. Puedes ver la invitación y confirmar asistencia aquí: {inviteUrl}",
  heroImageSrc: "/images/invite-floral.png",
  monogramImageSrc: "/images/invite-floral.png",
}

export interface InvitationDesign {
  id: string
  weddingId: string
  templateId: InvitationTemplateId
  titleFont: InvitationFontPairId
  palette: InvitationColorPresetId
  content: InvitationContent
  openingEffect: string
  musicEnabled: boolean
}
