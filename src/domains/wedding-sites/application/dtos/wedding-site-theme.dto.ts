import type { InvitationDesignDto } from "@/domains/invitations/application/dtos/invitation-design.dto"
import {
  DEFAULT_WEDDING_SITE_THEME,
  normalizeWeddingSiteTheme,
  type WeddingSiteTheme,
} from "@/domains/wedding-sites/domain/wedding-site-theme"

/**
 * El diseño de la invitación es la única fuente de verdad del theme, así que la
 * web de boda lo lee de ahí en lugar de guardar una copia propia.
 */
export function weddingSiteThemeFromInvitationDesign(
  design: InvitationDesignDto | null | undefined,
): WeddingSiteTheme {
  if (!design) {
    return DEFAULT_WEDDING_SITE_THEME
  }

  return normalizeWeddingSiteTheme({
    templateId: design.templateId,
    fontPairId: design.content?.fontPairId ?? design.titleFont,
    colorPresetId: design.content?.colorPresetId ?? design.palette,
  })
}
