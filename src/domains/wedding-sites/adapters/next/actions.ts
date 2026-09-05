"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getRepositories } from "@/composition/repositories"
import { requireAppSession } from "@/core/auth"
import { isDemoSession } from "@/core/demo/is-demo-session"
import { updateInvitationDesignUseCase } from "@/domains/invitations/application/use-cases/update-invitation-design.use-case"
import { NACHO_WEDDING_SLUG } from "@/domains/wedding-sites/application/dtos/wedding-experience.dto"
import { weddingSiteThemeFromInvitationDesign } from "@/domains/wedding-sites/application/dtos/wedding-site-theme.dto"
import { updateWeddingSiteModuleUseCase } from "@/domains/wedding-sites/application/use-cases/update-wedding-site-module.use-case"
import { getCurrentWeddingUseCase } from "@/domains/weddings/application/use-cases/get-current-wedding.use-case"

const updateModuleSchema = z.object({
  type: z.enum(["location", "menu", "timeline", "gifts", "spotify", "gallery", "guestbook"]),
  enabled: z.boolean(),
})

const updateTemplateSchema = z.object({
  templateId: z.enum(["bouquet", "demo", "maria-daniela"]),
})

export async function updateWeddingSiteModuleAction(input: unknown) {
  const parsed = updateModuleSchema.parse(input)
  const repositories = await getRepositories()
  const session = await requireAppSession()

  if (isDemoSession(session)) {
    return null
  }

  const wedding = await getCurrentWeddingUseCase({
    weddingRepository: repositories.wedding,
    appUserId: session.appUser.id,
  })

  if (!wedding) {
    return null
  }

  const siteModule = await updateWeddingSiteModuleUseCase({
    weddingSiteRepository: repositories.weddingSite,
    weddingId: wedding.id,
    type: parsed.type,
    data: { enabled: parsed.enabled },
  })

  revalidatePath("/app/web")
  revalidatePath("/app/web-preview")
  revalidatePath(`/w/${wedding.slug}`)

  return siteModule
}

/**
 * El template es compartido con la invitación digital, así que se guarda en el
 * mismo diseño y se refrescan ambas superficies.
 */
export async function updateWeddingSiteTemplateAction(input: unknown) {
  const parsed = updateTemplateSchema.parse(input)
  const repositories = await getRepositories()
  const session = await requireAppSession()

  if (isDemoSession(session)) {
    return null
  }

  const wedding = await getCurrentWeddingUseCase({
    weddingRepository: repositories.wedding,
    appUserId: session.appUser.id,
  })

  if (!wedding) {
    return null
  }

  const design = await updateInvitationDesignUseCase({
    invitationRepository: repositories.invitation,
    weddingId: wedding.id,
    data: {
      // Esta boda usa un diseño a medida y no debe poder sustituirse.
      templateId:
        wedding.slug === NACHO_WEDDING_SLUG ? "maria-daniela" : parsed.templateId,
    },
  })

  revalidatePath("/app/web")
  revalidatePath("/app/web-preview")
  revalidatePath("/app/invitacion")
  revalidatePath(`/w/${wedding.slug}`)

  return weddingSiteThemeFromInvitationDesign(design)
}
