import {
  DEFAULT_INVITATION_COLOR_PRESET_ID,
  DEFAULT_INVITATION_FONT_PAIR_ID,
  DEFAULT_INVITATION_TEMPLATE_ID,
  normalizeInvitationColorPresetId,
  normalizeInvitationFontPairId,
  normalizeInvitationTemplateId,
  type InvitationColorPresetId,
  type InvitationFontPairId,
  type InvitationTemplateId,
} from "@/domains/invitations/domain/invitation-template-options"

/**
 * La web de boda comparte template, tipografías y paleta con la invitación
 * digital: se elige una sola vez y se aplica a las dos superficies.
 */
export type WeddingSiteTemplateId = InvitationTemplateId

export interface WeddingSiteTheme {
  templateId: WeddingSiteTemplateId
  fontPairId: InvitationFontPairId
  colorPresetId: InvitationColorPresetId
}

export const DEFAULT_WEDDING_SITE_THEME: WeddingSiteTheme = {
  templateId: DEFAULT_INVITATION_TEMPLATE_ID,
  fontPairId: DEFAULT_INVITATION_FONT_PAIR_ID,
  colorPresetId: DEFAULT_INVITATION_COLOR_PRESET_ID,
}

export function normalizeWeddingSiteTheme(theme: {
  templateId?: string
  fontPairId?: string
  colorPresetId?: string
}): WeddingSiteTheme {
  return {
    templateId: normalizeInvitationTemplateId(theme.templateId),
    fontPairId: normalizeInvitationFontPairId(theme.fontPairId),
    colorPresetId: normalizeInvitationColorPresetId(theme.colorPresetId),
  }
}
