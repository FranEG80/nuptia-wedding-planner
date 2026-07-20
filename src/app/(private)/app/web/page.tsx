import { WeddingWebsitePage } from "@/domains/wedding-sites/adapters/next/pages/wedding-website-page"

export default function WeddingWebsiteRoutePage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <div
        aria-hidden="true"
        className="pointer-events-none select-none opacity-40 blur-sm"
      >
        <WeddingWebsitePage />
      </div>
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/30">
        <span className="rotate-[-8deg] rounded-lg border border-border bg-background/80 px-6 py-3 text-lg font-semibold uppercase tracking-widest text-muted-foreground shadow-sm">
          Temporalmente deshabilitado
        </span>
      </div>
    </div>
  )
}
