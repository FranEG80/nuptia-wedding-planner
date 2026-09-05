import type { WeddingExperienceContent } from "@/domains/wedding-sites/application/dtos/wedding-experience.dto"
import type { WeddingSitePage, WeddingSitePageId } from "@/domains/wedding-sites/domain/wedding-site-page"
import type { WeddingSiteTheme } from "@/domains/wedding-sites/domain/wedding-site-theme"

export interface WeddingSiteThemeProps {
  content: WeddingExperienceContent
  theme: WeddingSiteTheme
  pages: WeddingSitePage[]
  currentPage: WeddingSitePageId
  onNavigate: (page: WeddingSitePageId) => void
  preview?: boolean
}
