PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "legacy_auth_identities" AS
SELECT "id", "appUserId", "provider", "providerUserId", "email", "createdAt", "updatedAt"
FROM "external_identities";

CREATE TABLE "legacy_ceremony_locations" AS
SELECT "id", "weddingId", "name", "address", "city", "mapsUrl", "createdAt", "updatedAt"
FROM "wedding_venues"
WHERE "type" = 'ceremony';

CREATE TABLE "legacy_guest_menu_selections" AS
SELECT "id", "guestId", "courseId", "optionId"
FROM "guest_menu_selections";

CREATE TABLE "legacy_companion_menu_selections" AS
SELECT "id", "companionId", "courseId", "optionId"
FROM "companion_menu_selections";

CREATE TABLE "legacy_guest_tables" AS
SELECT "id", "weddingId", "name", "tableNumber"
FROM "guests"
WHERE "tableNumber" IS NOT NULL;

CREATE TABLE "wedding_member_roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0
);

INSERT INTO "wedding_member_roles" ("id", "code", "label", "sortOrder") VALUES
    ('role-owner', 'owner', 'Propietario', 1),
    ('role-groom', 'groom', 'Novio', 2),
    ('role-bride', 'bride', 'Novia', 3),
    ('role-partner', 'partner', 'Pareja', 4),
    ('role-planner', 'planner', 'Wedding planner', 5);

CREATE TABLE "new_app_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "new_app_users" ("id", "email", "name", "imageUrl", "createdAt", "updatedAt")
SELECT "id", "email", "name", "imageUrl", "createdAt", "updatedAt"
FROM "app_users";

CREATE TABLE "restaurants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "mapsUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "restaurants" ("id", "name", "address", "city", "mapsUrl", "createdAt", "updatedAt")
SELECT 'restaurant-' || "id", "name", "address", "city", "mapsUrl", "createdAt", "updatedAt"
FROM "wedding_venues"
WHERE "type" = 'banquet';

INSERT INTO "restaurants" ("id", "name", "address", "city", "mapsUrl", "createdAt", "updatedAt")
SELECT
    'restaurant-custom-' || w."id",
    'Restaurante sin asignar',
    NULL,
    COALESCE((SELECT v."city" FROM "wedding_venues" v WHERE v."weddingId" = w."id" ORDER BY v."type" LIMIT 1), 'Sin ciudad'),
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "weddings" w
WHERE EXISTS (SELECT 1 FROM "wedding_menu_courses" c WHERE c."weddingId" = w."id")
  AND NOT EXISTS (SELECT 1 FROM "wedding_venues" v WHERE v."weddingId" = w."id" AND v."type" = 'banquet');

CREATE TABLE "restaurant_menus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "restaurant_menus_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "restaurant_menus" ("id", "restaurantId", "name", "description", "active", "createdAt", "updatedAt")
SELECT
    'menu-' || w."id",
    COALESCE('restaurant-' || banquet."id", 'restaurant-custom-' || w."id"),
    'Menú de boda',
    NULL,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "weddings" w
LEFT JOIN "wedding_venues" banquet ON banquet."weddingId" = w."id" AND banquet."type" = 'banquet'
WHERE EXISTS (SELECT 1 FROM "wedding_menu_courses" c WHERE c."weddingId" = w."id");

CREATE TABLE "dishes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "dishes_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "dishes" ("id", "restaurantId", "name", "description", "createdAt", "updatedAt")
SELECT
    'dish-' || c."id",
    COALESCE('restaurant-' || banquet."id", 'restaurant-custom-' || c."weddingId"),
    c."name",
    c."description",
    c."createdAt",
    c."updatedAt"
FROM "wedding_menu_courses" c
LEFT JOIN "wedding_venues" banquet ON banquet."weddingId" = c."weddingId" AND banquet."type" = 'banquet';

CREATE TABLE "dish_options" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dishId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dish_options_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "dishes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "dish_options" ("id", "dishId", "name", "description", "sortOrder", "createdAt")
SELECT 'dish-option-' || o."id", 'dish-' || o."courseId", o."name", o."description", o."sortOrder", o."createdAt"
FROM "wedding_menu_options" o;

CREATE TABLE "restaurant_menu_dishes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "menuId" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "restaurant_menu_dishes_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "restaurant_menus" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "restaurant_menu_dishes_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "dishes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "restaurant_menu_dishes" ("id", "menuId", "dishId", "sortOrder")
SELECT 'menu-dish-' || c."id", 'menu-' || c."weddingId", 'dish-' || c."id", c."sortOrder"
FROM "wedding_menu_courses" c;

