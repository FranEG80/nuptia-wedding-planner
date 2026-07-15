-- Preserve existing bespoke invitations after renaming the template identifier.
UPDATE "invitation_designs"
SET "templateId" = 'demo'
WHERE "templateId" = 'custom';
