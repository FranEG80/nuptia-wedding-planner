import type { WeddingSiteModuleType } from "@/domains/wedding-sites/domain/wedding-site-module"

/**
 * La web de boda se navega por subpáginas, igual en todos los templates.
 * "Inicio" e "Historia" siempre están disponibles; el resto aparece si su
 * módulo está activo. Itinerario y regalos no son subpáginas: sus módulos
 * activan sendas secciones dentro de "Inicio".
 */
export const WEDDING_SITE_PAGES = [
  { id: "inicio", label: "Inicio", module: null },
  { id: "historia", label: "Historia", module: null },
  { id: "menu", label: "Menú", module: "menu" },
  { id: "musica", label: "Música", module: "spotify" },
  { id: "galeria", label: "Galería", module: "gallery" },
  { id: "firmas", label: "Firmas", module: "guestbook" },
] as const satisfies ReadonlyArray<{
  id: string
  label: string
  module: WeddingSiteModuleType | null
}>

export type WeddingSitePageId = (typeof WEDDING_SITE_PAGES)[number]["id"]

export interface WeddingSitePage {
  id: WeddingSitePageId
  label: string
}

export const DEFAULT_WEDDING_SITE_PAGE_ID: WeddingSitePageId = "inicio"

export function resolveWeddingSitePages(
  enabledModules: readonly WeddingSiteModuleType[],
): WeddingSitePage[] {
  return WEDDING_SITE_PAGES.filter(
    (page) => page.module === null || enabledModules.includes(page.module),
  ).map((page) => ({ id: page.id, label: page.label }))
}

export function normalizeWeddingSitePageId(
  value: string | undefined,
  pages: readonly WeddingSitePage[],
): WeddingSitePageId {
  return pages.some((page) => page.id === value)
    ? (value as WeddingSitePageId)
    : DEFAULT_WEDDING_SITE_PAGE_ID
}
