import { readFile } from "node:fs/promises"

import { PrismaD1 } from "@prisma/adapter-d1"
import { hashPassword } from "better-auth/crypto"
import { getPlatformProxy } from "wrangler"
import { z } from "zod"

import { PrismaClient } from "../generated/prisma-seed/client"
import { PUBLIC_DEMO_ACCOUNT } from "../src/core/auth/demo-account"
import { DEFAULT_INVITATION_CONTENT } from "../src/domains/invitations/domain/invitation-design"

const personSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  phone: z.string().min(1),
})

const addressSchema = z.object({
  street: z.string().min(1),
  number: z.string().min(1),
  postal_code: z.string().min(1),
  city: z.string().min(1),
  province: z.string().min(1),
  country: z.string().min(1),
})

const locationSchema = z.object({
  city: z.string().min(1),
  venue: z.string().min(1),
  address: addressSchema,
})

const eventSchema = z.object({
  location: locationSchema,
  time: z.string().regex(/^\d{2}:\d{2}$/),
})

const nachoWeddingSchema = z.object({
  wife: personSchema,
  husband: personSchema,
  history: z.array(z.string().min(1)).min(1),
  wedding: eventSchema.extend({
    date: z.iso.date(),
  }),
  cocktail: eventSchema,
  banquet: eventSchema,
  party: eventSchema,
  rsvp: z.object({
    deadline: z.iso.date(),
  }),
  gifts: z.object({
    bank_account: z.object({
      iban: z.string().min(1),
      bic: z.string().min(1),
      bank_name: z.string().min(1),
      account_holder: z.string().min(1),
    }),
  }),
})

type NachoWeddingSeed = z.infer<typeof nachoWeddingSchema>

async function loadNachoWeddingSeed() {
  const json = await readFile(new URL("../DATA/nacho.json", import.meta.url), "utf8")
  return nachoWeddingSchema.parse(JSON.parse(json))
}

function formatAddress(location: NachoWeddingSeed["wedding"]["location"]) {
  const { address } = location
  return `${address.street}, ${address.number}, ${address.postal_code} ${address.city}, ${address.province}, ${address.country}`
}

function mapsUrl(location: NachoWeddingSeed["wedding"]["location"]) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${location.venue}, ${formatAddress(location)}`,
  )}`
}

function displayDate(date: string) {
  return new Date(`${date}T12:00:00.000Z`).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
}

function weddingDate(seed: NachoWeddingSeed) {
  return new Date(`${seed.wedding.date}T${seed.wedding.time}:00.000+02:00`)
}

const demoWeddingId = "demo-wedding"
const demoRestaurantId = "demo-restaurant"
const demoMenuId = "demo-menu"

const nachoAuthUserId = "auth-user-nacho"
const mariaAuthUserId = "auth-user-maria-daniela"
const adminAuthUserId = "auth-user-admin"
const nachoAppUserId = "app-user-nacho"
const mariaAppUserId = "app-user-maria-daniela"
const adminAppUserId = "app-user-admin"
const nachoWeddingId = "wedding-nacho-y-maria-daniela"

