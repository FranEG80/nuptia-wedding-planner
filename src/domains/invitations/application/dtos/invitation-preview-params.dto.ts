import {
  parseInvitationContent,
  type InvitationContentDto,
} from "@/domains/invitations/application/dtos/invitation-design.dto"
import {
  INVITATION_SECTIONS,
  normalizeInvitationColorPresetId,
  normalizeInvitationFontPairId,
  normalizeInvitationPhotoAssetId,
  normalizeInvitationSectionVisibility,
} from "@/domains/invitations/domain/invitation-template-options"

export type InvitationPreviewSearchParams = Record<
  string,
  string | string[] | undefined
>

export function applyInvitationPreviewSearchParams(
  content: InvitationContentDto,
  searchParams: InvitationPreviewSearchParams,
): InvitationContentDto {
  const draft = firstParam(searchParams.draft)
  const draftContent = draft ? safeJsonParse(safeDecode(draft)) : null
  const mergedContent = draftContent
    ? parseInvitationContent({ ...content, ...draftContent })
    : content

  const fontPairId = firstParam(searchParams.font)
  const colorPresetId = firstParam(searchParams.color)
  const photoAssetId = firstParam(searchParams.photo)
  const hidden = firstParam(searchParams.hidden)
  const hiddenSections = new Set(
    hidden
      ?.split(",")
      .map((section) => section.trim())
      .filter(Boolean) ?? [],
  )

  return {
    ...mergedContent,
    fontPairId: fontPairId
      ? normalizeInvitationFontPairId(fontPairId)
      : mergedContent.fontPairId,
    colorPresetId: colorPresetId
      ? normalizeInvitationColorPresetId(colorPresetId)
      : mergedContent.colorPresetId,
    photoAssetId: photoAssetId
      ? normalizeInvitationPhotoAssetId(photoAssetId)
      : mergedContent.photoAssetId,
    visibleSections: hidden
      ? normalizeInvitationSectionVisibility(
          INVITATION_SECTIONS.reduce<Record<string, boolean>>(
            (visibility, section) => ({
              ...visibility,
              [section.id]: !hiddenSections.has(section.id),
            }),
            {},
          ),
        )
      : mergedContent.visibleSections,
  }
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value) as unknown
  } catch {
    return null
  }
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}
