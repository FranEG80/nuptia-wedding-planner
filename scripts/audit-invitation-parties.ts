import { getPlatformProxy } from "wrangler"

interface OversizedPartyRow {
  id: string
  groupName: string | null
  guestCount: number
  guestNames: string
}

interface RecipientAuditRow {
  id: string
  primaryCount: number
}

function isMissingSchemaError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.toLowerCase().includes("no such table")
  )
}

async function run() {
  const remote = process.argv.includes("--remote")
  const platform = await getPlatformProxy<Pick<CloudflareEnv, "DB">>({
    configPath: "wrangler.jsonc",
    persist: remote ? false : true,
    remoteBindings: remote,
  })

  try {
    let oversizedParties: OversizedPartyRow[]

    try {
      const result = await platform.env.DB.prepare(
        `SELECT
           party.id AS id,
           party.groupName AS groupName,
           COUNT(guest.id) AS guestCount,
           GROUP_CONCAT(guest.name, ' | ') AS guestNames
         FROM guest_parties AS party
         INNER JOIN guests AS guest ON guest.partyId = party.id
         GROUP BY party.id, party.groupName
         HAVING COUNT(guest.id) > 2
         ORDER BY COUNT(guest.id) DESC, party.id ASC`,
      ).all<OversizedPartyRow>()
      oversizedParties = result.results
    } catch (error) {
      if (isMissingSchemaError(error)) {
        console.info(
          "Auditoría omitida: la base todavía no tiene las tablas iniciales.",
        )
        return
      }

      throw error
    }

    const recipientResult = await platform.env.DB.prepare(
      `SELECT
         party.id AS id,
         SUM(CASE WHEN guest.role = 'primary' THEN 1 ELSE 0 END) AS primaryCount
       FROM guest_parties AS party
       INNER JOIN guests AS guest ON guest.partyId = party.id
       GROUP BY party.id
       HAVING SUM(CASE WHEN guest.role = 'primary' THEN 1 ELSE 0 END) <> 1
       ORDER BY party.id ASC`,
    ).all<RecipientAuditRow>()

    if (oversizedParties.length) {
      console.error(
        "Migración detenida: hay invitaciones con más de dos invitados.",
      )

      for (const party of oversizedParties) {
        console.error(
          `- ${party.id} (${party.groupName ?? "sin grupo"}): ${party.guestCount} — ${party.guestNames}`,
        )
      }

      throw new Error(
        "Corrige manualmente esas invitaciones antes de aplicar la migración; no se ha eliminado ni fusionado ningún dato.",
      )
    }

    console.info("Auditoría correcta: ninguna invitación supera dos invitados.")
    console.info(
      recipientResult.results.length
        ? `La migración normalizará el destinatario de ${recipientResult.results.length} invitación(es).`
        : "Todas las invitaciones ya tienen exactamente un destinatario.",
    )
  } finally {
    await platform.dispose()
  }
}

run().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
