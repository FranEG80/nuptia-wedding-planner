import type {
  GuestRepository,
  RespondToPartyGuestInput,
} from "@/domains/guests/domain/ports/guest.repository"

export async function respondToPublicInvitationUseCase(input: {
  guestRepository: GuestRepository
  token: string
  guests: RespondToPartyGuestInput[]
  message?: string | null
}) {
  return input.guestRepository.respondToPartyWithDetails(input.token, {
    guests: input.guests,
    message: input.message,
  })
}