UPDATE "wedding_site_modules"
SET "config" = (
    SELECT '{"playlistUrl":"' || w."spotifyPlaylistUrl" || '"}'
    FROM "weddings" w
    WHERE w."id" = "wedding_site_modules"."weddingId"
)
WHERE "type" = 'spotify'
  AND EXISTS (
    SELECT 1
    FROM "weddings" w
    WHERE w."id" = "wedding_site_modules"."weddingId"
      AND w."spotifyPlaylistUrl" IS NOT NULL
      AND w."spotifyPlaylistUrl" <> ''
  );

CREATE TABLE "new_weddings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "partnerInviteCode" TEXT,
    "partnerInviteEmail" TEXT,
    "restaurantId" TEXT,
    "menuId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "weddings_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "app_users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "weddings_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "weddings_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "restaurant_menus" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_weddings" ("id", "ownerId", "slug", "date", "status", "partnerInviteCode", "partnerInviteEmail", "restaurantId", "menuId", "createdAt", "updatedAt")
SELECT
    w."id",
    w."ownerId",
    w."slug",
    w."date",
    w."status",
    w."partnerInviteCode",
    w."partnerInviteEmail",
    CASE
        WHEN banquet."id" IS NOT NULL THEN 'restaurant-' || banquet."id"
        WHEN EXISTS (SELECT 1 FROM "wedding_menu_courses" c WHERE c."weddingId" = w."id") THEN 'restaurant-custom-' || w."id"
        ELSE NULL
    END,
    CASE
        WHEN EXISTS (SELECT 1 FROM "wedding_menu_courses" c WHERE c."weddingId" = w."id") THEN 'menu-' || w."id"
        ELSE NULL
    END,
    w."createdAt",
    w."updatedAt"
FROM "weddings" w
LEFT JOIN "wedding_venues" banquet ON banquet."weddingId" = w."id" AND banquet."type" = 'banquet';

CREATE TABLE "new_wedding_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weddingId" TEXT NOT NULL,
    "appUserId" TEXT,
    "roleId" TEXT NOT NULL,
    "displayName" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wedding_members_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "wedding_members_appUserId_fkey" FOREIGN KEY ("appUserId") REFERENCES "app_users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "wedding_members_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "wedding_member_roles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_wedding_members" ("id", "weddingId", "appUserId", "roleId", "displayName", "sortOrder", "createdAt")
SELECT
    wm."id",
    wm."weddingId",
    wm."appUserId",
    CASE lower(wm."role")
        WHEN 'groom' THEN 'role-groom'
        WHEN 'bride' THEN 'role-bride'
        WHEN 'partner' THEN 'role-partner'
        WHEN 'planner' THEN 'role-planner'
        ELSE 'role-owner'
    END,
    NULL,
    0,
    wm."createdAt"
FROM "wedding_members" wm;

INSERT INTO "new_wedding_members" ("id", "weddingId", "appUserId", "roleId", "displayName", "sortOrder", "createdAt")
SELECT 'member-bride-' || w."id", w."id", NULL, 'role-bride', w."brideName", 1, CURRENT_TIMESTAMP
FROM "weddings" w
WHERE w."brideName" IS NOT NULL AND w."brideName" <> '';

INSERT INTO "new_wedding_members" ("id", "weddingId", "appUserId", "roleId", "displayName", "sortOrder", "createdAt")
SELECT 'member-groom-' || w."id", w."id", NULL, 'role-groom', w."groomName", 2, CURRENT_TIMESTAMP
FROM "weddings" w
WHERE w."groomName" IS NOT NULL AND w."groomName" <> '';

INSERT INTO "new_wedding_members" ("id", "weddingId", "appUserId", "roleId", "displayName", "sortOrder", "createdAt")
SELECT 'member-co-owner-' || w."id", w."id", w."coOwnerId", 'role-partner', NULL, 3, CURRENT_TIMESTAMP
FROM "weddings" w
WHERE w."coOwnerId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "wedding_members" wm
    WHERE wm."weddingId" = w."id" AND wm."appUserId" = w."coOwnerId"
  );

CREATE TABLE "guest_parties" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weddingId" TEXT NOT NULL,
    "inviteToken" TEXT NOT NULL,
    "groupName" TEXT,
    "inviteStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "guest_parties_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "guest_parties" ("id", "weddingId", "inviteToken", "groupName", "inviteStatus", "createdAt", "updatedAt")
SELECT
    'party-' || "id",
    "weddingId",
    COALESCE("inviteToken", 'party-token-' || "id"),
    "groupName",
    "inviteStatus",
    "createdAt",
    "updatedAt"