const demoSeed: NachoWeddingSeed = {
  wife: {
    name: "Lucía Romero",
    email: "lucia.demo@nuptia.local",
    phone: "+34 600 111 222",
  },
  husband: {
    name: "Mateo Vidal",
    email: "mateo.demo@nuptia.local",
    phone: "+34 600 333 444",
  },
  history: [
    "Nos conocimos en una sobremesa que se alargó mucho más de lo previsto.",
    "Desde entonces hemos llenado los años de viajes, proyectos y domingos tranquilos.",
    "Ahora queremos celebrar este nuevo capítulo rodeados de nuestra gente favorita.",
  ],
  wedding: {
    date: "2027-05-22",
    time: "17:30",
    location: {
      city: "Sevilla",
      venue: "Jardines del Alcázar",
      address: {
        street: "Plaza del Triunfo",
        number: "1",
        postal_code: "41004",
        city: "Sevilla",
        province: "Sevilla",
        country: "España",
      },
    },
  },
  cocktail: {
    time: "19:00",
    location: {
      city: "Sevilla",
      venue: "Finca Los Olivos",
      address: {
        street: "Camino de los Olivos",
        number: "12",
        postal_code: "41020",
        city: "Sevilla",
        province: "Sevilla",
        country: "España",
      },
    },
  },
  banquet: {
    time: "21:00",
    location: {
      city: "Sevilla",
      venue: "Finca Los Olivos",
      address: {
        street: "Camino de los Olivos",
        number: "12",
        postal_code: "41020",
        city: "Sevilla",
        province: "Sevilla",
        country: "España",
      },
    },
  },
  party: {
    time: "23:30",
    location: {
      city: "Sevilla",
      venue: "Finca Los Olivos",
      address: {
        street: "Camino de los Olivos",
        number: "12",
        postal_code: "41020",
        city: "Sevilla",
        province: "Sevilla",
        country: "España",
      },
    },
  },
  rsvp: { deadline: "2027-04-30" },
  gifts: {
    bank_account: {
      iban: "ES00 0000 0000 0000 0000 0000",
      bic: "DEMOESMMXXX",
      bank_name: "Banco Demo",
      account_holder: "Lucía Romero y Mateo Vidal",
    },
  },
}

const roles = [
  { id: "role-owner", code: "owner", label: "Propietario", sortOrder: 1 },
  { id: "role-groom", code: "groom", label: "Novio", sortOrder: 2 },
  { id: "role-bride", code: "bride", label: "Novia", sortOrder: 3 },
  { id: "role-partner", code: "partner", label: "Pareja", sortOrder: 4 },
  { id: "role-planner", code: "planner", label: "Wedding planner", sortOrder: 5 },
]

interface SeedGuest {
  id: string
  partyId?: string
  role?: "primary" | "companion"
  name: string
  groupName: string
  inviteStatus: string
  rsvpStatus: string
  phone: string | null
  email: string | null
  notes: string
  tableNumber: number | null
  inviteToken: string
}

const guests: SeedGuest[] = [
  {
    id: "guest-ana-santos",
    name: "Ana Santos",
    groupName: "Familia novia",
    inviteStatus: "sent",
    rsvpStatus: "confirmed",
    phone: null,
    email: "ana.santos@example.com",
    notes: "Alergia a frutos secos",
    tableNumber: 1,
    inviteToken: "token-ana-santos",
  },
  {
    id: "guest-luis-santos",
    partyId: "party-guest-ana-santos",
    role: "companion",
    name: "Luis Santos",
    groupName: "Familia novia",
    inviteStatus: "sent",
    rsvpStatus: "declined",
    phone: null,
    email: null,
    notes: "",
    tableNumber: null,
    inviteToken: "token-ana-santos",
  },
  {
    id: "guest-paco-enriquez",
    name: "Paco Enriquez",
    groupName: "Amigo novio",
    inviteStatus: "sent",
    rsvpStatus: "no_response",
    phone: "+34625391654",
    email: "maria.lopez@example.com",
    notes: "",
    tableNumber: 4,
    inviteToken: "token-paco-enriquez",
  },
  {
    id: "guest-maria-lopez",
    name: "María López",
    groupName: "Familia novio",
    inviteStatus: "pending",
    email: "javier.marin@example.com",
    rsvpStatus: "no_response",
    notes: "Pendiente de confirmar acompañante",
    tableNumber: null,
    phone: null,
    inviteToken: "token-maria-lopez",
  },
  {
    id: "guest-javier-marin",
    name: "Javier Marín",
    groupName: "Trabajo",
    inviteStatus: "sent",
    email: null,
    phone: null,
    rsvpStatus: "confirmed",
    notes: "Viaje fuera de España",
    tableNumber: null,
    inviteToken: "token-javier-marin",
  },
  {
    id: "guest-sergio-ruiz",
    name: "Sergio Ruiz",
    email: "sergio.ruiz@example.com",
    groupName: "Familia novio",
    phone: "+34616633576",
    inviteStatus: "sent",
    rsvpStatus: "confirmed",
    notes: "Viaje fuera de España",
    tableNumber: null,
    inviteToken: "token-sergio-ruiz",
  },
]

