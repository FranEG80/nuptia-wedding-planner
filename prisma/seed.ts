import 'dotenv/config'
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import { PrismaClient } from "../generated/prisma/client"
import { sqliteDriverUrlFromDatabaseUrl } from "../src/core/db/sqlite-url"
import { DEFAULT_INVITATION_CONTENT } from "../src/domains/invitations/domain/invitation-design"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"

const databaseUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db"
const [user, password, host, port, database] =  databaseUrl.replace(/^(mysql|mariadb):\/\//, "").split(/[:@/]/)

const prisma = new PrismaClient({
  adapter: databaseUrl.startsWith("file:") 
  ? new PrismaBetterSqlite3({ url: sqliteDriverUrlFromDatabaseUrl(databaseUrl)}) 
  : new PrismaMariaDb({
    host,
    port: Number(port),
    user,
    password,
    database,
    connectionLimit: 5,
  })
})

const demoAppUserId = "demo-app-user"
const demoWeddingId = "demo-wedding"
const demoRestaurantId = "demo-restaurant"
const demoMenuId = "demo-menu"

const roles = [
  { id: "role-owner", code: "owner", label: "Propietario", sortOrder: 1 },
  { id: "role-groom", code: "groom", label: "Novio", sortOrder: 2 },
  { id: "role-bride", code: "bride", label: "Novia", sortOrder: 3 },
  { id: "role-partner", code: "partner", label: "Pareja", sortOrder: 4 },
  { id: "role-planner", code: "planner", label: "Wedding planner", sortOrder: 5 },
]

const guests = [
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
    id: "guest-paco-enriquez",
    name: "Paco Enriquez",
    groupName: "Amigo novio",
    inviteStatus: "sent",
    rsvpStatus: "pending",
    phone: "+34625391654",
    email: null,
    notes: "",
    tableNumber: 4,
    inviteToken: "token-paco-enriquez",
  },
  {
    id: "guest-maria-lopez",
    name: "María López",
    groupName: "Familia novio",
    inviteStatus: "pending",
    email: null,
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
    id: "guest-nacho-demo",
    name: "Nacho Demo",
    email: "nacho.ruiz@example.com",
    groupName: "Familia novio",
    phone: "+34616633576",
    inviteStatus: "sent",
    rsvpStatus: "confirmed",
    notes: "Viaje fuera de España",
    tableNumber: null,
    inviteToken: "token-nacho-demo",
  },
]

const modules = [
  {
    id: "module-location",
    type: "location",
    title: "Lugar",
    desc: "Mapa, horarios y detalles de llegada.",
    enabled: true,
    sortOrder: 1,
  },
  {
    id: "module-timeline",
    type: "timeline",
    title: "Programa",
    desc: "Ceremonia, cóctel, cena y fiesta.",
    enabled: true,
    sortOrder: 2,
  },
  {
    id: "module-menu",
    type: "menu",
    title: "Menú",
    desc: "Platos y opciones especiales.",
    enabled: true,
    sortOrder: 3,
  },
  {
    id: "module-spotify",
    type: "spotify",
    title: "Lista de Spotify",
    desc: "Canciones propuestas por los invitados.",
    enabled: true,
    sortOrder: 4,
    config: JSON.stringify({ playlistUrl: "" }),
  },
  {
    id: "module-gallery",
    type: "gallery",
    title: "Galería live",
    desc: "Fotos compartidas durante la celebración.",
    enabled: true,
    sortOrder: 5,
  },
  {
    id: "module-guestbook",
    type: "guestbook",
    title: "Firmas y felicitaciones",
    desc: "Mensajes, dedicatorias y firmas digitales.",
    enabled: true,
    sortOrder: 6,
  },
  {
    id: "module-gifts",
    type: "gifts",
    title: "Regalos",
    desc: "Información útil para regalos y aportaciones.",
    enabled: false,
    sortOrder: 7,
  },
]