FROM "guests";

CREATE TABLE "new_guests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partyId" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "appUserId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'primary',
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "rsvpStatus" TEXT NOT NULL DEFAULT 'no_response',
    "notes" TEXT,
    "uploadToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "guests_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "guest_parties" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "guests_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "guests_appUserId_fkey" FOREIGN KEY ("appUserId") REFERENCES "app_users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_guests" ("id", "partyId", "weddingId", "appUserId", "role", "name", "email", "phone", "rsvpStatus", "notes", "uploadToken", "createdAt", "updatedAt")
SELECT
    "id",
    'party-' || "id",
    "weddingId",
    NULL,
    'primary',
    "name",
    "email",
    "phone",
    "rsvpStatus",
    "notes",
    COALESCE("inviteToken", 'upload-' || "id"),
    "createdAt",
    "updatedAt"
FROM "guests";

INSERT INTO "new_guests" ("id", "partyId", "weddingId", "appUserId", "role", "name", "email", "phone", "rsvpStatus", "notes", "uploadToken", "createdAt", "updatedAt")
SELECT
    gc."id",
    'party-' || gc."guestId",
    gc."weddingId",
    NULL,
    'companion',
    gc."name",
    NULL,
    NULL,
    'no_response',
    gc."notes",
    'upload-' || gc."id",
    gc."createdAt",
    gc."updatedAt"
FROM "guest_companions" gc;

DROP TABLE "companion_menu_selections";
DROP TABLE "guest_menu_selections";
DROP TABLE "wedding_menu_options";
DROP TABLE "wedding_menu_courses";
DROP TABLE "guest_companions";
DROP TABLE "guests";
DROP TABLE "wedding_members";
DROP TABLE "wedding_venues";
DROP TABLE "weddings";
DROP TABLE "external_identities";
DROP TABLE "app_users";

ALTER TABLE "new_app_users" RENAME TO "app_users";
ALTER TABLE "new_weddings" RENAME TO "weddings";
ALTER TABLE "new_wedding_members" RENAME TO "wedding_members";
ALTER TABLE "new_guests" RENAME TO "guests";

CREATE TABLE "auth_identities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appUserId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "auth_identities_appUserId_fkey" FOREIGN KEY ("appUserId") REFERENCES "app_users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "auth_identities" ("id", "appUserId", "provider", "providerUserId", "email", "createdAt", "updatedAt")
SELECT "id", "appUserId", "provider", "providerUserId", "email", "createdAt", "updatedAt"
FROM "legacy_auth_identities";

CREATE TABLE "wedding_ceremony_locations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weddingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "mapsUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "wedding_ceremony_locations_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "wedding_ceremony_locations" ("id", "weddingId", "name", "address", "city", "mapsUrl", "createdAt", "updatedAt")
SELECT "id", "weddingId", "name", "address", "city", "mapsUrl", "createdAt", "updatedAt"
FROM "legacy_ceremony_locations";

CREATE TABLE "guest_menu_selections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guestId" TEXT NOT NULL,
    "menuDishId" TEXT NOT NULL,
    "dishOptionId" TEXT NOT NULL,
    CONSTRAINT "guest_menu_selections_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "guest_menu_selections_menuDishId_fkey" FOREIGN KEY ("menuDishId") REFERENCES "restaurant_menu_dishes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "guest_menu_selections_dishOptionId_fkey" FOREIGN KEY ("dishOptionId") REFERENCES "dish_options" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "guest_menu_selections" ("id", "guestId", "menuDishId", "dishOptionId")
SELECT "id", "guestId", 'menu-dish-' || "courseId", 'dish-option-' || "optionId"
FROM "legacy_guest_menu_selections";

INSERT INTO "guest_menu_selections" ("id", "guestId", "menuDishId", "dishOptionId")
SELECT 'companion-' || "id", "companionId", 'menu-dish-' || "courseId", 'dish-option-' || "optionId"
FROM "legacy_companion_menu_selections";

CREATE TABLE "guest_invited_by" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guestId" TEXT NOT NULL,
    "weddingMemberId" TEXT NOT NULL,
    CONSTRAINT "guest_invited_by_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "guest_invited_by_weddingMemberId_fkey" FOREIGN KEY ("weddingMemberId") REFERENCES "wedding_members" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "wedding_tables" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weddingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "capacity" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "wedding_tables_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "wedding_tables" ("id", "weddingId", "name", "sortOrder", "capacity", "createdAt", "updatedAt")
SELECT
    'table-' || "weddingId" || '-' || "tableNumber",
    "weddingId",
    'Mesa ' || "tableNumber",
    "tableNumber",
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "legacy_guest_tables"
GROUP BY "weddingId", "tableNumber";