function siteModules(seed: NachoWeddingSeed, prefix: string) {
  return [
    {
      id: `${prefix}-module-location`,
      type: "location",
      title: "Lugar",
      desc: "Mapa, horarios y detalles de llegada.",
      enabled: true,
      sortOrder: 1,
      config: JSON.stringify({
        contacts: { wife: seed.wife, husband: seed.husband },
        ceremony: seed.wedding,
        cocktail: seed.cocktail,
        banquet: seed.banquet,
        party: seed.party,
      }),
    },
    {
      id: `${prefix}-module-timeline`,
      type: "timeline",
      title: "Programa",
      desc: "Ceremonia, cóctel, cena y fiesta.",
      enabled: true,
      sortOrder: 2,
      config: JSON.stringify({
        events: [seed.wedding, seed.cocktail, seed.banquet, seed.party],
      }),
    },
    {
      id: `${prefix}-module-menu`,
      type: "menu",
      title: "Menú",
      desc: "Platos y opciones especiales.",
      enabled: true,
      sortOrder: 3,
      config: "{}",
    },
    {
      id: `${prefix}-module-spotify`,
      type: "spotify",
      title: "Lista de Spotify",
      desc: "Canciones propuestas por los invitados.",
      enabled: true,
      sortOrder: 4,
      config: JSON.stringify({ playlistUrl: "" }),
    },
    {
      id: `${prefix}-module-gallery`,
      type: "gallery",
      title: "Galería live",
      desc: "Fotos compartidas durante la celebración.",
      enabled: true,
      sortOrder: 5,
      config: "{}",
    },
    {
      id: `${prefix}-module-guestbook`,
      type: "guestbook",
      title: "Firmas y felicitaciones",
      desc: "Mensajes, dedicatorias y firmas digitales.",
      enabled: true,
      sortOrder: 6,
      config: "{}",
    },
    {
      id: `${prefix}-module-gifts`,
      type: "gifts",
      title: "Regalos",
      desc: "Información útil para regalos y aportaciones.",
      enabled: true,
      sortOrder: 7,
      config: JSON.stringify(seed.gifts),
    },
  ]
}

async function seedRoles(prisma: PrismaClient) {
  for (const role of roles) {
    await prisma.weddingMemberRole.upsert({
      where: { id: role.id },
      update: {
        code: role.code,
        label: role.label,
        sortOrder: role.sortOrder,
      },
      create: role,
    })
  }
}

async function seedRestaurantMenu(prisma: PrismaClient, seed: NachoWeddingSeed) {
  await prisma.restaurant.upsert({
    where: { id: demoRestaurantId },
    update: {
      name: seed.banquet.location.venue,
      city: seed.banquet.location.city,
      address: formatAddress(seed.banquet.location),
      mapsUrl: mapsUrl(seed.banquet.location),
    },
    create: {
      id: demoRestaurantId,
      name: seed.banquet.location.venue,
      city: seed.banquet.location.city,
      address: formatAddress(seed.banquet.location),
      mapsUrl: mapsUrl(seed.banquet.location),
    },
  })

  await prisma.restaurantMenu.upsert({
    where: { id: demoMenuId },
    update: {
      restaurantId: demoRestaurantId,
      name: "Menú de boda",
      active: true,
    },
    create: {
      id: demoMenuId,
      restaurantId: demoRestaurantId,
      name: "Menú de boda",
      active: true,
    },
  })

  const principal = await prisma.dish.upsert({
    where: { id: "demo-dish-principal" },
    update: {
      restaurantId: demoRestaurantId,
      name: "Plato principal",
    },
    create: {
      id: "demo-dish-principal",
      restaurantId: demoRestaurantId,
      name: "Plato principal",
    },
  })

  await prisma.restaurantMenuDish.upsert({
    where: { id: "demo-menu-dish-principal" },
    update: {
      menuId: demoMenuId,
      dishId: principal.id,
      sortOrder: 1,
    },
    create: {
      id: "demo-menu-dish-principal",
      menuId: demoMenuId,
      dishId: principal.id,
      sortOrder: 1,
    },
  })

  for (const option of [
    { id: "demo-opt-carne", name: "Solomillo de ternera", sortOrder: 1 },
    { id: "demo-opt-pescado", name: "Lubina a la sal", sortOrder: 2 },
    { id: "demo-opt-vegetariano", name: "Risotto de setas", sortOrder: 3 },
  ]) {
    await prisma.dishOption.upsert({
      where: { id: option.id },
      update: {
        dishId: principal.id,
        name: option.name,
        sortOrder: option.sortOrder,
      },
      create: {
        id: option.id,
        dishId: principal.id,
        name: option.name,
        sortOrder: option.sortOrder,
      },
    })
  }
}

