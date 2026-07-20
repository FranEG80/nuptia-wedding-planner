-- AlterTable
ALTER TABLE "guests" ADD COLUMN "firstName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "guests" ADD COLUMN "lastName" TEXT NOT NULL DEFAULT '';

-- Backfill: heuristic split of the existing full name
-- (first word -> firstName, remainder -> lastName).
UPDATE "guests"
SET
  "firstName" = CASE
    WHEN instr(trim("name"), ' ') > 0
      THEN substr(trim("name"), 1, instr(trim("name"), ' ') - 1)
    ELSE trim("name")
  END,
  "lastName" = CASE
    WHEN instr(trim("name"), ' ') > 0
      THEN trim(substr(trim("name"), instr(trim("name"), ' ') + 1))
    ELSE ''
  END;
