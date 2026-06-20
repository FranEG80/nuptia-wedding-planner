export const INVITATION_FONT_PAIRS = [
  {
    id: "playfair-inter",
    label: "Playfair + Inter",
    titleFamily: "var(--font-playfair), 'Playfair Display', serif",
    bodyFamily: "var(--font-inter), 'Inter Fallback', sans-serif",
  },
  {
    id: "cormorant-lato",
    label: "Cormorant + Lato",
    titleFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
    bodyFamily: "var(--font-lato), Lato, sans-serif",
  },
  {
    id: "libre-manrope",
    label: "Libre + Manrope",
    titleFamily: "var(--font-libre-baskerville), 'Libre Baskerville', serif",
    bodyFamily: "var(--font-manrope), Manrope, sans-serif",
  },
  {
    id: "marcellus-mulish",
    label: "Marcellus + Mulish",
    titleFamily: "var(--font-marcellus), Marcellus, serif",
    bodyFamily: "var(--font-mulish), Mulish, sans-serif",
  },
  {
    id: "fraunces-source",
    label: "Fraunces + Source",
    titleFamily: "var(--font-fraunces), Fraunces, serif",
    bodyFamily: "var(--font-source-sans), 'Source Sans 3', sans-serif",
  },
  {
    id: "cinzel-montserrat",
    label: "Cinzel + Montserrat",
    titleFamily: "var(--font-cinzel), Cinzel, serif",
    bodyFamily: "var(--font-montserrat), Montserrat, sans-serif",
  },
  {
    id: "bodoni-nunito",
    label: "Bodoni + Nunito",
    titleFamily: "var(--font-bodoni), 'Bodoni Moda', serif",
    bodyFamily: "var(--font-nunito), 'Nunito Sans', sans-serif",
  },
  {
    id: "prata-work",
    label: "Prata + Work Sans",
    titleFamily: "var(--font-prata), Prata, serif",
    bodyFamily: "var(--font-work-sans), 'Work Sans', sans-serif",
  },
] as const

export type InvitationFontPairId = (typeof INVITATION_FONT_PAIRS)[number]["id"]

export const DEFAULT_INVITATION_FONT_PAIR_ID: InvitationFontPairId = "playfair-inter"

export function normalizeInvitationFontPairId(value: string | undefined): InvitationFontPairId {
  if (value === "serif" || value === "sans") {
    return DEFAULT_INVITATION_FONT_PAIR_ID
  }

  return INVITATION_FONT_PAIRS.some((fontPair) => fontPair.id === value)
    ? (value as InvitationFontPairId)
    : DEFAULT_INVITATION_FONT_PAIR_ID
}

export function getInvitationFontPair(value: string | undefined) {
  const fontPairId = normalizeInvitationFontPairId(value)

  return INVITATION_FONT_PAIRS.find((fontPair) => fontPair.id === fontPairId) ?? INVITATION_FONT_PAIRS[0]
}

