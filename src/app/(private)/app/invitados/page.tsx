import { GuestsPage } from "@/domains/guests/adapters/next/pages/guests-page"

export default async function GuestsRoutePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; estado?: string }>
}) {
  const params = await searchParams

  return <GuestsPage searchParams={params} />
}
