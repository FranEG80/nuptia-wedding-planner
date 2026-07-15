-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "accessTokenExpiresAt" DATETIME,
    "refreshTokenExpiresAt" DATETIME,
    "scope" TEXT,
    "idToken" TEXT,
    "password" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "app_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "weddings" (
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "wedding_member_roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "wedding_members" (
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "guests" (
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

-- CreateTable
CREATE TABLE "guest_invited_by" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guestId" TEXT NOT NULL,
    "weddingMemberId" TEXT NOT NULL,
    CONSTRAINT "guest_invited_by_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "guest_invited_by_weddingMemberId_fkey" FOREIGN KEY ("weddingMemberId") REFERENCES "wedding_members" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invitation_designs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weddingId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL DEFAULT 'bouquet',
    "titleFont" TEXT NOT NULL DEFAULT 'serif',
    "palette" TEXT NOT NULL DEFAULT 'sage',
    "content" TEXT NOT NULL DEFAULT '{}',
    "heroAssetId" TEXT,
    "musicAssetId" TEXT,
    "musicEnabled" BOOLEAN NOT NULL DEFAULT false,
    "openingEffect" TEXT NOT NULL DEFAULT 'envelope',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "invitation_designs_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "invitation_designs_heroAssetId_fkey" FOREIGN KEY ("heroAssetId") REFERENCES "media_assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "invitation_designs_musicAssetId_fkey" FOREIGN KEY ("musicAssetId") REFERENCES "media_assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wedding_site_modules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weddingId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "config" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "wedding_site_modules_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weddingId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'local',
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "media_assets_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "guest_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weddingId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "signatureUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "guest_messages_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "guest_photos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weddingId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "assetId" TEXT,
    "url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "guest_photos_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "restaurants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "mapsUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "dishes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "dishes_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dish_options" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dishId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dish_options_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "dishes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "restaurant_menu_dishes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "menuId" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "restaurant_menu_dishes_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "restaurant_menus" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "restaurant_menu_dishes_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "dishes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "guest_menu_selections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guestId" TEXT NOT NULL,
    "menuDishId" TEXT NOT NULL,
    "dishOptionId" TEXT NOT NULL,
    CONSTRAINT "guest_menu_selections_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "guest_menu_selections_menuDishId_fkey" FOREIGN KEY ("menuDishId") REFERENCES "restaurant_menu_dishes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "guest_menu_selections_dishOptionId_fkey" FOREIGN KEY ("dishOptionId") REFERENCES "dish_options" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
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

-- CreateTable
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

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "verification_expiresAt_idx" ON "verification"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "app_users_email_key" ON "app_users"("email");

-- CreateIndex
CREATE INDEX "auth_identities_appUserId_idx" ON "auth_identities"("appUserId");

-- CreateIndex
CREATE UNIQUE INDEX "auth_identities_provider_providerUserId_key" ON "auth_identities"("provider", "providerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "weddings_slug_key" ON "weddings"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "weddings_partnerInviteCode_key" ON "weddings"("partnerInviteCode");

-- CreateIndex
CREATE INDEX "weddings_ownerId_idx" ON "weddings"("ownerId");

-- CreateIndex
CREATE INDEX "weddings_restaurantId_idx" ON "weddings"("restaurantId");

-- CreateIndex
CREATE INDEX "weddings_menuId_idx" ON "weddings"("menuId");

-- CreateIndex
CREATE UNIQUE INDEX "wedding_ceremony_locations_weddingId_key" ON "wedding_ceremony_locations"("weddingId");

-- CreateIndex
CREATE UNIQUE INDEX "wedding_member_roles_code_key" ON "wedding_member_roles"("code");

-- CreateIndex
CREATE INDEX "wedding_members_weddingId_idx" ON "wedding_members"("weddingId");

-- CreateIndex
CREATE INDEX "wedding_members_appUserId_idx" ON "wedding_members"("appUserId");

-- CreateIndex
CREATE INDEX "wedding_members_roleId_idx" ON "wedding_members"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "wedding_members_weddingId_appUserId_key" ON "wedding_members"("weddingId", "appUserId");

-- CreateIndex
CREATE UNIQUE INDEX "guest_parties_inviteToken_key" ON "guest_parties"("inviteToken");

-- CreateIndex
CREATE INDEX "guest_parties_weddingId_idx" ON "guest_parties"("weddingId");

-- CreateIndex
CREATE UNIQUE INDEX "guests_uploadToken_key" ON "guests"("uploadToken");

-- CreateIndex
CREATE INDEX "guests_weddingId_idx" ON "guests"("weddingId");

-- CreateIndex
CREATE INDEX "guests_partyId_idx" ON "guests"("partyId");

-- CreateIndex
CREATE INDEX "guests_appUserId_idx" ON "guests"("appUserId");

-- CreateIndex
CREATE INDEX "guest_invited_by_weddingMemberId_idx" ON "guest_invited_by"("weddingMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "guest_invited_by_guestId_weddingMemberId_key" ON "guest_invited_by"("guestId", "weddingMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "invitation_designs_weddingId_key" ON "invitation_designs"("weddingId");

-- CreateIndex
CREATE INDEX "wedding_site_modules_weddingId_idx" ON "wedding_site_modules"("weddingId");

-- CreateIndex
CREATE UNIQUE INDEX "wedding_site_modules_weddingId_type_key" ON "wedding_site_modules"("weddingId", "type");

-- CreateIndex
CREATE INDEX "media_assets_weddingId_idx" ON "media_assets"("weddingId");

-- CreateIndex
CREATE INDEX "guest_messages_weddingId_idx" ON "guest_messages"("weddingId");

-- CreateIndex
CREATE INDEX "guest_messages_guestId_idx" ON "guest_messages"("guestId");

-- CreateIndex
CREATE INDEX "guest_photos_weddingId_idx" ON "guest_photos"("weddingId");

-- CreateIndex
CREATE INDEX "guest_photos_guestId_idx" ON "guest_photos"("guestId");

-- CreateIndex
CREATE INDEX "restaurant_menus_restaurantId_idx" ON "restaurant_menus"("restaurantId");

-- CreateIndex
CREATE INDEX "dishes_restaurantId_idx" ON "dishes"("restaurantId");

-- CreateIndex
CREATE INDEX "dish_options_dishId_idx" ON "dish_options"("dishId");

-- CreateIndex
CREATE INDEX "restaurant_menu_dishes_dishId_idx" ON "restaurant_menu_dishes"("dishId");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_menu_dishes_menuId_dishId_key" ON "restaurant_menu_dishes"("menuId", "dishId");

-- CreateIndex
CREATE INDEX "guest_menu_selections_menuDishId_idx" ON "guest_menu_selections"("menuDishId");

-- CreateIndex
CREATE INDEX "guest_menu_selections_dishOptionId_idx" ON "guest_menu_selections"("dishOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "guest_menu_selections_guestId_menuDishId_key" ON "guest_menu_selections"("guestId", "menuDishId");

-- CreateIndex
CREATE INDEX "wedding_tables_weddingId_idx" ON "wedding_tables"("weddingId");

-- CreateIndex
CREATE UNIQUE INDEX "wedding_seats_guestId_key" ON "wedding_seats"("guestId");

-- CreateIndex
CREATE UNIQUE INDEX "wedding_seats_tableId_position_key" ON "wedding_seats"("tableId", "position");

