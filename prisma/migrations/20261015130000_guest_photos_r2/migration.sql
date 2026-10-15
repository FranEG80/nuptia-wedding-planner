-- guest_photos no se usaba todavía (ninguna parte de la app escribía en ella).
-- Se recrea con el formato de las fotos en R2: original, optimizada WebP y
-- miniatura, y guestId opcional para las fotos de los fotógrafos.
DROP TABLE IF EXISTS "guest_photos";

-- CreateTable
CREATE TABLE "guest_photos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weddingId" TEXT NOT NULL,
    "guestId" TEXT,
    "uploaderRole" TEXT NOT NULL DEFAULT 'guest',
    "uploaderPhone" TEXT,
    "credit" TEXT,
    "originalKey" TEXT NOT NULL,
    "optimizedKey" TEXT NOT NULL,
    "thumbnailKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "originalBytes" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "guest_photos_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "guest_photos_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "guest_photos_weddingId_status_createdAt_idx" ON "guest_photos"("weddingId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "guest_photos_guestId_idx" ON "guest_photos"("guestId");
