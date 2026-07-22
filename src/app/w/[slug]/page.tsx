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


  const title = `${wedding.displayName} · ${wedding.dateLabel}`
  const description = `Toda la información de la boda de ${wedding.displayName} en ${wedding.city}.`

  let [domain, protocol] = process.env.APP_URL.split("://"), baseUrl, customOgImage;
  if (wedding.partnerNames.some((name) => name.toLowerCase() === "maria daniela") && wedding.partnerNames.some((name) => name.toLowerCase() === "nacho")) {
    domain = "bodamariadanielaynacho.es"
    protocol = "https"
    baseUrl = `${protocol}://${domain}`
    customOgImage = `${baseUrl}/images/templates/maria-daniela/ogimage/opengraph_image.jpg`
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
