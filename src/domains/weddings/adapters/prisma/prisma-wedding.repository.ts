import type { Prisma, PrismaClient } from "@generated/prisma/client"
import type {
  CreateWeddingInput,
  UpdateWeddingInput,
  WeddingRepository,
} from "@/domains/weddings/domain/ports/wedding.repository"
import type {
  Wedding,
  WeddingMenuDetails,
  WeddingMemberRoleCode,
} from "@/domains/weddings/domain/wedding"

const roleIds = {
  owner: "role-owner",
  groom: "role-groom",
  bride: "role-bride",
  partner: "role-partner",
  planner: "role-planner",
} satisfies Record<WeddingMemberRoleCode, string>

const weddingInclude = {
  members: {
    include: { role: true },
    orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }],
  },
  ceremonyLocation: true,
  restaurant: true,
  menu: true,
}

const publicWeddingSelect = {
  id: true,
  ownerId: true,
  slug: true,
  date: true,
  status: true,
  partnerInviteCode: true,
  partnerInviteEmail: true,
  restaurantId: true,
  menuId: true,
  members: {
    select: {
      id: true,
      weddingId: true,
      appUserId: true,
      role: {
        select: {
          id: true,
          code: true,
          label: true,
          sortOrder: true,
        },
      },
      displayName: true,
      sortOrder: true,
    },
    orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }],
  },
  ceremonyLocation: {
    select: {
      id: true,
      weddingId: true,
      name: true,
      address: true,
      city: true,
      mapsUrl: true,
    },
  },
  restaurant: {
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      mapsUrl: true,
    },
  },
  menu: {
    select: {
      id: true,
      restaurantId: true,
      name: true,
      description: true,
    },
  },
} as const satisfies Prisma.WeddingSelect

type PrismaPublicWeddingRecord = Prisma.WeddingGetPayload<{
  select: typeof publicWeddingSelect
}>

type PrismaWeddingRecord = NonNullable<
  Awaited<ReturnType<PrismaWeddingRepository["findRecordById"]>>
>

