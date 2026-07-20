"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getRepositories } from "@/composition/repositories"
import { requireAppSession } from "@/core/auth"
import { isDemoSession } from "@/core/demo/is-demo-session"
import { updateWeddingSiteModuleUseCase } from "@/domains/wedding-sites/application/use-cases/update-wedding-site-module.use-case"
import { getCurrentWeddingUseCase } from "@/domains/weddings/application/use-cases/get-current-wedding.use-case"

const updateModuleSchema = z.object({
  type: z.enum(["location", "menu", "timeline", "gifts", "spotify", "gallery", "guestbook"]),
  enabled: z.boolean(),
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
