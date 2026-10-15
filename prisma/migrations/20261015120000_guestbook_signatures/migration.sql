-- CreateTable
CREATE TABLE "guestbook_signatures" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weddingId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "guestbook_signatures_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "guestbook_signatures_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "guestbook_signatures_weddingId_status_createdAt_idx" ON "guestbook_signatures"("weddingId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "guestbook_signatures_guestId_idx" ON "guestbook_signatures"("guestId");