export const INVITATION_COLOR_PRESETS = [
  {
    id: "bouquet",
    label: "Bouquet",
    swatches: ["#fbfaf7", "#efe6d9", "#c39b69", "#4e4d44"],
    tokens: {
      page: "#f7f5ef",
      panel: "#fbfaf7",
      section: "#efe6d9",
      card: "#ffffff",
      text: "#4e4d44",
      heading: "#38392d",
      muted: "#6b6b61",
      accent: "#c39b69",
      accentDark: "#9b7649",
      accentText: "#ffffff",
      border: "#d9c6a9",
    },
  },
  {
    id: "sage",
    label: "Salvia",
    swatches: ["#f4f1ea", "#d9d0bd", "#6f7c67", "#313b34"],
    tokens: {
      page: "#f4f1ea",
      panel: "#fcfbf8",
      section: "#dfe4d4",
      card: "#ffffff",
      text: "#475143",
      heading: "#313b34",
      muted: "#65715f",
      accent: "#6f7c67",
      accentDark: "#465140",
      accentText: "#ffffff",
      border: "#b9c2ad",
    },
  },
  {
    id: "terracotta",
    label: "Terracota",
    swatches: ["#f6efe9", "#e2b593", "#a45d42", "#42302a"],
    tokens: {
      page: "#f6efe9",
      panel: "#fffaf6",
      section: "#ead0bf",
      card: "#ffffff",
      text: "#5d4035",
      heading: "#42302a",
      muted: "#775d52",
      accent: "#a45d42",
      accentDark: "#764331",
      accentText: "#fff8f3",
      border: "#d7a486",
    },
  },
  {
    id: "editorial",
    label: "Editorial",
    swatches: ["#f7f4ef", "#d8d1c5", "#222222", "#b08d57"],
    tokens: {
      page: "#f7f4ef",
      panel: "#fffdf9",
      section: "#e8e2d8",
      card: "#ffffff",
      text: "#33302d",
      heading: "#1f1e1d",
      muted: "#6c6861",
      accent: "#b08d57",
      accentDark: "#81633a",
      accentText: "#ffffff",
      border: "#d5c9b8",
    },
  },
  {
    id: "night-blue",
    label: "Azul noche",
    swatches: ["#f1f3f4", "#c8d0d6", "#233746", "#d9b46c"],
    tokens: {
      page: "#eef2f3",
      panel: "#fbfcfc",
      section: "#d7e0e4",
      card: "#ffffff",
      text: "#34444d",
      heading: "#233746",
      muted: "#596b74",
      accent: "#d9b46c",
      accentDark: "#9c7a39",
      accentText: "#17252f",
      border: "#b9c8d0",
    },
  },
  {
    id: "gardenia",
    label: "Gardenia",
    swatches: ["#fbfaf2", "#e7e1bf", "#9b9f68", "#464932"],
    tokens: {
      page: "#fbfaf2",
      panel: "#fffefa",
      section: "#ebe7ce",
      card: "#ffffff",
      text: "#555742",
      heading: "#383a2a",
      muted: "#77795f",
      accent: "#9b9f68",
      accentDark: "#686c42",
      accentText: "#ffffff",
      border: "#d8d2a8",
    },
  },
  {
    id: "lavender",
    label: "Lavanda",
    swatches: ["#f8f5f7", "#ddd3dd", "#8b748d", "#3d3541"],
    tokens: {
      page: "#f8f5f7",
      panel: "#fffafd",
      section: "#e9dfe8",
      card: "#ffffff",
      text: "#514958",
      heading: "#3d3541",
      muted: "#746a78",
      accent: "#8b748d",
      accentDark: "#604f63",
      accentText: "#ffffff",
      border: "#d6c7d6",
    },
  },
  {
    id: "coastal",
    label: "Costera",
    swatches: ["#f5f8f7", "#d2e1dc", "#5d8782", "#303f42"],
    tokens: {
      page: "#f5f8f7",
      panel: "#fbfefd",
      section: "#dceae6",
      card: "#ffffff",
      text: "#425759",
      heading: "#303f42",
      muted: "#637779",
      accent: "#5d8782",
      accentDark: "#3d615d",
      accentText: "#ffffff",
      border: "#bdd5cf",
    },
  },
] as const

export type InvitationColorPresetId = (typeof INVITATION_COLOR_PRESETS)[number]["id"]

export const DEFAULT_INVITATION_COLOR_PRESET_ID: InvitationColorPresetId = "sage"

export function normalizeInvitationColorPresetId(value: string | undefined): InvitationColorPresetId {
  return INVITATION_COLOR_PRESETS.some((preset) => preset.id === value)
    ? (value as InvitationColorPresetId)
    : DEFAULT_INVITATION_COLOR_PRESET_ID
}

export function getInvitationColorPreset(value: string | undefined) {
  const colorPresetId = normalizeInvitationColorPresetId(value)

  return INVITATION_COLOR_PRESETS.find((preset) => preset.id === colorPresetId) ?? INVITATION_COLOR_PRESETS[1]
}

