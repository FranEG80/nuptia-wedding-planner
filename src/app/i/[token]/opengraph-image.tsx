import { ImageResponse } from "next/og"

import { getPublicInvitationQuery } from "@/composition/repositories"
import { getPublicInvitationByTokenUseCase } from "@/domains/invitations/application/use-cases/get-public-invitation-by-token.use-case"
import {
  getInvitationColorPreset,
  getInvitationFontPair,
} from "@/domains/invitations/domain/invitation-template-options"

export const alt = "Invitación de boda"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const TITLE_FONT_FAMILY: Record<string, string> = {
  "playfair-inter": "Playfair Display",
  "cormorant-lato": "Cormorant Garamond",
  "libre-manrope": "Libre Baskerville",
  "marcellus-mulish": "Marcellus",
  "fraunces-source": "Fraunces",
  "cinzel-montserrat": "Cinzel",
  "bodoni-nunito": "Bodoni Moda",
  "prata-work": "Prata",
}

async function loadGoogleFont(family: string, weight: number, text: string) {
  const params = new URLSearchParams({ family: `${family}:wght@${weight}`, text })
  const css = await fetch(
    `https://fonts.googleapis.com/css2?${params.toString()}`,
  ).then((response) => response.text())
  const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/)

  if (!match) {
    throw new Error(`No se pudo cargar la fuente ${family}`)
  }

  const response = await fetch(match[1])
  return response.arrayBuffer()
}

export default async function Image({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const publicInvitationQuery = await getPublicInvitationQuery()
  const invitation = await getPublicInvitationByTokenUseCase({
    publicInvitationQuery,
    token,
  })

  const displayName = invitation?.wedding.displayName ?? "Nuestra boda"
  const dateLabel = invitation
    ? new Date(invitation.wedding.date).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : ""
  const venueLine = invitation
    ? [
        invitation.wedding.ceremonyLocation?.name ?? invitation.wedding.restaurant?.name,
        invitation.wedding.primaryCity,
      ]
        .filter(Boolean)
        .join(" · ")
    : ""

  const colorPreset = getInvitationColorPreset(invitation?.design.content.colorPresetId)
  const fontPair = getInvitationFontPair(invitation?.design.content.fontPairId)
  const titleFontFamily = TITLE_FONT_FAMILY[fontPair.id] ?? "Playfair Display"

  const [titleFont, bodyFont] = await Promise.all([
    loadGoogleFont(titleFontFamily, 600, displayName || "Nuestra boda"),
    loadGoogleFont(
      "Inter",
      500,
      `${dateLabel} ${venueLine} OS INVITAMOS A LA BODA DE Nuptia`,
    ),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colorPreset.tokens.page,
          backgroundImage: `linear-gradient(135deg, ${colorPreset.tokens.page} 0%, ${colorPreset.tokens.panel} 100%)`,
          padding: "80px",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 64,
            width: 120,
            height: 3,
            backgroundColor: colorPreset.tokens.accent,
          }}
        />
        <div
          style={{
            display: "flex",
            fontFamily: "Inter",
            fontSize: 26,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: colorPreset.tokens.accent,
            marginBottom: 28,
          }}
        >
          Os invitamos a la boda de
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: titleFontFamily,
            fontSize: 88,
            color: colorPreset.tokens.heading,
            textAlign: "center",
            lineHeight: 1.15,
            maxWidth: 980,
          }}
        >
          {displayName}
        </div>
        {dateLabel ? (
          <div
            style={{
              display: "flex",
              fontFamily: "Inter",
              fontSize: 32,
              color: colorPreset.tokens.muted,
              marginTop: 40,
            }}
          >
            {dateLabel}
          </div>
        ) : null}
        {venueLine ? (
          <div
            style={{
              display: "flex",
              fontFamily: "Inter",
              fontSize: 24,
              color: colorPreset.tokens.muted,
              marginTop: 12,
            }}
          >
            {venueLine}
          </div>
        ) : null}
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 48,
            fontFamily: "Inter",
            fontSize: 22,
            letterSpacing: 2,
            color: colorPreset.tokens.accentDark,
          }}
        >
          Nuptia
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: titleFontFamily, data: titleFont, weight: 600, style: "normal" },
        { name: "Inter", data: bodyFont, weight: 500, style: "normal" },
      ],
    },
  )
}
