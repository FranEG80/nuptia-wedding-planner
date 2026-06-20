import type { PrismaClient } from "@generated/prisma/client"
import type {
  PublicWeddingSite,
  UpdateWeddingSiteModuleInput,
  WeddingSiteRepository,
} from "@/domains/wedding-sites/domain/ports/wedding-site.repository"
import type {
  WeddingSiteModule,
  WeddingSiteModuleType,
  WeddingTimelineItem,
} from "@/domains/wedding-sites/domain/wedding-site-module"
import type {
  Wedding,
  WeddingMemberRoleCode,
} from "@/domains/weddings/domain/wedding"

const weddingInclude = {
  members: {
    include: { role: true },
    orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }],
  },
  ceremonyLocation: true,
  restaurant: true,
  menu: true,
  siteModules: {
    where: { enabled: true },
    orderBy: { sortOrder: "asc" as const },
  },
}

type PrismaWeddingRecord = NonNullable<
  Awaited<ReturnType<PrismaWeddingSiteRepository["findPublicRecordBySlug"]>>
>

type PrismaWeddingSiteModuleRecord = {
  id: string
  weddingId: string
  type: string
  title: string
  desc: string
  enabled: boolean
  sortOrder: number
}

const moduleTypes = new Set<WeddingSiteModuleType>([
  "location",
  "menu",
  "timeline",
  "gifts",
  "spotify",
  "gallery",
  "guestbook",
])

const defaultTimeline: WeddingTimelineItem[] = [
  { time: "17:00", label: "Ceremonia", icon: "church" },
  { time: "18:30", label: "Cóctel de bienvenida", icon: "glass" },
  { time: "21:00", label: "Cena", icon: "utensils" },
  { time: "00:00", label: "Fiesta", icon: "music" },
]

function roleCodeFromDb(value: string): WeddingMemberRoleCode {
  if (
    value === "owner" ||
    value === "groom" ||
    value === "bride" ||
    value === "partner" ||
    value === "planner"
  ) {
    return value
  }

  return "partner"
}

function toWedding(record: PrismaWeddingRecord): Wedding {
  return {
    id: record.id,
    ownerId: record.ownerId,
    slug: record.slug,
    date: record.date.toISOString(),
    status: record.status === "published" ? "published" : "draft",
    partnerInviteCode: record.partnerInviteCode,
    partnerInviteEmail: record.partnerInviteEmail,
    restaurantId: record.restaurantId,
    menuId: record.menuId,
    members: record.members.map((member) => ({
      id: member.id,
      weddingId: member.weddingId,
      appUserId: member.appUserId,
      role: {
        id: member.role.id,
        code: roleCodeFromDb(member.role.code),
        label: member.role.label,
        sortOrder: member.role.sortOrder,
      },
      displayName: member.displayName,
      sortOrder: member.sortOrder,
    })),
    ceremonyLocation: record.ceremonyLocation
      ? {
          id: record.ceremonyLocation.id,
          weddingId: record.ceremonyLocation.weddingId,
          name: record.ceremonyLocation.name,
          address: record.ceremonyLocation.address,
          city: record.ceremonyLocation.city,
          mapsUrl: record.ceremonyLocation.mapsUrl,
        }
      : null,
    restaurant: record.restaurant
      ? {
          id: record.restaurant.id,
          name: record.restaurant.name,
          address: record.restaurant.address,
          city: record.restaurant.city,
          mapsUrl: record.restaurant.mapsUrl,
        }
      : null,
    menu: record.menu
      ? {
          id: record.menu.id,
          restaurantId: record.menu.restaurantId,
          name: record.menu.name,
          description: record.menu.description,
        }
      : null,
  }
}

function toModule(
  record: PrismaWeddingSiteModuleRecord,
): WeddingSiteModule | null {
  if (!moduleTypes.has(record.type as WeddingSiteModuleType)) {
    return null
  }

  return {
    id: record.id,
    weddingId: record.weddingId,
    type: record.type as WeddingSiteModuleType,
    title: record.title,
    desc: record.desc,
    enabled: record.enabled,
    sortOrder: record.sortOrder,
  }
}

function modulesFromRecords(records: PrismaWeddingSiteModuleRecord[]) {
  return records
    .map(toModule)
    .filter((module): module is WeddingSiteModule => module !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export class PrismaWeddingSiteRepository implements WeddingSiteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findPublicRecordBySlug(slug: string) {
    return this.prisma.wedding.findUnique({
      where: { slug },
      include: weddingInclude,
    })
  }

  async listModulesByWeddingId(weddingId: string): Promise<WeddingSiteModule[]> {
    const modules = await this.prisma.weddingSiteModule.findMany({
      where: { weddingId },
      orderBy: { sortOrder: "asc" },
    })

    return modulesFromRecords(modules)
  }

  async findPublicBySlug(slug: string): Promise<PublicWeddingSite | null> {
    const wedding = await this.findPublicRecordBySlug(slug)

    if (!wedding || wedding.status !== "published") {
      return null
    }

    return {
      slug,
      wedding: toWedding(wedding),
      modules: modulesFromRecords(wedding.siteModules),
      timeline: defaultTimeline,
    }
  }

  async updateModule(
    weddingId: string,
    type: WeddingSiteModule["type"],
    input: UpdateWeddingSiteModuleInput,
  ): Promise<WeddingSiteModule | null> {
    const current = await this.prisma.weddingSiteModule.findUnique({
      where: {
        weddingId_type: {
          weddingId,
          type,
        },
      },
    })

    if (!current) {
      return null
    }

    const siteModule = await this.prisma.weddingSiteModule.update({
      where: {
        weddingId_type: {
          weddingId,
          type,
        },
      },
      data: {
        enabled: input.enabled,
        sortOrder: input.sortOrder,
      },
    })

    return toModule(siteModule)
  }
}
