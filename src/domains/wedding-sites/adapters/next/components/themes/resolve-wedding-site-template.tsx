import type { ComponentType } from "react"

import { BouquetWeddingSite } from "@/domains/wedding-sites/adapters/next/components/themes/bouquet-wedding-site"
import { DemoWeddingSite } from "@/domains/wedding-sites/adapters/next/components/themes/demo-wedding-site"
import { MariaDanielaWeddingSite } from "@/domains/wedding-sites/adapters/next/components/themes/maria-daniela-wedding-site"
import type { WeddingSiteThemeProps } from "@/domains/wedding-sites/adapters/next/components/themes/wedding-site-theme-props"
import type { WeddingSiteTemplateId } from "@/domains/wedding-sites/domain/wedding-site-theme"

const TEMPLATE_COMPONENTS: Record<WeddingSiteTemplateId, ComponentType<WeddingSiteThemeProps>> = {
  bouquet: BouquetWeddingSite,
  demo: DemoWeddingSite,
  "maria-daniela": MariaDanielaWeddingSite,
}

export function ResolvedWeddingSiteTemplate(props: WeddingSiteThemeProps) {
  const Template = TEMPLATE_COMPONENTS[props.theme.templateId] ?? BouquetWeddingSite

  return <Template {...props} />
}
