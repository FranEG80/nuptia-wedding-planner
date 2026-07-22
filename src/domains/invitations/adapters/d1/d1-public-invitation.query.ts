import type { D1BatchDatabase } from "@/core/db/d1-batch"
import { parseInvitationContent } from "@/domains/invitations/application/dtos/invitation-design.dto"
import { toPublicInvitationDto } from "@/domains/invitations/application/dtos/public-invitation.dto"
import type { PublicInvitationQuery } from "@/domains/invitations/application/ports/public-invitation.query"
import type { InvitationDesign } from "@/domains/invitations/domain/invitation-design"
import {
  normalizeInvitationColorPresetId,
  normalizeInvitationFontPairId,
  normalizeInvitationTemplateId,
} from "@/domains/invitations/domain/invitation-template-options"
import type { PublicGuestInviteParty } from "@/domains/guests/domain/ports/guest.repository"
import type {
  Wedding,
  WeddingMemberRoleCode,
  WeddingMenuDetails,
} from "@/domains/weddings/domain/wedding"

type D1Row = Record<string, unknown>

const baseInvitationSql = `
  SELECT
    p.id AS party_id,
    p.weddingId AS wedding_id,
    p.inviteToken AS invite_token,
    p.groupName AS group_name,
    p.inviteStatus AS invite_status,
    w.ownerId AS wedding_owner_id,
    w.slug AS wedding_slug,
    w.date AS wedding_date,
    w.status AS wedding_status,
    w.restaurantId AS wedding_restaurant_id,
    w.menuId AS wedding_menu_id,
    c.id AS ceremony_id,
    c.name AS ceremony_name,
    c.address AS ceremony_address,
    c.city AS ceremony_city,
    c.mapsUrl AS ceremony_maps_url,
    r.id AS restaurant_id,
    r.name AS restaurant_name,
    r.address AS restaurant_address,
    r.city AS restaurant_city,
    r.mapsUrl AS restaurant_maps_url,
    m.id AS menu_id,
    m.restaurantId AS menu_restaurant_id,
    m.name AS menu_name,
    m.description AS menu_description,
    d.id AS design_id,
    d.templateId AS design_template_id,
    d.titleFont AS design_title_font,
    d.palette AS design_palette,
    d.content AS design_content,
    d.openingEffect AS design_opening_effect,
    d.musicEnabled AS design_music_enabled
  FROM guest_parties p
  JOIN weddings w ON w.id = p.weddingId
  JOIN invitation_designs d ON d.weddingId = w.id
  LEFT JOIN wedding_ceremony_locations c ON c.weddingId = w.id
  LEFT JOIN restaurants r ON r.id = w.restaurantId
  LEFT JOIN restaurant_menus m ON m.id = w.menuId
  WHERE p.inviteToken = ?
  LIMIT 1
`

const weddingMembersSql = `
  SELECT
    wm.id,
    wm.weddingId AS wedding_id,
    wm.appUserId AS app_user_id,
    wm.displayName AS display_name,
    wm.sortOrder AS sort_order,
    role.id AS role_id,
    role.code AS role_code,
    role.label AS role_label,
    role.sortOrder AS role_sort_order
  FROM wedding_members wm
  JOIN wedding_member_roles role ON role.id = wm.roleId
  WHERE wm.weddingId = (
    SELECT weddingId FROM guest_parties WHERE inviteToken = ?
  )
  ORDER BY wm.sortOrder ASC, wm.createdAt ASC
`

const partyGuestsSql = `
  SELECT
    g.id,
    g.role,
    g.name,
    g.email,
    g.phone,
    g.notes,
    g.rsvpStatus AS rsvp_status,
    selection.menuDishId AS selection_menu_dish_id,
    selection.dishOptionId AS selection_dish_option_id
  FROM guests g
  LEFT JOIN guest_menu_selections selection ON selection.guestId = g.id
  WHERE g.partyId = (
    SELECT id FROM guest_parties WHERE inviteToken = ?
  )
  ORDER BY g.createdAt ASC, g.id ASC
`

