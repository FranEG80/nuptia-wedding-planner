-- Normalize unexpected roles before enforcing one recipient per invitation.
UPDATE "guests"
SET "role" = 'companion'
WHERE "role" NOT IN ('primary', 'companion');

-- Keep the oldest current primary when a party has more than one.
WITH "ranked_primaries" AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "partyId"
      ORDER BY "createdAt" ASC, "id" ASC
    ) AS "recipientRank"
  FROM "guests"
  WHERE "role" = 'primary'
)
UPDATE "guests"
SET "role" = 'companion'
WHERE "id" IN (
  SELECT "id"
  FROM "ranked_primaries"
  WHERE "recipientRank" > 1
);

-- Promote the oldest guest when an existing party has no primary.
WITH "ranked_guests" AS (
  SELECT
    "id",
    "partyId",
    ROW_NUMBER() OVER (
      PARTITION BY "partyId"
      ORDER BY "createdAt" ASC, "id" ASC
    ) AS "guestRank"
  FROM "guests"
),
"parties_without_primary" AS (
  SELECT "partyId"
  FROM "guests"
  GROUP BY "partyId"
  HAVING SUM(CASE WHEN "role" = 'primary' THEN 1 ELSE 0 END) = 0
)
UPDATE "guests"
SET "role" = 'primary'
WHERE "id" IN (
  SELECT "ranked_guests"."id"
  FROM "ranked_guests"
  INNER JOIN "parties_without_primary"
    ON "parties_without_primary"."partyId" = "ranked_guests"."partyId"
  WHERE "ranked_guests"."guestRank" = 1
);

-- SQLite/D1 partial index: at most one explicit recipient per party.
CREATE UNIQUE INDEX "guests_one_primary_per_party"
ON "guests"("partyId")
WHERE "role" = 'primary';