export const INVITATION_SECTIONS = [
  { id: "story", label: "Historia" },
  { id: "schedule", label: "Itinerario" },
  { id: "venue", label: "Ubicación" },
  { id: "travel", label: "Alojamiento" },
  { id: "registry", label: "Regalos" },
  { id: "questions", label: "Contacto" },
  { id: "rsvp", label: "RSVP" },
] as const

export type InvitationSectionId = (typeof INVITATION_SECTIONS)[number]["id"]

export type InvitationSectionVisibility = Record<InvitationSectionId, boolean>

export const DEFAULT_INVITATION_SECTION_VISIBILITY: InvitationSectionVisibility = {
  story: true,
  schedule: true,
  venue: true,
  travel: true,
  registry: true,
  questions: true,
  rsvp: true,
}

export function normalizeInvitationSectionVisibility(
  value: Partial<Record<string, unknown>> | undefined,
): InvitationSectionVisibility {
  return INVITATION_SECTIONS.reduce<InvitationSectionVisibility>(
    (visibility, section) => ({
      ...visibility,
      [section.id]: typeof value?.[section.id] === "boolean" ? Boolean(value[section.id]) : true,
    }),
    { ...DEFAULT_INVITATION_SECTION_VISIBILITY },
  )
}

export const INVITATION_PHOTO_ASSETS = [
  {
    id: "invite-floral",
    label: "Flores acuarela",
    src: "/images/invite-floral.png",
  },
  {
    id: "couple-hero",
    label: "Pareja",
    src: "/images/couple-hero.png",
  },
  {
    id: "venue",
    label: "Finca",
    src: "/images/venue.png",
  },
  {
    id: "gallery-1",
    label: "Detalle floral",
    src: "/images/gallery-1.png",
  },
  {
    id: "invitation-photo-garden",
    label: "Jardín",
    src: "/images/invitation-photo-garden.png",
  },
  {
    id: "invitation-photo-table",
    label: "Mesa",
    src: "/images/invitation-photo-table.png",
  },
  {
    id: "invitation-photo-hands",
    label: "Manos",
    src: "/images/invitation-photo-hands.png",
  },
  {
    id: "invitation-photo-venue",
    label: "Ceremonia",
    src: "/images/invitation-photo-venue.png",
  },
] as const

export type InvitationPhotoAssetId = (typeof INVITATION_PHOTO_ASSETS)[number]["id"]

export const DEFAULT_INVITATION_PHOTO_ASSET_ID: InvitationPhotoAssetId = "invite-floral"

export const INVITATION_TEMPLATES = [
  {
    id: "bouquet",
    label: "Bouquet",
    description: "Pantalla dividida, fotografía lateral, timeline y RSVP integrado.",
  },
  {
    id: "custom",
    label: "Custom",
    description: "Template personalizable con estructura flexible.",
  },
] as const

export type InvitationTemplateId = (typeof INVITATION_TEMPLATES)[number]["id"]

export const DEFAULT_INVITATION_TEMPLATE_ID: InvitationTemplateId = "bouquet"

export function normalizeInvitationTemplateId(value: string | undefined): InvitationTemplateId {
  return INVITATION_TEMPLATES.some((t) => t.id === value)
    ? (value as InvitationTemplateId)
    : DEFAULT_INVITATION_TEMPLATE_ID
}

export function normalizeInvitationPhotoAssetId(value: string | undefined): InvitationPhotoAssetId {
  return INVITATION_PHOTO_ASSETS.some((asset) => asset.id === value)
    ? (value as InvitationPhotoAssetId)
    : DEFAULT_INVITATION_PHOTO_ASSET_ID
}

export function getInvitationPhotoAsset(value: string | undefined) {
  const photoAssetId = normalizeInvitationPhotoAssetId(value)

  return INVITATION_PHOTO_ASSETS.find((asset) => asset.id === photoAssetId) ?? INVITATION_PHOTO_ASSETS[0]
}