const menuDishesSql = `
  SELECT
    menu_dish.id AS menu_dish_id,
    menu_dish.dishId AS dish_id,
    menu_dish.sortOrder AS menu_dish_sort_order,
    dish.name AS dish_name,
    dish.description AS dish_description,
    option.id AS option_id,
    option.name AS option_name,
    option.description AS option_description,
    option.sortOrder AS option_sort_order
  FROM restaurant_menu_dishes menu_dish
  JOIN dishes dish ON dish.id = menu_dish.dishId
  LEFT JOIN dish_options option ON option.dishId = dish.id
  WHERE menu_dish.menuId = (
    SELECT wedding.menuId
    FROM weddings wedding
    JOIN guest_parties party ON party.weddingId = wedding.id
    WHERE party.inviteToken = ?
  )
  ORDER BY menu_dish.sortOrder ASC, option.sortOrder ASC
`

function requiredString(row: D1Row, key: string) {
  const value = row[key]

  if (typeof value !== "string") {
    throw new Error(`D1 no devolvió el campo de texto ${key}`)
  }

  return value
}

function nullableString(row: D1Row, key: string) {
  const value = row[key]
  return typeof value === "string" ? value : null
}

function numberValue(row: D1Row, key: string) {
  const value = row[key]

  if (typeof value !== "number") {
    throw new Error(`D1 no devolvió el campo numérico ${key}`)
  }

  return value
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

function toParty(base: D1Row, guestRows: D1Row[]): PublicGuestInviteParty {
  const guests = new Map<string, PublicGuestInviteParty["guests"][number]>()

  for (const row of guestRows) {
    const id = requiredString(row, "id")
    let guest = guests.get(id)

    if (!guest) {
      const rsvpStatus = requiredString(row, "rsvp_status")
      guest = {
        id,
        role: row.role === "companion" ? "companion" : "primary",
        name: requiredString(row, "name"),
        email: nullableString(row, "email"),
        phone: nullableString(row, "phone"),
        notes: nullableString(row, "notes") ?? "",
        rsvp:
          rsvpStatus === "confirmed"
            ? "Confirmado"
            : rsvpStatus === "declined"
              ? "Declinado"
              : "Sin respuesta",
        menuSelections: [],
      }
      guests.set(id, guest)
    }

    const menuDishId = nullableString(row, "selection_menu_dish_id")
    const dishOptionId = nullableString(row, "selection_dish_option_id")

    if (menuDishId && dishOptionId) {
      guest.menuSelections.push({ menuDishId, dishOptionId })
    }
  }

  return {
    id: requiredString(base, "party_id"),
    weddingId: requiredString(base, "wedding_id"),
    inviteToken: requiredString(base, "invite_token"),
    groupName: nullableString(base, "group_name") ?? "",
    invite: base.invite_status === "sent" ? "Enviada" : "Pendiente",
    guests: [...guests.values()],
  }
}

function toWedding(base: D1Row, memberRows: D1Row[]): Wedding {
  const weddingId = requiredString(base, "wedding_id")

  return {
    id: weddingId,
    ownerId: requiredString(base, "wedding_owner_id"),
    slug: requiredString(base, "wedding_slug"),
    date: requiredString(base, "wedding_date"),
    status: base.wedding_status === "published" ? "published" : "draft",
    partnerInviteCode: null,
    partnerInviteEmail: null,
    restaurantId: nullableString(base, "wedding_restaurant_id"),
    menuId: nullableString(base, "wedding_menu_id"),
    members: memberRows.map((row) => ({
      id: requiredString(row, "id"),
      weddingId,
      appUserId: nullableString(row, "app_user_id"),
      role: {
        id: requiredString(row, "role_id"),
        code: roleCodeFromDb(requiredString(row, "role_code")),
        label: requiredString(row, "role_label"),
        sortOrder: numberValue(row, "role_sort_order"),
      },
      displayName: nullableString(row, "display_name"),
      sortOrder: numberValue(row, "sort_order"),
    })),
    ceremonyLocation: nullableString(base, "ceremony_id")
      ? {
          id: requiredString(base, "ceremony_id"),
          weddingId,
          name: requiredString(base, "ceremony_name"),
          address: nullableString(base, "ceremony_address"),
          city: requiredString(base, "ceremony_city"),
          mapsUrl: nullableString(base, "ceremony_maps_url"),
        }
      : null,
    restaurant: nullableString(base, "restaurant_id")
      ? {
          id: requiredString(base, "restaurant_id"),
          name: requiredString(base, "restaurant_name"),
          address: nullableString(base, "restaurant_address"),
          city: requiredString(base, "restaurant_city"),
          mapsUrl: nullableString(base, "restaurant_maps_url"),
        }
      : null,
    menu: nullableString(base, "menu_id")
      ? {
          id: requiredString(base, "menu_id"),
          restaurantId: requiredString(base, "menu_restaurant_id"),
          name: requiredString(base, "menu_name"),
          description: nullableString(base, "menu_description"),
        }
      : null,
  }
}

function toDesign(base: D1Row): InvitationDesign {
  return {
    id: requiredString(base, "design_id"),
    weddingId: requiredString(base, "wedding_id"),
    templateId: normalizeInvitationTemplateId(
      requiredString(base, "design_template_id"),
    ),
    titleFont: normalizeInvitationFontPairId(
      requiredString(base, "design_title_font"),
    ),
    palette: normalizeInvitationColorPresetId(
      requiredString(base, "design_palette"),
    ),
    content: parseInvitationContent(requiredString(base, "design_content")),
    openingEffect: requiredString(base, "design_opening_effect"),
    musicEnabled:
      base.design_music_enabled === true || base.design_music_enabled === 1,
  }
}

function toMenu(base: D1Row, rows: D1Row[]): WeddingMenuDetails | null {
  const menuId = nullableString(base, "menu_id")

  if (!menuId) {
    return null
  }

  const dishes = new Map<string, WeddingMenuDetails["dishes"][number]>()

  for (const row of rows) {
    const menuDishId = requiredString(row, "menu_dish_id")
    let dish = dishes.get(menuDishId)

    if (!dish) {
      dish = {
        id: menuDishId,
        dishId: requiredString(row, "dish_id"),
        name: requiredString(row, "dish_name"),
        description: nullableString(row, "dish_description"),
        sortOrder: numberValue(row, "menu_dish_sort_order"),
        options: [],
      }
      dishes.set(menuDishId, dish)
    }

    const optionId = nullableString(row, "option_id")

    if (optionId) {
      dish.options.push({
        id: optionId,
        name: requiredString(row, "option_name"),
        description: nullableString(row, "option_description"),
        sortOrder: numberValue(row, "option_sort_order"),
      })
    }
  }

  return {
    id: menuId,
    restaurantId: requiredString(base, "menu_restaurant_id"),
    name: requiredString(base, "menu_name"),
    description: nullableString(base, "menu_description"),
    dishes: [...dishes.values()],
  }
}

export class D1PublicInvitationQuery implements PublicInvitationQuery {
  constructor(private readonly database: D1BatchDatabase) {}

  async findByToken(token: string) {
    const [baseResult, membersResult, guestsResult, menuResult] =
      await this.database.batch([
        this.database.prepare(baseInvitationSql).bind(token),
        this.database.prepare(weddingMembersSql).bind(token),
        this.database.prepare(partyGuestsSql).bind(token),
        this.database.prepare(menuDishesSql).bind(token),
      ])
    const base = baseResult.results[0]

    if (!base) {
      return null
    }

    return toPublicInvitationDto({
      party: toParty(base, guestsResult.results),
      wedding: toWedding(base, membersResult.results),
      design: toDesign(base),
      menu: toMenu(base, menuResult.results),
    })
  }
}