function invitationContent(seed: NachoWeddingSeed) {
  const date = displayDate(seed.wedding.date)
  const account = seed.gifts.bank_account

  return {
    ...DEFAULT_INVITATION_CONTENT,
    story: seed.history,
    schedule: [
      {
        id: "ceremony",
        title: "Ceremonia",
        date,
        time: seed.wedding.time,
        location: seed.wedding.location.venue,
        mapsUrl: mapsUrl(seed.wedding.location),
        description: "Ceremonia religiosa y comienzo de nuestra celebración.",
      },
      {
        id: "cocktail",
        title: "Cóctel",
        date,
        time: seed.cocktail.time,
        location: seed.cocktail.location.venue,
        mapsUrl: mapsUrl(seed.cocktail.location),
        description: "Recepción y cóctel de bienvenida.",
      },
      {
        id: "banquet",
        title: "Banquete",
        date,
        time: seed.banquet.time,
        location: seed.banquet.location.venue,
        mapsUrl: mapsUrl(seed.banquet.location),
        description: "Cena, brindis y celebración junto a nuestros invitados.",
      },
      {
        id: "party",
        title: "Fiesta",
        date,
        time: seed.party.time,
        location: seed.party.location.venue,
        mapsUrl: mapsUrl(seed.party.location),
        description: "Baile y fiesta para terminar la noche.",
      },
    ],
    venueNote: `La ceremonia será a las ${seed.wedding.time}. Después continuaremos la celebración en ${seed.banquet.location.venue}.`,
    registryIntro: "Vuestra presencia es nuestro mejor regalo.",
    registryNote: `${account.bank_name} · BIC ${account.bic} · Titular: ${account.account_holder}`,
    registry: [{ id: "IBAN", title: account.iban, url: "" }],
    contactEmail: seed.husband.email,
    rsvpSubtitle: `Confirma tu asistencia antes del ${displayDate(seed.rsvp.deadline)} para ayudarnos a organizarlo todo.`,
  }
}

interface AuthAccountSeed {
  authUserId: string
  appUserId: string
  name: string
  email: string
  password: string
  role: "user" | "admin"
}

async function seedAuthAccount(prisma: PrismaClient, account: AuthAccountSeed) {
  const password = await hashPassword(account.password)
  const authUser = await prisma.user.upsert({
    where: { email: account.email.toLowerCase() },
    update: {
      name: account.name,
      emailVerified: true,
      role: account.role,
      banned: false,
      banReason: null,
      banExpires: null,
    },
    create: {
      id: account.authUserId,
      name: account.name,
      email: account.email.toLowerCase(),
      emailVerified: true,
      role: account.role,
    },
  })

  await prisma.account.upsert({
    where: { id: `credential-${authUser.id}` },
    update: {
      userId: authUser.id,
      accountId: authUser.id,
      providerId: "credential",
      password,
    },
    create: {
      id: `credential-${authUser.id}`,
      userId: authUser.id,
      accountId: authUser.id,
      providerId: "credential",
      password,
    },
  })

  const appUser = await prisma.appUser.upsert({
    where: { email: account.email.toLowerCase() },
    update: { name: account.name, imageUrl: null },
    create: {
      id: account.appUserId,
      email: account.email.toLowerCase(),
      name: account.name,
      imageUrl: null,
    },
  })

  await prisma.authIdentity.upsert({
    where: {
      provider_providerUserId: {
        provider: "better-auth",
        providerUserId: authUser.id,
      },
    },
    update: { appUserId: appUser.id, email: appUser.email },
    create: {
      id: `identity-${authUser.id}`,
      appUserId: appUser.id,
      provider: "better-auth",
      providerUserId: authUser.id,
      email: appUser.email,
    },
  })

  return appUser
}

