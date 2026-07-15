import type { Metadata } from "next"

import { PublicWeddingSitePage } from "@/domains/wedding-sites/adapters/next/pages/public-wedding-site-page"
import { getPublicWeddingExperience } from "@/domains/wedding-sites/adapters/next/pages/public-wedding-site-page"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const wedding = await getPublicWeddingExperience(slug)

  if (!wedding) {
    return { title: "Boda | Nuptia" }
  }

  return {
    title: `${wedding.displayName} · ${wedding.dateLabel}`,
    description: `Toda la información de la boda de ${wedding.displayName} en ${wedding.city}.`,
  }
}

export default async function PublicWeddingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return <PublicWeddingSitePage slug={slug} />
}
