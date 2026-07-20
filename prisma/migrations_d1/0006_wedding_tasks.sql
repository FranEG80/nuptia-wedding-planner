-- CreateTable
CREATE TABLE "wedding_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weddingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "completedById" TEXT,
    "completedAt" DATETIME,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "wedding_tasks_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "wedding_tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "wedding_members" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "wedding_tasks_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "wedding_members" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "wedding_tasks_weddingId_idx" ON "wedding_tasks"("weddingId");
