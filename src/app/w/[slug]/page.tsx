import { PublicWeddingSitePage } from "@/domains/wedding-sites/adapters/next/pages/public-wedding-site-page"

export default async function PublicWeddingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return <PublicWeddingSitePage slug={slug} />
}
