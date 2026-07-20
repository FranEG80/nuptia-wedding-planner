-- The bespoke template for Nacho and María Daniela is stored in the database
-- so both the editor and each public guest link resolve the same design.
UPDATE "invitation_designs"
SET "templateId" = 'maria-daniela'
WHERE "weddingId" IN (
  SELECT "id"
  FROM "weddings"
  WHERE "slug" = 'nacho-y-maria-daniela'
);
