"use server"

import { z } from "zod"

import { getRepositories } from "@/composition/repositories"
import { env } from "@/core/config/env"
import type {
  GuestbookPageDto,
  GuestbookSignatureDto,
} from "@/domains/wedding-sites/application/dtos/guestbook.dto"
import { createWeddingExperienceFromPublicSite } from "@/domains/wedding-sites/application/dtos/wedding-experience.dto"
import { getPublicWeddingSiteUseCase } from "@/domains/wedding-sites/application/use-cases/get-public-wedding-site.use-case"
import { listGuestbookPageUseCase } from "@/domains/wedding-sites/application/use-cases/list-guestbook-page.use-case"
import {
  signGuestbookUseCase,
  type SignGuestbookResult,
} from "@/domains/wedding-sites/application/use-cases/sign-guestbook.use-case"
import { isFullWeddingSiteVisible } from "@/domains/wedding-sites/domain/wedding-site-availability"

const slugSchema = z.string().min(1).max(200)

const listGuestbookPageSchema = z.object({
  slug: slugSchema,
  page: z.number().int().min(1).max(10_000),
})

// Límites holgados: el caso de uso aplica los reales y responde con un estado.
const signGuestbookSchema = z.object({
  slug: slugSchema,
  guestId: z.string().min(1).max(100),
  authorName: z.string().max(400),
  message: z.string().max(10_000),
})

export type ListGuestbookPageResult =
  | { status: "ok"; guestbook: GuestbookPageDto }
  | { status: "unavailable" }

export type SignGuestbookActionResult =
  | { status: "signed"; signature: GuestbookSignatureDto; guestbook: GuestbookPageDto }
  | Exclude<SignGuestbookResult, { status: "signed" }>
  | { status: "unavailable" }

/**
 * Boda cuyo tablón está abierto: la web completa ya es pública y el módulo de
 * firmas sigue activo. Cualquier otro caso se trata como no disponible.
 */
async function findOpenGuestbook(slug: string) {
  const repositories = await getRepositories()
  const site = await getPublicWeddingSiteUseCase({
    weddingSiteRepository: repositories.weddingSite,
    slug,
  })

  if (!site) {
    return null
  }

  const content = createWeddingExperienceFromPublicSite(site)
  const isOpen =
    content.enabledModules.includes("guestbook") &&
    isFullWeddingSiteVisible({
      dateIso: content.dateIso,
      alwaysEnabled: env.WEDDING_SITE_ENABLED,
    })

  return isOpen ? { repositories, weddingId: site.wedding.id } : null
}

/** Acceso público a la web: no requiere sesión. */
export async function listGuestbookPageAction(
  input: unknown,
): Promise<ListGuestbookPageResult> {
  const parsed = listGuestbookPageSchema.safeParse(input)

  if (!parsed.success) {
    return { status: "unavailable" }
  }

  const guestbook = await findOpenGuestbook(parsed.data.slug)

  if (!guestbook) {
    return { status: "unavailable" }
  }

  return {
    status: "ok",
    guestbook: await listGuestbookPageUseCase({
      guestbookRepository: guestbook.repositories.guestbook,
      weddingId: guestbook.weddingId,
      page: parsed.data.page,
    }),
  }
}

/**
 * Firma del invitado identificado por teléfono en la web. Devuelve también la
 * primera página actualizada, donde aparece la firma recién colgada.
 */
export async function signGuestbookAction(
  input: unknown,
): Promise<SignGuestbookActionResult> {
  const parsed = signGuestbookSchema.safeParse(input)

  if (!parsed.success) {
    return { status: "unavailable" }
  }

  const guestbook = await findOpenGuestbook(parsed.data.slug)

  if (!guestbook) {
    return { status: "unavailable" }
  }

  const { repositories, weddingId } = guestbook
  const result = await signGuestbookUseCase({
    guestbookRepository: repositories.guestbook,
    findSigner: (signerWeddingId, guestId) =>
      repositories.guest.findWallIdentity(signerWeddingId, guestId),
    weddingId,
    guestId: parsed.data.guestId,
    authorName: parsed.data.authorName,
    message: parsed.data.message,
  })

  if (result.status !== "signed") {
    return result
  }

  return {
    ...result,
    guestbook: await listGuestbookPageUseCase({
      guestbookRepository: repositories.guestbook,
      weddingId,
      page: 1,
    }),
  }
}