async function seedDemoWedding(
  prisma: PrismaClient,
  seed: NachoWeddingSeed,
  appUser: Awaited<ReturnType<typeof seedAuthAccount>>,
) {
  await seedRoles(prisma)
  await seedRestaurantMenu(prisma, seed)

  const wedding = await prisma.wedding.upsert({
    where: { id: demoWeddingId },
    update: {
      ownerId: appUser.id,
      slug: "demo",
      date: weddingDate(seed),
      status: "published",
      partnerInviteEmail: seed.wife.email,
      restaurantId: demoRestaurantId,
      menuId: demoMenuId,
    },
    create: {
      id: demoWeddingId,
      ownerId: appUser.id,
      slug: "demo",
      date: weddingDate(seed),
      status: "published",
      partnerInviteEmail: seed.wife.email,
      restaurantId: demoRestaurantId,
      menuId: demoMenuId,
    },
  })

  await prisma.weddingCeremonyLocation.upsert({
    where: { weddingId: wedding.id },
    update: {
      name: seed.wedding.location.venue,
      city: seed.wedding.location.city,
      address: formatAddress(seed.wedding.location),
      mapsUrl: mapsUrl(seed.wedding.location),
    },
    create: {
      id: "demo-ceremony-location",
      weddingId: wedding.id,
      name: seed.wedding.location.venue,
      city: seed.wedding.location.city,
      address: formatAddress(seed.wedding.location),
      mapsUrl: mapsUrl(seed.wedding.location),
    },
  })

  for (const member of [
    {
      id: "demo-wedding-owner-member",
      appUserId: appUser.id,
      roleId: "role-owner",
      displayName: null,
      sortOrder: 0,
    },
    {
      id: "demo-wedding-bride-member",
      appUserId: null,
      roleId: "role-bride",
      displayName: seed.wife.name,
      sortOrder: 1,
    },
    {
      id: "demo-wedding-groom-member",
      appUserId: null,
      roleId: "role-groom",
      displayName: seed.husband.name,
      sortOrder: 2,
    },
  ]) {
    await prisma.weddingMember.upsert({
      where: { id: member.id },
      update: {
        weddingId: wedding.id,
        appUserId: member.appUserId,
        roleId: member.roleId,
        displayName: member.displayName,
        sortOrder: member.sortOrder,
      },
      create: {
        ...member,
        weddingId: wedding.id,
      },
    })
  }

  await prisma.invitationDesign.upsert({
    where: { weddingId: wedding.id },
    update: {
      templateId: "bouquet",
      titleFont: "serif",
      palette: "sage",
      content: JSON.stringify(invitationContent(seed)),
      openingEffect: "envelope",
      musicEnabled: false,
    },
    create: {
      id: "demo-invitation-design",
      weddingId: wedding.id,
      templateId: "bouquet",
      titleFont: "serif",
      palette: "sage",
      content: JSON.stringify(invitationContent(seed)),
      openingEffect: "envelope",
      musicEnabled: false,
    },
  })

  for (const guest of guests) {
    const partyId = guest.partyId ?? `party-${guest.id}`
    const party = await prisma.guestParty.upsert({
      where: { id: partyId },
      update: {
        weddingId: wedding.id,
        inviteToken: guest.inviteToken,
        groupName: guest.groupName,
        inviteStatus: guest.inviteStatus,
      },
      create: {
        id: partyId,
        weddingId: wedding.id,
        inviteToken: guest.inviteToken,
        groupName: guest.groupName,
        inviteStatus: guest.inviteStatus,
      },
    })

    await prisma.guest.upsert({
      where: { id: guest.id },
      update: {
        partyId: party.id,
        weddingId: wedding.id,
        role: guest.role ?? "primary",
        name: guest.name,
        phone: guest.phone ?? null,
        email: guest?.email ?? null,
        rsvpStatus: guest.rsvpStatus,
        notes: guest.notes,
        uploadToken: `upload-${guest.id}`,
      },
      create: {
        id: guest.id,
        partyId: party.id,
        weddingId: wedding.id,
        role: guest.role ?? "primary",
        name: guest.name,
        phone: guest.phone ?? null,
        email: guest?.email ?? null,
        rsvpStatus: guest.rsvpStatus,
        notes: guest.notes,
        uploadToken: `upload-${guest.id}`,
      },
    })

    if (guest.tableNumber) {
      const table = await prisma.weddingTable.upsert({
        where: { id: `demo-table-${guest.tableNumber}` },
        update: {
          weddingId: wedding.id,
          name: `Mesa ${guest.tableNumber}`,
          sortOrder: guest.tableNumber,
        },
        create: {
          id: `demo-table-${guest.tableNumber}`,
          weddingId: wedding.id,
          name: `Mesa ${guest.tableNumber}`,
          sortOrder: guest.tableNumber,
        },
      })

      await prisma.weddingSeat.upsert({
        where: { id: `demo-seat-${guest.id}` },
        update: {
          tableId: table.id,
          guestId: guest.id,
        },
        create: {
          id: `demo-seat-${guest.id}`,
          tableId: table.id,
          position: guest.tableNumber,
          guestId: guest.id,
        },
      })
    }
  }

  for (const siteModule of siteModules(seed, "demo")) {
    await prisma.weddingSiteModule.upsert({
      where: {
        weddingId_type: {
          weddingId: wedding.id,
          type: siteModule.type,
        },
      },
      update: {
        title: siteModule.title,
        desc: siteModule.desc,
        enabled: siteModule.enabled,
        sortOrder: siteModule.sortOrder,
        config: siteModule.config,
      },
      create: {
        ...siteModule,
        weddingId: wedding.id,
      },
    })
  }
}

