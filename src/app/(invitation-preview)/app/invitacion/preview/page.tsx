import { notFound } from "next/navigation"

import { getRepositories } from "@/composition/repositories"
import { requireAppSession } from "@/core/auth"
import { ResolvedInvitationTemplate } from "@/domains/invitations/adapters/next/components/resolve-invitation-template"
import { RsvpExperience } from "@/domains/invitations/adapters/next/components/rsvp-experience"
import { DemoRsvpExperience } from "@/domains/invitations/adapters/next/components/demo-rsvp-experience"
import { applyInvitationPreviewSearchParams } from "@/domains/invitations/application/dtos/invitation-preview-params.dto"
import { getCurrentInvitationDesignUseCase } from "@/domains/invitations/application/use-cases/get-current-invitation-design.use-case"
import { normalizeInvitationTemplateId } from "@/domains/invitations/domain/invitation-template-options"
import { getCurrentWeddingUseCase } from "@/domains/weddings/application/use-cases/get-current-wedding.use-case"

export default async function InvitationPreviewRoutePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const repositories = await getRepositories()
  const session = await requireAppSession()
  const wedding = await getCurrentWeddingUseCase({
    weddingRepository: repositories.wedding,
    appUserId: session.appUser.id,
  })

  if (!wedding) {
    notFound()
  }

  const design = await getCurrentInvitationDesignUseCase({
    invitationRepository: repositories.invitation,
    weddingId: wedding.id,
  })

  if (!design) {
    notFound()
  }

  const resolvedSearchParams = await searchParams
  const templateId = normalizeInvitationTemplateId(
    typeof resolvedSearchParams.template === "string"
      ? resolvedSearchParams.template
      : design.templateId,
  )

  const content = applyInvitationPreviewSearchParams(
    {
      ...design.content,
      fontPairId: design.titleFont,
      colorPresetId: design.palette,
    },
    resolvedSearchParams,
  )

  return (
    <ResolvedInvitationTemplate
      templateId={templateId}
      wedding={wedding}
      content={content}
      preview
      rsvpSlot={templateId === "maria-daniela" ? (
        <DemoRsvpExperience
          preview
          menu={previewMenu}
          title={content.rsvpTitle}
          subtitle={content.rsvpSubtitle}
          guests={previewGuests}
        />
      ) : (
        <RsvpExperience
          preview
          confirmationSeed="preview"
          menu={previewMenu}
          title={content.rsvpTitle}
          subtitle={content.rsvpSubtitle}
          panelMotion={content.rsvpPanelMotion}
          guests={previewGuests}
        />
      )}
    />
  )
}

const previewMenu = {
  id: "preview-menu",
  name: "Menú de boda",
  description: null,
  dishes: [{
    id: "preview-menu-dish-principal",
    name: "Plato principal",
    description: null,
    options: [
      { id: "preview-opt-carne", name: "Solomillo de ternera", description: null },
      { id: "preview-opt-pescado", name: "Lubina a la sal", description: null },
      { id: "preview-opt-vegetariano", name: "Risotto de setas", description: null },
    ],
  }],
}

const previewGuests = [
  { id: "preview-guest-1", role: "primary" as const, name: "Fran Demo", email: "fran.enriquez.dev@demo.com", phone: null, notes: "", rsvp: "Sin respuesta" as const, menuSelections: [] },
  { id: "preview-guest-2", role: "companion" as const, name: "María Demo", email: null, phone: null, notes: "", rsvp: "Sin respuesta" as const, menuSelections: [] },
]