function slugFromNames(names: readonly string[]) {
  return names
    .filter(Boolean)
    .join("-")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

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

function toPublicWedding(record: PrismaPublicWeddingRecord): Wedding {
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

function toMenuDetails(
  menu: NonNullable<
    Awaited<ReturnType<PrismaWeddingRepository["findMenuRecordByWeddingId"]>>
  >,
): WeddingMenuDetails {
  return {
    id: menu.id,
    restaurantId: menu.restaurantId,
    name: menu.name,
    description: menu.description,
    dishes: menu.menuDishes.map((menuDish) => ({
      id: menuDish.id,
      dishId: menuDish.dishId,
      name: menuDish.dish.name,
      description: menuDish.dish.description,
      sortOrder: menuDish.sortOrder,
      options: menuDish.dish.options.map((option) => ({
        id: option.id,
        name: option.name,
        description: option.description,
        sortOrder: option.sortOrder,
      })),
    })),
  }
}

export class PrismaWeddingRepository implements WeddingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findRecordById(id: string) {
    return this.prisma.wedding.findUnique({
      where: { id },
      include: weddingInclude,
    })
  }

  async findMenuRecordByWeddingId(weddingId: string) {
    const wedding = await this.prisma.wedding.findUnique({
      where: { id: weddingId },
      select: {
        menu: {
          include: {
            menuDishes: {
              include: {
                dish: {
                  include: {
                    options: {
                      orderBy: { sortOrder: "asc" },
                    },
                  },
                },
              },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    })

    return wedding?.menu ?? null
  }

  async findCurrentByAppUserId(appUserId: string): Promise<Wedding | null> {
    const wedding = await this.prisma.wedding.findFirst({
      where: {
        OR: [{ ownerId: appUserId }, { members: { some: { appUserId } } }],
      },
      include: weddingInclude,
      orderBy: { createdAt: "asc" },
    })

    return wedding ? toWedding(wedding) : null
  }

  async findById(id: string): Promise<Wedding | null> {
    const wedding = await this.findRecordById(id)

    return wedding ? toWedding(wedding) : null
  }

  async findPublicById(id: string): Promise<Wedding | null> {
    const wedding = await this.prisma.wedding.findUnique({
      where: { id },
      select: publicWeddingSelect,
    })

    return wedding ? toPublicWedding(wedding) : null
  }

  async findBySlug(slug: string): Promise<Wedding | null> {
    const wedding = await this.prisma.wedding.findUnique({
      where: { slug },
      include: weddingInclude,
    })

    return wedding ? toWedding(wedding) : null
  }

  async findMenuDetailsByWeddingId(
    weddingId: string,
  ): Promise<WeddingMenuDetails | null> {
    const menu = await this.findMenuRecordByWeddingId(weddingId)

    return menu ? toMenuDetails(menu) : null
  }

  async findPublicMenuDetails(
    menu: NonNullable<Wedding["menu"]>,
  ): Promise<WeddingMenuDetails | null> {
    const menuDishes = await this.prisma.restaurantMenuDish.findMany({
      where: { menuId: menu.id },
      select: {
        id: true,
        dishId: true,
        sortOrder: true,
      },
      orderBy: { sortOrder: "asc" },
    })

    if (menuDishes.length === 0) {
      return { ...menu, dishes: [] }
    }

    const dishIds = [...new Set(menuDishes.map((menuDish) => menuDish.dishId))]
    const dishes = await this.prisma.dish.findMany({
      where: { id: { in: dishIds } },
      select: {
        id: true,
        name: true,
        description: true,
        options: {
          select: {
            id: true,
            name: true,
            description: true,
            sortOrder: true,
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    })
    const dishesById = new Map(dishes.map((dish) => [dish.id, dish]))

    return {
      ...menu,
      dishes: menuDishes.map((menuDish) => {
        const dish = dishesById.get(menuDish.dishId)

        if (!dish) {
          throw new Error(`El plato ${menuDish.dishId} no existe`)
        }

        return {
          id: menuDish.id,
          dishId: menuDish.dishId,
          name: dish.name,
          description: dish.description,
          sortOrder: menuDish.sortOrder,
          options: dish.options,
        }
      }),
    }
  }

  async create(input: CreateWeddingInput): Promise<Wedding> {
    const baseSlug = slugFromNames(input.partnerNames)
    const slug = baseSlug || `wedding-${Date.now()}`

    const wedding = await this.prisma.wedding.create({
      data: {
        ownerId: input.ownerId,
        slug,
        date: new Date(input.date),
        status: "draft",
        members: {
          create: [
            {
              appUserId: input.ownerId,
              roleId: roleIds.owner,
              sortOrder: 0,
            },
            ...input.partnerNames.map((name, index) => ({
              roleId: roleIds.partner,
              displayName: name,
              sortOrder: index + 1,
            })),
          ],
        },
      },
      include: weddingInclude,
    })

    return toWedding(wedding)
  }

  async update(id: string, input: UpdateWeddingInput): Promise<Wedding | null> {
    const current = await this.prisma.wedding.findUnique({ where: { id } })

    if (!current) {
      return null
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.wedding.update({
        where: { id },
        data: {
          date: input.date ? new Date(input.date) : undefined,
          status: input.status,
          restaurantId: input.restaurantId,
          menuId: input.menuId,
        },
      })

      if (input.partnerNames) {
        await tx.weddingMember.deleteMany({
          where: {
            weddingId: id,
            appUserId: null,
            role: { code: { in: ["groom", "bride", "partner"] } },
          },
        })

        await tx.weddingMember.createMany({
          data: input.partnerNames.map((name, index) => ({
            weddingId: id,
            roleId: roleIds.partner,
            displayName: name,
            sortOrder: index + 1,
          })),
        })
      }
    })

    const wedding = await this.findRecordById(id)
    return wedding ? toWedding(wedding) : null
  }
}