async function seedNachoWedding(
  prisma: PrismaClient,
  seed: NachoWeddingSeed,
  nacho: Awaited<ReturnType<typeof seedAuthAccount>>,
  maria: Awaited<ReturnType<typeof seedAuthAccount>>,
) {
  const restaurant = await prisma.restaurant.upsert({
    where: { id: "nacho-restaurant" },
    update: {
      name: seed.banquet.location.venue,
      city: seed.banquet.location.city,
      address: formatAddress(seed.banquet.location),
      mapsUrl: mapsUrl(seed.banquet.location),
    },
    create: {
      id: "nacho-restaurant",
      name: seed.banquet.location.venue,
      city: seed.banquet.location.city,
      address: formatAddress(seed.banquet.location),
      mapsUrl: mapsUrl(seed.banquet.location),
    },
  })

  const menu = await prisma.restaurantMenu.upsert({
    where: { id: "nacho-menu" },
    update: {
      restaurantId: restaurant.id,
      name: "Menú de boda",
      active: true,
    },
    create: {
      id: "nacho-menu",
      restaurantId: restaurant.id,
      name: "Menú de boda",
      active: true,
    },
  })

  const wedding = await prisma.wedding.upsert({
    where: { id: nachoWeddingId },
    update: {
      ownerId: nacho.id,
      slug: "nacho-y-maria-daniela",
      date: weddingDate(seed),
      status: "published",
      partnerInviteEmail: seed.wife.email,
      restaurantId: restaurant.id,
      menuId: menu.id,
    },
    create: {
      id: nachoWeddingId,
      ownerId: nacho.id,
      slug: "nacho-y-maria-daniela",
      date: weddingDate(seed),
      status: "published",
      partnerInviteEmail: seed.wife.email,
      restaurantId: restaurant.id,
      menuId: menu.id,
    },
  })

  await prisma.weddingCeremonyLocation.upsert({
    where: { weddingId: wedding.id },
    update: {
      name: seed.wedding.location.venue,
      city: seed.wedding.location.city,
      address: formatAddress(seed.wedding.location),
      mapsUrl: mapsUrl(seed.wedding.location),
    },
    create: {
      id: "nacho-ceremony-location",
      weddingId: wedding.id,
      name: seed.wedding.location.venue,
      city: seed.wedding.location.city,
      address: formatAddress(seed.wedding.location),
      mapsUrl: mapsUrl(seed.wedding.location),
    },
  })

  for (const member of [
    {
      id: "nacho-wedding-owner-member",
      appUserId: nacho.id,
      roleId: "role-owner",
      displayName: seed.husband.name,
      sortOrder: 0,
    },
    {
      id: "nacho-wedding-bride-member",
      appUserId: maria.id,
      roleId: "role-bride",
      displayName: seed.wife.name,
      sortOrder: 1,
    },
  ]) {
    await prisma.weddingMember.upsert({
      where: { id: member.id },
      update: { ...member, weddingId: wedding.id },
      create: { ...member, weddingId: wedding.id },
    })
  }

  await prisma.invitationDesign.upsert({
    where: { weddingId: wedding.id },
    update: {
      templateId: "maria-daniela",
      titleFont: "cormorant-lato",
      palette: "terracotta",
      content: JSON.stringify(invitationContent(seed)),
      openingEffect: "envelope",
      musicEnabled: false,
    },
    create: {
      id: "nacho-invitation-design",
      weddingId: wedding.id,
      templateId: "maria-daniela",
      titleFont: "cormorant-lato",
      palette: "terracotta",
      content: JSON.stringify(invitationContent(seed)),
      openingEffect: "envelope",
      musicEnabled: false,
    },
  })

  for (const siteModule of siteModules(seed, "nacho")) {
    await prisma.weddingSiteModule.upsert({
      where: {
        weddingId_type: { weddingId: wedding.id, type: siteModule.type },
      },
      update: {
        title: siteModule.title,
        desc: siteModule.desc,
        enabled: siteModule.enabled,
        sortOrder: siteModule.sortOrder,
        config: siteModule.config,
      },
      create: { ...siteModule, weddingId: wedding.id },
    })
  }
}

