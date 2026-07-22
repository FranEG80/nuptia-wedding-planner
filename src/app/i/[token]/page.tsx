import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"

import { getRepositories } from "@/composition/repositories"
import { ResolvedInvitationTemplate } from "@/domains/invitations/adapters/next/components/resolve-invitation-template"
import { PublicRsvpPanel } from "@/domains/invitations/adapters/next/components/public-rsvp-panel"
import { getPublicInvitationByTokenUseCase } from "@/domains/invitations/application/use-cases/get-public-invitation-by-token.use-case"
import { normalizeInvitationTemplateId } from "@/domains/invitations/domain/invitation-template-options"

const getInvitationByToken = cache(async (token: string) => {
  const repositories = await getRepositories()

  return getPublicInvitationByTokenUseCase({
    guestRepository: repositories.guest,
    invitationRepository: repositories.invitation,
    weddingRepository: repositories.wedding,
    token,
  })
})

function formatWeddingDate(date: string) {
  return new Date(date).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  const invitation = await getInvitationByToken(token)

  if (!invitation) {
    return { title: "Invitación | Nuptia" }
  }

  const dateLabel = formatWeddingDate(invitation.wedding.date)
  const title = `${invitation.wedding.displayName} · ${dateLabel}`
  const greeting = invitation.groupName ? `${invitation.groupName}, e` : "E"
  const description = `${greeting}stáis invitados a la boda de ${invitation.wedding.displayName} el ${dateLabel} en ${invitation.wedding.primaryCity}.`
  let [domain, protocol] = process.env.APP_URL.split("://"), baseUrl, customOgImage;
  if (invitation.design.templateId === "maria-daniela") {
    domain = "bodamariadanielaynacho.es"
    protocol = "https"
    baseUrl = `${protocol}://${domain}`
    customOgImage = `${baseUrl}/images/templates/maria-daniela/ogimage/opengraph_image.jpg`
  }

  if (customOgImage) {
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        images: [
          {
            url: customOgImage,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [customOgImage],
      },
    }
  }

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default async function PublicInvitationRoutePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const invitation = await getInvitationByToken(token)

  if (!invitation) {
    notFound()
  }

  const templateId = normalizeInvitationTemplateId(invitation.design.templateId)

  return (
    <ResolvedInvitationTemplate
      templateId={templateId}
      wedding={invitation.wedding}
      content={invitation.design.content}
      rsvpSlot={
        <PublicRsvpPanel
          token={token}
          guests={invitation.guests}
          menu={invitation.menu}
          title={invitation.design.content.rsvpTitle}
          subtitle={invitation.design.content.rsvpSubtitle}
          panelMotion={invitation.design.content.rsvpPanelMotion}
          experience={templateId === "maria-daniela" ? "demo" : "default"}
        />
      }
    />
  )
}
