-- Better Auth admin plugin fields. This prepares the MVP admin account and
-- leaves impersonation available for the future cross-wedding control panel.
ALTER TABLE "user" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';
ALTER TABLE "user" ADD COLUMN "banned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "user" ADD COLUMN "banReason" TEXT;
ALTER TABLE "user" ADD COLUMN "banExpires" DATETIME;

ALTER TABLE "session" ADD COLUMN "impersonatedBy" TEXT;
