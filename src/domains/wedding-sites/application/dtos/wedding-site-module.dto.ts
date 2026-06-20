import type {
  WeddingSiteModule,
  WeddingTimelineItem,
} from "@/domains/wedding-sites/domain/wedding-site-module"

export interface WeddingSiteModuleDto {
  id: string
  weddingId: string
  type: WeddingSiteModule["type"]
  title: string
  desc: string
  enabled: boolean
  sortOrder: number
}

export interface WeddingTimelineItemDto {
  time: string
  label: string
  icon: string
}

export type UpdateWeddingSiteModuleDto = Partial<
  Pick<WeddingSiteModuleDto, "enabled" | "sortOrder">
>

export function toWeddingSiteModuleDto(
  module: WeddingSiteModule,
): WeddingSiteModuleDto {
  return {
    id: module.id,
    weddingId: module.weddingId,
    type: module.type,
    title: module.title,
    desc: module.desc,
    enabled: module.enabled,
    sortOrder: module.sortOrder,
  }
}

export function toWeddingTimelineItemDto(
  item: WeddingTimelineItem,
): WeddingTimelineItemDto {
  return {
    time: item.time,
    label: item.label,
    icon: item.icon,
  }
}
