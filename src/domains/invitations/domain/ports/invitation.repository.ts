import type { InvitationDesign } from "@/domains/invitations/domain/invitation-design"

export interface UpdateInvitationDesignInput {
  templateId?: InvitationDesign["templateId"]
  titleFont?: InvitationDesign["titleFont"]
  palette?: InvitationDesign["palette"]
  content?: InvitationDesign["content"]
  openingEffect?: string
  musicEnabled?: boolean
}

export interface InvitationRepository {
  findCurrentDesignByWeddingId(weddingId: string): Promise<InvitationDesign | null>
  updateDesign(
    weddingId: string,
    input: UpdateInvitationDesignInput,
  ): Promise<InvitationDesign>
}