async function main(prisma: PrismaClient, seed: NachoWeddingSeed) {
  await seedRoles(prisma)

  await prisma.authIdentity.deleteMany({ where: { provider: "demo" } })
  await prisma.guest.deleteMany({ where: { id: "guest-nacho-demo" } })
  await prisma.guestParty.deleteMany({ where: { id: "party-guest-nacho-demo" } })

  const nacho = await seedAuthAccount(prisma, {
    authUserId: nachoAuthUserId,
    appUserId: nachoAppUserId,
    name: seed.husband.name,
    email: seed.husband.email,
    password: "MariaDaniela26",
    role: "user",
  })
  const maria = await seedAuthAccount(prisma, {
    authUserId: mariaAuthUserId,
    appUserId: mariaAppUserId,
    name: seed.wife.name,
    email: seed.wife.email,
    password: "Nacho26",
    role: "user",
  })
  const demo = await seedAuthAccount(prisma, {
    authUserId: PUBLIC_DEMO_ACCOUNT.id,
    appUserId: PUBLIC_DEMO_ACCOUNT.appUserId,
    name: PUBLIC_DEMO_ACCOUNT.name,
    email: PUBLIC_DEMO_ACCOUNT.email,
    password: PUBLIC_DEMO_ACCOUNT.password,
    role: "user",
  })
  await seedAuthAccount(prisma, {
    authUserId: adminAuthUserId,
    appUserId: adminAppUserId,
    name: "Admin Fenrig",
    email: "admin@nuptia.local",
    password: "AdminFenrig26",
    role: "admin",
  })

  await seedDemoWedding(prisma, demoSeed, demo)
  await seedNachoWedding(prisma, seed, nacho, maria)
}

async function run() {
  const platform = await getPlatformProxy<Pick<CloudflareEnv, "DB">>({
    configPath: "wrangler.jsonc",
    persist: true,
    remoteBindings: false,
  })
  const prisma = new PrismaClient({
    adapter: new PrismaD1(platform.env.DB),
  })

  try {
    const seed = await loadNachoWeddingSeed()
    await main(prisma, seed)
    console.info(`Seed D1 local aplicado: ${seed.husband.name} & ${seed.wife.name}`)
  } finally {
    await prisma.$disconnect()
    await platform.dispose()
  }
}

run().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
