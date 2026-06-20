import type { InvitationDesign } from "@/domains/invitations/domain/invitation-design"
import { DEFAULT_INVITATION_CONTENT } from "@/domains/invitations/domain/invitation-design"
import { DEFAULT_INVITATION_FONT_PAIR_ID } from "@/domains/invitations/domain/invitation-template-options"
import type {
  InvitationRepository,
  UpdateInvitationDesignInput,
} from "@/domains/invitations/domain/ports/invitation.repository"
import { DEMO_WEDDING_ID } from "@/domains/weddings/adapters/demo/demo-wedding.repository"

let demoDesign: InvitationDesign = {
  id: "demo-invitation-design",
  weddingId: DEMO_WEDDING_ID,
  templateId: "bouquet",
  titleFont: DEFAULT_INVITATION_FONT_PAIR_ID,
  palette: "sage",
  content: DEFAULT_INVITATION_CONTENT,
  openingEffect: "envelope",
  musicEnabled: false,
}

export const demoInvitationRepository: InvitationRepository = {
  async findCurrentDesignByWeddingId(weddingId) {
    return demoDesign.weddingId === weddingId ? demoDesign : null
  },

  async updateDesign(weddingId, input: UpdateInvitationDesignInput) {
    demoDesign = {
      ...demoDesign,
      weddingId,
      ...input,
    }

    return demoDesign
  },
}
