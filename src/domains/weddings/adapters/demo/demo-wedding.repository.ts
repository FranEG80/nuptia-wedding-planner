import type {
  Wedding,
  WeddingMenuDetails,
} from "@/domains/weddings/domain/wedding"
import type {
  CreateWeddingInput,
  UpdateWeddingInput,
  WeddingRepository,
} from "@/domains/weddings/domain/ports/wedding.repository"

export const DEMO_WEDDING_ID = "demo-wedding"
export const DEMO_USER_ID = "demo-app-user"

const ownerRole = {
  id: "role-owner",
  code: "owner" as const,
  label: "Propietario",
  sortOrder: 1,
}

const brideRole = {
  id: "role-bride",
  code: "bride" as const,
  label: "Novia",
  sortOrder: 2,
}

const groomRole = {
  id: "role-groom",
  code: "groom" as const,
  label: "Novio",
  sortOrder: 3,
}

let demoWedding: Wedding = {
  id: DEMO_WEDDING_ID,
  ownerId: DEMO_USER_ID,
  slug: "demo",
  date: "2026-09-12T17:00:00",
  status: "published",
  partnerInviteCode: null,
  partnerInviteEmail: null,
  restaurantId: "demo-restaurant",
  menuId: "demo-menu",
  members: [
    {
      id: "demo-member-owner",
      weddingId: DEMO_WEDDING_ID,
      appUserId: DEMO_USER_ID,
      role: ownerRole,
      displayName: null,
      sortOrder: 0,
    },
    {
      id: "demo-member-bride",
      weddingId: DEMO_WEDDING_ID,
      appUserId: null,
      role: brideRole,
      displayName: "Ana",
      sortOrder: 1,
    },
    {
      id: "demo-member-groom",
      weddingId: DEMO_WEDDING_ID,
      appUserId: null,
      role: groomRole,
      displayName: "Carlos",
      sortOrder: 2,
    },
  ],
  ceremonyLocation: {
    id: "demo-ceremony",
    weddingId: DEMO_WEDDING_ID,
    name: "Iglesia de San Ildefonso",
    address: "Plaza del Padre Juan de Mariana, s/n",
    city: "Toledo, España",
    mapsUrl: null,
  },
  restaurant: {
    id: "demo-restaurant",
    name: "Cigarral del Ángel",
    address: "Ctra. Cuerva, km 3",
    city: "Toledo, España",
    mapsUrl: null,
  },
  menu: {
    id: "demo-menu",
    restaurantId: "demo-restaurant",
    name: "Menú de boda",
    description: null,
  },
}

const demoMenuDetails: WeddingMenuDetails = {
  id: "demo-menu",
  restaurantId: "demo-restaurant",
  name: "Menú de boda",
  description: null,
  dishes: [
    {
      id: "demo-menu-dish-principal",
      dishId: "demo-dish-principal",
      name: "Plato principal",
      description: null,
      sortOrder: 1,
      options: [
        {
          id: "demo-opt-carne",
          name: "Solomillo de ternera",
          description: null,
          sortOrder: 1,
        },
        {
          id: "demo-opt-pescado",
          name: "Lubina a la sal",
          description: null,
          sortOrder: 2,
        },
        {
          id: "demo-opt-vegetariano",
          name: "Risotto de setas",
          description: null,
          sortOrder: 3,
        },
      ],
    },
  ],
}

function slugFromNames(names: readonly string[]) {
  return names
    .join("-")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export const demoWeddingRepository: WeddingRepository = {
  async findCurrentByAppUserId() {
    return demoWedding
  },

  async findById(id) {
    return demoWedding.id === id ? demoWedding : null
  },

  async findPublicById(id) {
    return demoWedding.id === id ? demoWedding : null
  },

  async findBySlug(slug) {
    return demoWedding.slug === slug ? demoWedding : null
  },

  async findMenuDetailsByWeddingId(weddingId) {
    return demoWedding.id === weddingId ? demoMenuDetails : null
  },

  async findPublicMenuDetails(menu) {
    return demoMenuDetails.id === menu.id ? demoMenuDetails : null
  },

  async create(input: CreateWeddingInput) {
    demoWedding = {
      ...demoWedding,
      id: `wedding-${Date.now()}`,
      ownerId: input.ownerId,
      slug: slugFromNames(input.partnerNames),
      date: input.date,
      status: "draft",
      members: [
        {
          id: `member-owner-${Date.now()}`,
          weddingId: DEMO_WEDDING_ID,
          appUserId: input.ownerId,
          role: ownerRole,
          displayName: null,
          sortOrder: 0,
        },
        ...input.partnerNames.map((name, index) => ({
          id: `member-partner-${index}-${Date.now()}`,
          weddingId: DEMO_WEDDING_ID,
          appUserId: null,
          role: {
            id: "role-partner",
            code: "partner" as const,
            label: "Pareja",
            sortOrder: 4,
          },
          displayName: name,
          sortOrder: index + 1,
        })),
      ],
    }

    return demoWedding
  },

  async update(id: string, input: UpdateWeddingInput) {
    if (demoWedding.id !== id) {
      return null
    }

    demoWedding = {
      ...demoWedding,
      date: input.date ?? demoWedding.date,
      status: input.status ?? demoWedding.status,
      restaurantId:
        input.restaurantId === undefined
          ? demoWedding.restaurantId
          : input.restaurantId,
      menuId: input.menuId === undefined ? demoWedding.menuId : input.menuId,
      members: input.partnerNames
        ? [
            demoWedding.members[0],
            ...input.partnerNames.map((name, index) => ({
              id: `member-partner-${index}-${Date.now()}`,
              weddingId: demoWedding.id,
              appUserId: null,
              role: {
                id: "role-partner",
                code: "partner" as const,
                label: "Pareja",
                sortOrder: 4,
              },
              displayName: name,
              sortOrder: index + 1,
            })),
          ].filter((member): member is Wedding["members"][number] => Boolean(member))
        : demoWedding.members,
    }

    return demoWedding
  },
}
