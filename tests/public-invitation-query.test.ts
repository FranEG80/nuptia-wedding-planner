import assert from "node:assert/strict"
import { test } from "node:test"

import type {
  D1BatchDatabase,
  D1BatchPreparedStatement,
  D1BatchResult,
  D1BatchStatement,
} from "@/core/db/d1-batch"
import { D1PublicInvitationQuery } from "@/domains/invitations/adapters/d1/d1-public-invitation.query"

class TestStatement implements D1BatchPreparedStatement {
  constructor(
    readonly sql: string,
    readonly params: readonly unknown[] = [],
  ) {}

  bind(...values: unknown[]) {
    return new TestStatement(this.sql, values)
  }
}

test("la invitación pública se obtiene en un único batch D1", async () => {
  const token = "invite-token"
  let calls = 0
  let capturedStatements: readonly D1BatchStatement[] = []
  const fixture: D1BatchResult[] = [
    {
      results: [
        {
          party_id: "party-1",
          wedding_id: "wedding-1",
          invite_token: token,
          group_name: "Familia García",
          invite_status: "sent",
          wedding_owner_id: "private-owner",
          wedding_slug: "ana-y-luis",
          wedding_date: "2026-09-12T17:00:00.000Z",
          wedding_status: "published",
          wedding_restaurant_id: "restaurant-1",
          wedding_menu_id: "menu-1",
          ceremony_id: "ceremony-1",
          ceremony_name: "Ermita",
          ceremony_address: "Calle Mayor 1",
          ceremony_city: "Madrid",
          ceremony_maps_url: "https://maps.example/ceremony",
          restaurant_id: "restaurant-1",
          restaurant_name: "La Finca",
          restaurant_address: "Camino 2",
          restaurant_city: "Madrid",
          restaurant_maps_url: "https://maps.example/restaurant",
          menu_id: "menu-1",
          menu_restaurant_id: "restaurant-1",
          menu_name: "Menú de boda",
          menu_description: "Descripción",
          design_id: "design-1",
          design_template_id: "bouquet",
          design_title_font: "playfair-inter",
          design_palette: "sage",
          design_content: "{}",
          design_opening_effect: "envelope",
          design_music_enabled: 0,
        },
      ],
    },
    {
      results: [
        {
          id: "member-1",
          wedding_id: "wedding-1",
          app_user_id: null,
          display_name: "Ana",
          sort_order: 0,
          role_id: "role-bride",
          role_code: "bride",
          role_label: "Novia",
          role_sort_order: 1,
        },
        {
          id: "member-2",
          wedding_id: "wedding-1",
          app_user_id: null,
          display_name: "Luis",
          sort_order: 1,
          role_id: "role-groom",
          role_code: "groom",
          role_label: "Novio",
          role_sort_order: 2,
        },
      ],
    },
    {
      results: [
        {
          id: "guest-1",
          role: "primary",
          name: "Marta",
          email: null,
          phone: null,
          notes: null,
          rsvp_status: "confirmed",
          selection_menu_dish_id: "menu-dish-1",
          selection_dish_option_id: "option-1",
        },
      ],
    },
    {
      results: [
        {
          menu_dish_id: "menu-dish-1",
          dish_id: "dish-1",
          menu_dish_sort_order: 0,
          dish_name: "Principal",
          dish_description: null,
          option_id: "option-1",
          option_name: "Carne",
          option_description: null,
          option_sort_order: 0,
        },
      ],
    },
  ]
  const database: D1BatchDatabase = {
    prepare: (sql) => new TestStatement(sql),
    batch: async (statements) => {
      calls += 1
      capturedStatements = statements
      return fixture
    },
  }

  const invitation = await new D1PublicInvitationQuery(database).findByToken(token)

  assert.equal(calls, 1)
  assert.equal(capturedStatements.length, 4)
  assert.deepEqual(
    capturedStatements.map((statement) => statement.params),
    [[token], [token], [token], [token]],
  )
  assert.equal(invitation?.wedding.displayName, "Ana & Luis")
  assert.equal(invitation?.guests[0]?.rsvp, "Confirmado")
  assert.deepEqual(invitation?.guests[0]?.menuSelections, [
    { menuDishId: "menu-dish-1", dishOptionId: "option-1" },
  ])
  assert.equal(invitation?.menu?.dishes[0]?.options[0]?.name, "Carne")
  assert.equal("ownerId" in (invitation?.wedding ?? {}), false)
  assert.equal("partnerInviteCode" in (invitation?.wedding ?? {}), false)
})

test("la lectura pública devuelve null si el token no existe", async () => {
  const database: D1BatchDatabase = {
    prepare: (sql) => new TestStatement(sql),
    batch: async () => [
      { results: [] },
      { results: [] },
      { results: [] },
      { results: [] },
    ],
  }

  const invitation = await new D1PublicInvitationQuery(database).findByToken(
    "missing",
  )

  assert.equal(invitation, null)
})
