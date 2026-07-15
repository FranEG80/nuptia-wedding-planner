"use client"

import { useState } from "react"

import { respondToInvitationAction } from "@/domains/invitations/adapters/next/actions"
import type {
  PublicInvitationGuestDto,
  PublicInvitationMenuDto,
} from "@/domains/invitations/application/dtos/public-invitation.dto"
import {
  RsvpExperience,
  type RsvpSubmitPayload,
} from "@/domains/invitations/adapters/next/components/rsvp-experience"
import { DemoRsvpExperience } from "@/domains/invitations/adapters/next/components/demo-rsvp-experience"

export function PublicRsvpPanel({
  token,
  guests,
  menu,
  title,
  subtitle,
  panelMotion,
  experience = "default",
}: {
  token: string
  guests: PublicInvitationGuestDto[]
  menu: PublicInvitationMenuDto | null
  title: string
  subtitle: string
  panelMotion: "slide-up" | "slide-left"
  experience?: "default" | "demo"
}) {
  const [currentGuests, setCurrentGuests] = useState(guests)

  async function submitResponse(payload: RsvpSubmitPayload) {
    const response = await respondToInvitationAction({
      token,
      message: payload.message,
      guests: payload.guests,
    })

    if (response) {
      setCurrentGuests(response.guests)
    }

    return response
  }

  if (experience === "demo") {
    return (
      <DemoRsvpExperience
        guests={currentGuests}
        menu={menu}
        onSubmit={submitResponse}
        title={title}
        subtitle={subtitle}
      />
    )
  }

  return (
    <RsvpExperience
      guests={currentGuests}
      menu={menu}
      confirmationSeed={token}
      onSubmit={submitResponse}
      title={title}
      subtitle={subtitle}
      panelMotion={panelMotion}
    />
  )
}
