import type { Metadata } from "next"

import { MARIA_DANIELA_CUSTOM_DOMAIN } from "@/domains/invitations/domain/invitation-template-options"
import { PublicWeddingSitePage } from "@/domains/wedding-sites/adapters/next/pages/public-wedding-site-page"
import { getPublicWeddingExperience } from "@/domains/wedding-sites/adapters/next/pages/public-wedding-site-page"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const experience = await getPublicWeddingExperience(slug)

  if (!experience) {
    return { title: "Boda | Nuptia" }
  }

  const wedding = experience.content


  const title = `${wedding.displayName} · ${wedding.dateLabel}`
  const description = `Toda la información de la boda de ${wedding.displayName} en ${wedding.city}.`

  let customOgImage: string | undefined

  if (
    wedding.partnerNames.some((name) => name.toLowerCase() === "maria daniela") &&
    wedding.partnerNames.some((name) => name.toLowerCase() === "nacho")
  ) {
    customOgImage = `https://${MARIA_DANIELA_CUSTOM_DOMAIN}/images/templates/maria-daniela/ogimage/opengraph_image.jpg`
  }

  if (customOgImage) {
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        images: [
          {
            url: customOgImage,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [customOgImage],
      },
    }
  }

  return {
    title,
    description,
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
