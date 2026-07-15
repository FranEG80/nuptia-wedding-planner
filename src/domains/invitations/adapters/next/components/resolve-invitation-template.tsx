import type { ComponentProps, ComponentType } from "react"

import { BouquetInvitationTemplate } from "@/domains/invitations/adapters/next/components/bouquet-invitation-template"
import { MariaDanielaInvitationTemplate } from "@/domains/invitations/adapters/next/components/demo-invitation-template"
import { LegacyDemoInvitationTemplate } from "@/domains/invitations/adapters/next/components/legacy-demo-invitation-template"
import type { InvitationTemplateId } from "@/domains/invitations/domain/invitation-template-options"

type TemplateProps = ComponentProps<typeof BouquetInvitationTemplate>

const TEMPLATE_COMPONENTS: Record<InvitationTemplateId, ComponentType<TemplateProps>> = {
  bouquet: BouquetInvitationTemplate,
  demo: LegacyDemoInvitationTemplate,
  "maria-daniela": MariaDanielaInvitationTemplate,
}

export function ResolvedInvitationTemplate({
  templateId,
  ...props
}: TemplateProps & { templateId: InvitationTemplateId }) {
  const Template = TEMPLATE_COMPONENTS[templateId] ?? BouquetInvitationTemplate
  return <Template {...props} />
}