async function seedRoles() {
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

async function seedRestaurantMenu() {
  await prisma.restaurant.upsert({
    where: { id: demoRestaurantId },
    update: {
      name: "Impressive Playa Granada",
      city: "Motril (Granada)",
      address: "C. Rector Pascual Rivas Carrera, 1, 18613 Playa Granada, Motril",
    },
    create: {
      id: demoRestaurantId,
      name: "Impressive Playa Granada",
      city: "Motril (Granada)",
      address: "C. Rector Pascual Rivas Carrera, 1, 18613 Playa Granada, Motril",
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

async function main() {
  await seedRoles()
  await seedRestaurantMenu()

  const appUser = await prisma.appUser.upsert({
    where: { email: "demo@nuptia.local" },
    update: {
      name: "Maria e Ignacio",
      imageUrl: null,
    },
    create: {
      id: demoAppUserId,
      email: "demo@nuptia.local",
      name: "Maria e Ignacio",
      imageUrl: null,
    },
  })

  await prisma.authIdentity.upsert({
    where: {
      provider_providerUserId: {
        provider: "demo",
        providerUserId: "demo-user",
      },
    },
    update: {
      appUserId: appUser.id,
      email: appUser.email,
    },
    create: {
      id: "demo-auth-identity",
      appUserId: appUser.id,
      provider: "demo",
      providerUserId: "demo-user",
      email: appUser.email,
    },
  })

  const wedding = await prisma.wedding.upsert({
    where: { slug: "demo" },
    update: {
      ownerId: appUser.id,
      date: new Date("2026-09-12T17:00:00.000Z"),
      status: "published",
      restaurantId: demoRestaurantId,
      menuId: demoMenuId,
    },
    create: {
      id: demoWeddingId,
      ownerId: appUser.id,
      slug: "demo",
      date: new Date("2026-09-12T17:00:00.000Z"),
      status: "published",
      restaurantId: demoRestaurantId,
      menuId: demoMenuId,
    },
  })

  await prisma.weddingCeremonyLocation.upsert({
    where: { weddingId: wedding.id },
    update: {
      name: "Santuario de Nuestra Señora de la Virgen de la Cabeza",
      city: "Motril (Granada)",
      address: "Av. Ntra. Sra. de la Cabeza, 13, 18600 Motril",
    },
    create: {
      id: "demo-ceremony-location",
      weddingId: wedding.id,
      name: "Santuario de Nuestra Señora de la Virgen de la Cabeza",
      city: "Motril (Granada)",
      address: "Av. Ntra. Sra. de la Cabeza, 13, 18600 Motril",
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
      displayName: "Maria",
      sortOrder: 1,
    },
    {
      id: "demo-wedding-groom-member",
      appUserId: null,
      roleId: "role-groom",
      displayName: "Ignacio",
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
      content: JSON.stringify(DEFAULT_INVITATION_CONTENT),
      openingEffect: "envelope",
      musicEnabled: false,
    },
    create: {
      id: "demo-invitation-design",
      weddingId: wedding.id,
      templateId: "bouquet",
      titleFont: "serif",
      palette: "sage",
      content: JSON.stringify(DEFAULT_INVITATION_CONTENT),
      openingEffect: "envelope",
      musicEnabled: false,
    },
  })

  for (const guest of guests) {
    const party = await prisma.guestParty.upsert({
      where: { id: `party-${guest.id}` },
      update: {
        weddingId: wedding.id,
        inviteToken: guest.inviteToken,
        groupName: guest.groupName,
        inviteStatus: guest.inviteStatus,
      },
      create: {
        id: `party-${guest.id}`,
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
        role: "primary",
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
        role: "primary",
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

  for (const siteModule of modules) {
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
        config: "config" in siteModule ? siteModule.config : "{}",
      },
      create: {
        ...siteModule,
        weddingId: wedding.id,
        config: "config" in siteModule ? siteModule.config : "{}",
      },
    })
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
