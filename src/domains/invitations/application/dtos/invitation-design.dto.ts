import { z } from "zod"

import {
  DEFAULT_INVITATION_CONTENT,
  type InvitationContent,
  type InvitationDesign,
  type InvitationTemplateId,
} from "@/domains/invitations/domain/invitation-design"
import {
  normalizeInvitationColorPresetId,
  normalizeInvitationFontPairId,
  normalizeInvitationPhotoAssetId,
  normalizeInvitationSectionVisibility,
  INVITATION_TEMPLATES,
} from "@/domains/invitations/domain/invitation-template-options"

const scheduleItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  date: z.string(),
  time: z.string(),
  location: z.string(),
  mapsUrl: z.string(),
  description: z.string(),
})

const travelItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  imageSrc: z.string(),
  websiteUrl: z.string(),
  mapsUrl: z.string(),
})

const registryItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.string(),
})

const visibleSectionsSchema = z.object({
  story: z.boolean().optional(),
  schedule: z.boolean().optional(),
  venue: z.boolean().optional(),
  travel: z.boolean().optional(),
  registry: z.boolean().optional(),
  questions: z.boolean().optional(),
  rsvp: z.boolean().optional(),
})

const rsvpPanelMotionSchema = z
  .enum(["slide-up", "slide-left"])
  .optional()

const storySchema = z
  .union([z.string(), z.array(z.string())])
  .transform((story) => (typeof story === "string" ? [story] : story))

export const invitationContentSchema = z.object({
  fontPairId: z.string().optional(),
  colorPresetId: z.string().optional(),
  photoAssetId: z.string().optional(),
  visibleSections: visibleSectionsSchema.optional(),
  eyebrow: z.string(),
  heroWord: z.string(),
  storyTitle: z.string(),
  story: storySchema,
  scheduleTitle: z.string(),
  schedule: z.array(scheduleItemSchema).min(1),
  venueTitle: z.string(),
  venueNote: z.string(),
  travelTitle: z.string(),
  travel: z.array(travelItemSchema),
  registryTitle: z.string(),
  registryIntro: z.string(),
  registryNote: z.string(),
  registry: z.array(registryItemSchema),
  questionsTitle: z.string(),
  contactEmail: z.string(),
  rsvpTitle: z.string(),
  rsvpSubtitle: z.string(),
  rsvpPanelMotion: rsvpPanelMotionSchema,
  whatsappMessage: z.string(),
  heroImageSrc: z.string(),
  monogramImageSrc: z.string(),
})

const TemplateInvitationArray = INVITATION_TEMPLATES.map((template) => template.id)

export const updateInvitationDesignSchema = z.object({
  templateId: z.enum(TemplateInvitationArray).optional(),
  titleFont: z.string().optional(),
  palette: z.string().optional(),
  openingEffect: z.string().optional(),
  musicEnabled: z.boolean().optional(),
  content: invitationContentSchema.optional(),
})

export type InvitationContentDto = InvitationContent

export interface InvitationDesignDto {
  id: string
  weddingId: string
  templateId: InvitationTemplateId
  titleFont: InvitationDesign["titleFont"]
  palette: InvitationDesign["palette"]
  content: InvitationContentDto
  openingEffect: string
  musicEnabled: boolean
}

export type UpdateInvitationDesignDto = Partial<
  Pick<
    InvitationDesignDto,
    | "templateId"
    | "titleFont"
    | "palette"
    | "openingEffect"
    | "musicEnabled"
    | "content"
  >
>

export function parseInvitationContent(value: unknown): InvitationContent {
  if (!value) {
    return DEFAULT_INVITATION_CONTENT
  }

  const raw =
    typeof value === "string"
      ? safeJsonParse(value)
      : value
  const parsed = invitationContentSchema.partial().safeParse(raw)

  if (!parsed.success) {
    return DEFAULT_INVITATION_CONTENT
  }

  return {
    ...DEFAULT_INVITATION_CONTENT,
    ...parsed.data,
    fontPairId: normalizeInvitationFontPairId(parsed.data.fontPairId),
    colorPresetId: normalizeInvitationColorPresetId(parsed.data.colorPresetId),
    photoAssetId: normalizeInvitationPhotoAssetId(parsed.data.photoAssetId),
    visibleSections: normalizeInvitationSectionVisibility(parsed.data.visibleSections),
    rsvpPanelMotion: parsed.data.rsvpPanelMotion ?? DEFAULT_INVITATION_CONTENT.rsvpPanelMotion,
    schedule:
      parsed.data.schedule && parsed.data.schedule.length > 0
        ? parsed.data.schedule.map((item, index) => ({
            ...DEFAULT_INVITATION_CONTENT.schedule[index % DEFAULT_INVITATION_CONTENT.schedule.length],
            ...item,
          }))
        : DEFAULT_INVITATION_CONTENT.schedule,
    travel: parsed.data.travel ?? DEFAULT_INVITATION_CONTENT.travel,
    registry: parsed.data.registry ?? DEFAULT_INVITATION_CONTENT.registry,
  }
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value) as unknown
  } catch {
    return null
  }
}

export function toInvitationDesignDto(
  design: InvitationDesign,
): InvitationDesignDto {
  return {
    id: design.id,
    weddingId: design.weddingId,
    templateId: design.templateId,
    titleFont: design.titleFont,
    palette: design.palette,
    content: {
      ...design.content,
      fontPairId: design.titleFont,
      colorPresetId: design.palette,
    },
    openingEffect: design.openingEffect,
    musicEnabled: design.musicEnabled,
  }
}
