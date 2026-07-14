/*
  Warnings:

  - You are about to drop the column `guestName` on the `guest_messages` table. All the data in the column will be lost.
  - You are about to drop the column `guestName` on the `guest_photos` table. All the data in the column will be lost.
  - You are about to drop the column `menu` on the `guests` table. All the data in the column will be lost.
  - You are about to drop the column `plusOnes` on the `guests` table. All the data in the column will be lost.
  - You are about to drop the column `venueCity` on the `weddings` table. All the data in the column will be lost.
  - You are about to drop the column `venueName` on the `weddings` table. All the data in the column will be lost.
  - Added the required column `guestId` to the `guest_messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guestId` to the `guest_photos` table without a default value. This is not possible if the table is not empty.
  - The required column `inviteToken` was added to the `guests` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateTable
CREATE TABLE "wedding_venues" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weddingId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "mapsUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "wedding_venues_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "guest_companions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guestId" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "guest_companions_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wedding_menu_courses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weddingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "wedding_menu_courses_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wedding_menu_options" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wedding_menu_options_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "wedding_menu_courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "guest_menu_selections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guestId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    CONSTRAINT "guest_menu_selections_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "guest_menu_selections_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "wedding_menu_courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "guest_menu_selections_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "wedding_menu_options" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "companion_menu_selections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companionId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    CONSTRAINT "companion_menu_selections_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "guest_companions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "companion_menu_selections_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "wedding_menu_courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "companion_menu_selections_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "wedding_menu_options" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_guest_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weddingId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "signatureUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "guest_messages_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_guest_messages" ("createdAt", "id", "message", "signatureUrl", "status", "weddingId") SELECT "createdAt", "id", "message", "signatureUrl", "status", "weddingId" FROM "guest_messages";
DROP TABLE "guest_messages";
ALTER TABLE "new_guest_messages" RENAME TO "guest_messages";
CREATE INDEX "guest_messages_weddingId_idx" ON "guest_messages"("weddingId");
CREATE INDEX "guest_messages_guestId_idx" ON "guest_messages"("guestId");
CREATE TABLE "new_guest_photos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weddingId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "assetId" TEXT,
    "url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "guest_photos_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_guest_photos" ("assetId", "createdAt", "id", "status", "url", "weddingId") SELECT "assetId", "createdAt", "id", "status", "url", "weddingId" FROM "guest_photos";
DROP TABLE "guest_photos";
ALTER TABLE "new_guest_photos" RENAME TO "guest_photos";
CREATE INDEX "guest_photos_weddingId_idx" ON "guest_photos"("weddingId");
CREATE INDEX "guest_photos_guestId_idx" ON "guest_photos"("guestId");
CREATE TABLE "new_guests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weddingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "groupName" TEXT,
    "inviteStatus" TEXT NOT NULL DEFAULT 'pending',
    "rsvpStatus" TEXT NOT NULL DEFAULT 'no_response',
    "notes" TEXT,
    "tableNumber" INTEGER,
    "inviteToken" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "guests_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_guests" ("createdAt", "email", "groupName", "id", "inviteStatus", "name", "notes", "phone", "rsvpStatus", "tableNumber", "updatedAt", "weddingId") SELECT "createdAt", "email", "groupName", "id", "inviteStatus", "name", "notes", "phone", "rsvpStatus", "tableNumber", "updatedAt", "weddingId" FROM "guests";
DROP TABLE "guests";
ALTER TABLE "new_guests" RENAME TO "guests";
CREATE UNIQUE INDEX "guests_inviteToken_key" ON "guests"("inviteToken");
CREATE INDEX "guests_weddingId_idx" ON "guests"("weddingId");
CREATE TABLE "new_invitation_designs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weddingId" TEXT NOT NULL,
    "titleFont" TEXT NOT NULL DEFAULT 'serif',
    "palette" TEXT NOT NULL DEFAULT 'sage',
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
INSERT INTO "new_invitation_designs" ("createdAt", "heroAssetId", "id", "musicAssetId", "musicEnabled", "openingEffect", "palette", "titleFont", "updatedAt", "weddingId") SELECT "createdAt", "heroAssetId", "id", "musicAssetId", "musicEnabled", "openingEffect", "palette", "titleFont", "updatedAt", "weddingId" FROM "invitation_designs";
DROP TABLE "invitation_designs";
ALTER TABLE "new_invitation_designs" RENAME TO "invitation_designs";
CREATE UNIQUE INDEX "invitation_designs_weddingId_key" ON "invitation_designs"("weddingId");
CREATE TABLE "new_weddings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "coOwnerId" TEXT,
    "slug" TEXT NOT NULL,
    "brideName" TEXT NOT NULL,
    "groomName" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "spotifyPlaylistUrl" TEXT,
    "partnerInviteCode" TEXT,
    "partnerInviteEmail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "weddings_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "app_users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "weddings_coOwnerId_fkey" FOREIGN KEY ("coOwnerId") REFERENCES "app_users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_weddings" ("brideName", "createdAt", "date", "groomName", "id", "ownerId", "slug", "status", "updatedAt") SELECT "brideName", "createdAt", "date", "groomName", "id", "ownerId", "slug", "status", "updatedAt" FROM "weddings";
DROP TABLE "weddings";
ALTER TABLE "new_weddings" RENAME TO "weddings";
CREATE UNIQUE INDEX "weddings_slug_key" ON "weddings"("slug");
CREATE UNIQUE INDEX "weddings_partnerInviteCode_key" ON "weddings"("partnerInviteCode");
CREATE INDEX "weddings_ownerId_idx" ON "weddings"("ownerId");
CREATE INDEX "weddings_coOwnerId_idx" ON "weddings"("coOwnerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "wedding_venues_weddingId_idx" ON "wedding_venues"("weddingId");

-- CreateIndex
CREATE UNIQUE INDEX "wedding_venues_weddingId_type_key" ON "wedding_venues"("weddingId", "type");

-- CreateIndex
CREATE INDEX "guest_companions_guestId_idx" ON "guest_companions"("guestId");

-- CreateIndex
CREATE INDEX "guest_companions_weddingId_idx" ON "guest_companions"("weddingId");

-- CreateIndex
CREATE INDEX "wedding_menu_courses_weddingId_idx" ON "wedding_menu_courses"("weddingId");

-- CreateIndex
CREATE INDEX "wedding_menu_options_courseId_idx" ON "wedding_menu_options"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "guest_menu_selections_guestId_courseId_key" ON "guest_menu_selections"("guestId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "companion_menu_selections_companionId_courseId_key" ON "companion_menu_selections"("companionId", "courseId");
