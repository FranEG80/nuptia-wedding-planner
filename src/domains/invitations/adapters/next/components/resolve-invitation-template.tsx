import type { ComponentProps, ComponentType } from "react"

import { BouquetInvitationTemplate } from "@/domains/invitations/adapters/next/components/bouquet-invitation-template"
import { CustomInvitationTemplate } from "@/domains/invitations/adapters/next/components/custom-invitation-template"
import type { InvitationTemplateId } from "@/domains/invitations/domain/invitation-template-options"

type TemplateProps = ComponentProps<typeof BouquetInvitationTemplate>

const TEMPLATE_COMPONENTS: Record<InvitationTemplateId, ComponentType<TemplateProps>> = {
  bouquet: BouquetInvitationTemplate,
  custom: CustomInvitationTemplate,
}

export function ResolvedInvitationTemplate({
  templateId,
  ...props
}: TemplateProps & { templateId: InvitationTemplateId }) {
  const Template = TEMPLATE_COMPONENTS[templateId] ?? BouquetInvitationTemplate
  return <Template {...props} />
}
