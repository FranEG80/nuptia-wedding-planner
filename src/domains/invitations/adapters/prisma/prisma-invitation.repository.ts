import type { PrismaClient } from "@generated/prisma/client"
import type {
  InvitationRepository,
  UpdateInvitationDesignInput,
} from "@/domains/invitations/domain/ports/invitation.repository"
import type { InvitationDesign } from "@/domains/invitations/domain/invitation-design"
import { parseInvitationContent } from "@/domains/invitations/application/dtos/invitation-design.dto"
import {
  normalizeInvitationColorPresetId,
  normalizeInvitationFontPairId,
  normalizeInvitationTemplateId,
} from "@/domains/invitations/domain/invitation-template-options"

type PrismaInvitationDesignRecord = {
  id: string
  weddingId: string
  templateId: string
  titleFont: string
  palette: string
  content: string
  openingEffect: string
  musicEnabled: boolean
}

function titleFontFromDb(value: string): InvitationDesign["titleFont"] {
  return normalizeInvitationFontPairId(value)
}

function toInvitationDesign(
  record: PrismaInvitationDesignRecord,
): InvitationDesign {
  return {
    id: record.id,
    weddingId: record.weddingId,
    templateId: normalizeInvitationTemplateId(record.templateId),
    titleFont: titleFontFromDb(record.titleFont),
    palette: normalizeInvitationColorPresetId(record.palette),
    content: parseInvitationContent(record.content),
    openingEffect: record.openingEffect,
    musicEnabled: record.musicEnabled,
  }
}

export class PrismaInvitationRepository implements InvitationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findCurrentDesignByWeddingId(
    weddingId: string,
  ): Promise<InvitationDesign | null> {
    const design = await this.prisma.invitationDesign.findUnique({
      where: { weddingId },
    })

    return design ? toInvitationDesign(design) : null
  }

  async updateDesign(
    weddingId: string,
    input: UpdateInvitationDesignInput,
  ): Promise<InvitationDesign> {
    const design = await this.prisma.invitationDesign.upsert({
      where: { weddingId },
      update: {
        templateId: input.templateId,
        titleFont: input.titleFont,
        palette: input.palette,
        content: input.content ? JSON.stringify(input.content) : undefined,
        openingEffect: input.openingEffect,
        musicEnabled: input.musicEnabled,
      },
      create: {
        weddingId,
        templateId: input.templateId ?? "bouquet",
        titleFont: input.titleFont ?? "serif",
        palette: input.palette ?? "sage",
        content: input.content ? JSON.stringify(input.content) : "{}",
        openingEffect: input.openingEffect ?? "envelope",
        musicEnabled: input.musicEnabled ?? false,
      },
    })

    return toInvitationDesign(design)
  }
}