CREATE TABLE "wedding_seats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tableId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "guestId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "wedding_seats_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "wedding_tables" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "wedding_seats_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "wedding_seats" ("id", "tableId", "position", "guestId", "createdAt", "updatedAt")
SELECT
    'seat-' || "id",
    'table-' || "weddingId" || '-' || "tableNumber",
    ROW_NUMBER() OVER (PARTITION BY "weddingId", "tableNumber" ORDER BY "name", "id"),
    "id",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "legacy_guest_tables";

DROP TABLE "legacy_auth_identities";
DROP TABLE "legacy_ceremony_locations";
DROP TABLE "legacy_guest_menu_selections";
DROP TABLE "legacy_companion_menu_selections";
DROP TABLE "legacy_guest_tables";

CREATE UNIQUE INDEX "app_users_email_key" ON "app_users"("email");
CREATE UNIQUE INDEX "auth_identities_provider_providerUserId_key" ON "auth_identities"("provider", "providerUserId");
CREATE INDEX "auth_identities_appUserId_idx" ON "auth_identities"("appUserId");
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");
CREATE INDEX "verification_expiresAt_idx" ON "verification"("expiresAt");
CREATE UNIQUE INDEX "wedding_member_roles_code_key" ON "wedding_member_roles"("code");
CREATE UNIQUE INDEX "weddings_slug_key" ON "weddings"("slug");
CREATE UNIQUE INDEX "weddings_partnerInviteCode_key" ON "weddings"("partnerInviteCode");
CREATE INDEX "weddings_ownerId_idx" ON "weddings"("ownerId");
CREATE INDEX "weddings_restaurantId_idx" ON "weddings"("restaurantId");
CREATE INDEX "weddings_menuId_idx" ON "weddings"("menuId");
CREATE UNIQUE INDEX "wedding_ceremony_locations_weddingId_key" ON "wedding_ceremony_locations"("weddingId");
CREATE INDEX "wedding_members_weddingId_idx" ON "wedding_members"("weddingId");
CREATE INDEX "wedding_members_appUserId_idx" ON "wedding_members"("appUserId");
CREATE INDEX "wedding_members_roleId_idx" ON "wedding_members"("roleId");
CREATE UNIQUE INDEX "wedding_members_weddingId_appUserId_key" ON "wedding_members"("weddingId", "appUserId");
CREATE INDEX "guest_parties_weddingId_idx" ON "guest_parties"("weddingId");
CREATE UNIQUE INDEX "guest_parties_inviteToken_key" ON "guest_parties"("inviteToken");
CREATE INDEX "guests_weddingId_idx" ON "guests"("weddingId");
CREATE INDEX "guests_partyId_idx" ON "guests"("partyId");
CREATE INDEX "guests_appUserId_idx" ON "guests"("appUserId");
CREATE UNIQUE INDEX "guests_uploadToken_key" ON "guests"("uploadToken");
CREATE UNIQUE INDEX "guest_invited_by_guestId_weddingMemberId_key" ON "guest_invited_by"("guestId", "weddingMemberId");
CREATE INDEX "guest_invited_by_weddingMemberId_idx" ON "guest_invited_by"("weddingMemberId");
CREATE INDEX "restaurant_menus_restaurantId_idx" ON "restaurant_menus"("restaurantId");
CREATE INDEX "dishes_restaurantId_idx" ON "dishes"("restaurantId");
CREATE INDEX "dish_options_dishId_idx" ON "dish_options"("dishId");
CREATE UNIQUE INDEX "restaurant_menu_dishes_menuId_dishId_key" ON "restaurant_menu_dishes"("menuId", "dishId");
CREATE INDEX "restaurant_menu_dishes_dishId_idx" ON "restaurant_menu_dishes"("dishId");
CREATE UNIQUE INDEX "guest_menu_selections_guestId_menuDishId_key" ON "guest_menu_selections"("guestId", "menuDishId");
CREATE INDEX "guest_menu_selections_menuDishId_idx" ON "guest_menu_selections"("menuDishId");
CREATE INDEX "guest_menu_selections_dishOptionId_idx" ON "guest_menu_selections"("dishOptionId");
CREATE INDEX "wedding_tables_weddingId_idx" ON "wedding_tables"("weddingId");
CREATE UNIQUE INDEX "wedding_seats_tableId_position_key" ON "wedding_seats"("tableId", "position");
CREATE UNIQUE INDEX "wedding_seats_guestId_key" ON "wedding_seats"("guestId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
