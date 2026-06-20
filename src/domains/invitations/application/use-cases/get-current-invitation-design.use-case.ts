import type { InvitationRepository } from "@/domains/invitations/domain/ports/invitation.repository"
import {
  toInvitationDesignDto,
  type InvitationDesignDto,
} from "@/domains/invitations/application/dtos/invitation-design.dto"

export async function getCurrentInvitationDesignUseCase(input: {
  invitationRepository: InvitationRepository
  weddingId: string
}): Promise<InvitationDesignDto | null> {
  const design = await input.invitationRepository.findCurrentDesignByWeddingId(
    input.weddingId,
  )

  return design ? toInvitationDesignDto(design) : null
}
