"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getRepositories } from "@/composition/repositories"
import { requireAppSession } from "@/core/auth"
import { isDemoSession } from "@/core/demo/is-demo-session"
import { deleteGuestbookSignatureUseCase } from "@/domains/wedding-sites/application/use-cases/delete-guestbook-signature.use-case"
import { setGuestbookSignatureStatusUseCase } from "@/domains/wedding-sites/application/use-cases/set-guestbook-signature-status.use-case"
import { getCurrentWeddingUseCase } from "@/domains/weddings/application/use-cases/get-current-wedding.use-case"

const signatureIdSchema = z.string().min(1).max(100)

const setSignatureStatusSchema = z.object({
  signatureId: signatureIdSchema,
  status: z.enum(["published", "hidden"]),
})

const deleteSignatureSchema = z.object({
  signatureId: signatureIdSchema,
})

/** Boda de los novios con sesión. `null` en la demo o si aún no tienen boda. */
async function loadModerationContext() {
  const repositories = await getRepositories()
  const session = await requireAppSession()

  if (isDemoSession(session)) {
    return null
  }

  const wedding = await getCurrentWeddingUseCase({
    weddingRepository: repositories.wedding,
    appUserId: session.appUser.id,
  })

  return wedding ? { repositories, wedding } : null
}

function revalidateGuestbook(slug: string) {
  revalidatePath("/app/firmas")
  revalidatePath(`/w/${slug}`)
}

/**
 * Los novios ocultan una firma del tablón o la vuelven a publicar. Devuelve
 * `false` si no se pudo guardar (sesión demo, sin boda o firma de otra boda).
 */
export async function setGuestbookSignatureStatusAction(input: unknown): Promise<boolean> {
  const parsed = setSignatureStatusSchema.safeParse(input)

  if (!parsed.success) {
    return false
  }

  const context = await loadModerationContext()

  if (!context) {
    return false
  }

  const updated = await setGuestbookSignatureStatusUseCase({
    guestbookRepository: context.repositories.guestbook,
    weddingId: context.wedding.id,
    signatureId: parsed.data.signatureId,
    status: parsed.data.status,
  })

  if (updated) {
    revalidateGuestbook(context.wedding.slug)
  }

  return updated
}

/** Los novios borran una firma para siempre. Mismas reglas que al ocultarla. */
export async function deleteGuestbookSignatureAction(input: unknown): Promise<boolean> {
  const parsed = deleteSignatureSchema.safeParse(input)

  if (!parsed.success) {
    return false
  }

  const context = await loadModerationContext()

  if (!context) {
    return false
  }

  const deleted = await deleteGuestbookSignatureUseCase({
    guestbookRepository: context.repositories.guestbook,
    weddingId: context.wedding.id,
    signatureId: parsed.data.signatureId,
  })

  if (deleted) {
    revalidateGuestbook(context.wedding.slug)
  }

  return deleted
}
