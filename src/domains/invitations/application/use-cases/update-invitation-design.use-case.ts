import type { InvitationRepository } from "@/domains/invitations/domain/ports/invitation.repository"
import {
  toInvitationDesignDto,
  type InvitationDesignDto,
  type UpdateInvitationDesignDto,
} from "@/domains/invitations/application/dtos/invitation-design.dto"

export async function updateInvitationDesignUseCase(input: {
  invitationRepository: InvitationRepository
  weddingId: string
  data: UpdateInvitationDesignDto
}): Promise<InvitationDesignDto> {
  const design = await input.invitationRepository.updateDesign(
    input.weddingId,
    input.data,
  )

  return toInvitationDesignDto(design)
}
