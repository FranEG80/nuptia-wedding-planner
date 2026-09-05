import { TokenWeddingSite } from "@/domains/wedding-sites/adapters/next/components/themes/token-wedding-site"
import type { WeddingSiteThemeProps } from "@/domains/wedding-sites/adapters/next/components/themes/wedding-site-theme-props"

export function DemoWeddingSite(props: WeddingSiteThemeProps) {
  return <TokenWeddingSite {...props} variant="demo" />
}
