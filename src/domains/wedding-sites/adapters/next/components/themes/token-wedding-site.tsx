import Image from "next/image"
import type { CSSProperties } from "react"
import { Camera, Clock, Gift, MapPin, Music2 } from "lucide-react"

import { CopyIbanButton } from "@/domains/wedding-sites/adapters/next/components/copy-iban-button"
import { WeddingCountdown } from "@/domains/wedding-sites/adapters/next/components/wedding-countdown"
import type { WeddingSiteThemeProps } from "@/domains/wedding-sites/adapters/next/components/themes/wedding-site-theme-props"
import type { WeddingExperienceContent } from "@/domains/wedding-sites/application/dtos/wedding-experience.dto"
import {
  getInvitationColorPreset,
  getInvitationFontPair,
} from "@/domains/invitations/domain/invitation-template-options"
import { cn } from "@/shared/lib/utils"

/**
 * Base común de los templates tokenizados. `bouquet` es la versión editorial y
 * amplia; `demo` reaprovecha la misma estructura con el aire más compacto y
 * centrado de la plantilla antigua.
 */
export type TokenWeddingSiteVariant = "bouquet" | "demo"

const HERO_PHOTO = "/images/couple-hero.webp"

export function TokenWeddingSite({
  content,
  theme,
  pages,
  currentPage,
  onNavigate,
  variant,
}: WeddingSiteThemeProps & { variant: TokenWeddingSiteVariant }) {
  const colorPreset = getInvitationColorPreset(theme.colorPresetId)
  const fontPair = getInvitationFontPair(theme.fontPairId)
  const isDemo = variant === "demo"

  return (
    <div
      className="min-h-svh bg-[var(--site-page)] text-[var(--site-text)] [font-family:var(--site-body-font)]"
      style={{
        "--site-page": colorPreset.tokens.page,
        "--site-panel": colorPreset.tokens.panel,
        "--site-section": colorPreset.tokens.section,
        "--site-card": colorPreset.tokens.card,
        "--site-text": colorPreset.tokens.text,
        "--site-heading": colorPreset.tokens.heading,
        "--site-muted": colorPreset.tokens.muted,
        "--site-accent": colorPreset.tokens.accent,
        "--site-accent-text": colorPreset.tokens.accentText,
        "--site-border": colorPreset.tokens.border,
        "--site-title-font": fontPair.titleFamily,
        "--site-body-font": fontPair.bodyFamily,
      } as CSSProperties}
    >
      <header
        className={cn(
          "sticky top-0 z-20 border-b border-[var(--site-border)] bg-[var(--site-panel)]/95 backdrop-blur",
          isDemo ? "px-4 py-3 text-center" : "px-5 py-4 text-center",
        )}
      >
        <p
          className={cn(
            "text-[var(--site-heading)] [font-family:var(--site-title-font)]",
            isDemo ? "text-lg tracking-[0.18em] uppercase" : "text-2xl",
          )}
        >
          {content.displayName}
        </p>
        <p className="mt-0.5 text-xs uppercase tracking-[0.28em] text-[var(--site-muted)]">
          {content.dateLabel}
        </p>
        <nav className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {pages.map((page) => {
            const isActive = page.id === currentPage

            return (
              <button
                key={page.id}
                type="button"
                onClick={() => onNavigate(page.id)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative pb-1 text-xs uppercase tracking-[0.18em] transition-colors",
                  isActive
                    ? "text-[var(--site-heading)]"
                    : "text-[var(--site-muted)] hover:text-[var(--site-heading)]",
                )}
              >
                {page.label}
                {isActive && (
                  <span className="absolute inset-x-0 bottom-0 h-px bg-[var(--site-accent)]" />
                )}
              </button>
            )
          })}
        </nav>
      </header>

      <main className={cn("mx-auto w-full", isDemo ? "max-w-2xl px-4 py-10" : "max-w-4xl px-5 py-14")}>
        {currentPage === "inicio" && <HomePage content={content} isDemo={isDemo} />}
        {currentPage === "menu" && <MenuPage content={content} isDemo={isDemo} />}
        {currentPage === "itinerario" && <TimelinePage content={content} isDemo={isDemo} />}
        {currentPage === "regalos" && <GiftsPage content={content} />}
        {currentPage === "musica" && <MusicPage content={content} />}
        {currentPage === "galeria" && <GalleryPage content={content} />}
      </main>

      <footer className="border-t border-[var(--site-border)] bg-[var(--site-panel)] px-5 py-10 text-center">
        <p className="text-sm text-[var(--site-muted)]">
          Confirma tu asistencia desde el enlace privado de tu invitación. Fecha límite: {content.rsvpDeadline}.
        </p>
        {content.contacts.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            {content.contacts.map((contact) => (
              <a
                key={contact.phone}
                href={contact.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-[var(--site-border)] px-4 py-2 text-xs text-[var(--site-heading)] transition-colors hover:bg-[var(--site-section)]"
              >
                WhatsApp de {contact.name}
              </a>
            ))}
          </div>
        )}
      </footer>
    </div>
  )
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--site-accent)]">{eyebrow}</p>
      <h2 className="mt-2 text-3xl text-[var(--site-heading)] [font-family:var(--site-title-font)]">
        {title}
      </h2>
    </div>
  )
}

function HomePage({ content, isDemo }: { content: WeddingExperienceContent; isDemo: boolean }) {
  const hasLocation = content.enabledModules.includes("location")

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl">
        <div className="relative h-64 w-full sm:h-80">
          <Image
            src={HERO_PHOTO}
            alt={content.displayName}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 900px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[var(--site-heading)]/45" />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center text-white">
            <p className="text-[10px] uppercase tracking-[0.42em]">Nos casamos</p>
            <p className={cn("mt-2 [font-family:var(--site-title-font)]", isDemo ? "text-4xl" : "text-5xl")}>
              {content.displayName}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.3em]">
              {content.dateLabel} · {content.city}
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3 text-center">
        {[
          { key: "Fecha", value: content.dateLabel.split(" de ")[0] ?? content.dateLabel },
          { key: "Ceremonia", value: `${content.ceremony.time} h` },
          { key: "Lugar", value: content.city },
        ].map((item) => (
          <div key={item.key} className="rounded-2xl bg-[var(--site-section)] px-3 py-4">
            <p className="text-lg text-[var(--site-heading)] [font-family:var(--site-title-font)]">
              {item.value}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-[var(--site-muted)]">
              {item.key}
            </p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <SectionTitle eyebrow="Nuestra historia" title="Cómo llegamos hasta aquí" />
        <div className="mx-auto max-w-2xl space-y-3 text-center text-sm leading-7 text-[var(--site-muted)]">
          {content.story.slice(0, 4).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      {hasLocation && (
        <section className="space-y-5">
          <SectionTitle eyebrow="Dónde nos encontramos" title="El gran día" />
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "La ceremonia", place: content.ceremony },
              { label: "La celebración", place: content.reception },
            ].map(({ label, place }) => (
              <article
                key={label}
                className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-card)] p-5"
              >
                <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--site-accent)]">{label}</p>
                <h3 className="mt-2 text-xl text-[var(--site-heading)] [font-family:var(--site-title-font)]">
                  {place.name}
                </h3>
                <p className="mt-1 text-sm text-[var(--site-muted)]">{place.time} h</p>
                <address className="mt-2 text-sm not-italic leading-6 text-[var(--site-muted)]">
                  {place.address}
                </address>
                <a
                  href={place.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--site-heading)] underline underline-offset-4"
                >
                  <MapPin className="h-4 w-4" strokeWidth={1.75} />
                  Cómo llegar
                </a>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-3xl bg-[var(--site-section)] px-5 py-10 text-center">
        <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--site-muted)]">Nos vemos en</p>
        <div className="mt-3 text-[var(--site-heading)] [font-family:var(--site-title-font)]">
          <WeddingCountdown dateIso={content.dateIso} />
        </div>
      </section>
    </div>
  )
}

function MenuPage({ content, isDemo }: { content: WeddingExperienceContent; isDemo: boolean }) {
  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Un banquete pensado con cariño" title="Nuestro menú" />
      <div className={cn("grid gap-5", isDemo ? "sm:grid-cols-1" : "sm:grid-cols-3")}>
        {content.menu.map((course) => (
          <article
            key={course.id}
            className="overflow-hidden rounded-2xl border border-[var(--site-border)] bg-[var(--site-card)]"
          >
            <div className="relative h-44 w-full">
              <Image
                src={course.imageSrc}
                alt={course.name}
                fill
                sizes="(max-width: 768px) 100vw, 320px"
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--site-accent)]">
                {course.course}
              </p>
              <p className="mt-1 text-lg text-[var(--site-heading)] [font-family:var(--site-title-font)]">
                {course.name}
              </p>
            </div>
          </article>
        ))}
      </div>
      <p className="rounded-2xl bg-[var(--site-section)] px-5 py-4 text-center text-sm text-[var(--site-muted)]">
        ¿Alguna alergia o intolerancia? Indícanoslo al confirmar tu asistencia.
      </p>
    </div>
  )
}

function TimelinePage({ content, isDemo }: { content: WeddingExperienceContent; isDemo: boolean }) {
  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="El plan del gran día" title="Itinerario" />
      <ol className="mx-auto max-w-xl space-y-4">
        {content.timeline.map((item) => (
          <li
            key={item.id}
            className={cn(
              "flex items-start gap-4 rounded-2xl border border-[var(--site-border)] bg-[var(--site-card)] p-4",
              isDemo && "text-center sm:text-left",
            )}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--site-section)] text-[var(--site-accent)]">
              <Clock className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-sm tabular-nums text-[var(--site-accent)]">{item.time} h</p>
              <h3 className="text-lg text-[var(--site-heading)] [font-family:var(--site-title-font)]">
                {item.title}
              </h3>
              <p className="text-sm text-[var(--site-muted)]">{item.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

function GiftsPage({ content }: { content: WeddingExperienceContent }) {
  return (
    <div className="space-y-6 text-center">
      <Gift className="mx-auto h-9 w-9 text-[var(--site-accent)]" strokeWidth={1.5} />
      <SectionTitle eyebrow="El mejor regalo es veros" title="Mesa de regalos" />
      <p className="mx-auto max-w-lg text-sm leading-7 text-[var(--site-muted)]">
        Vuestra presencia es nuestro mejor regalo. Si aun así queréis tener un detalle, os dejamos
        nuestra cuenta.
      </p>
      {content.gifts ? (
        <div className="mx-auto max-w-md space-y-3 rounded-2xl border border-dashed border-[var(--site-border)] bg-[var(--site-card)] px-5 py-6">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--site-muted)]">
            Titular: {content.gifts.accountHolder}
          </p>
          <p className="font-mono text-sm text-[var(--site-heading)]">{content.gifts.iban}</p>
          <CopyIbanButton iban={content.gifts.iban} />
        </div>
      ) : (
        <p className="text-sm text-[var(--site-muted)]">
          Todavía no hemos publicado los datos de la cuenta.
        </p>
      )}
    </div>
  )
}

function MusicPage({ content }: { content: WeddingExperienceContent }) {
  return (
    <div className="space-y-8">
      <Music2 className="mx-auto h-9 w-9 text-[var(--site-accent)]" strokeWidth={1.5} />
      <SectionTitle eyebrow="Ayúdanos con la lista" title="La banda sonora" />
      <ul className="mx-auto max-w-lg space-y-3">
        {content.playlist.map((track) => (
          <li
            key={track.id}
            className="flex items-center gap-3 rounded-2xl border border-[var(--site-border)] bg-[var(--site-card)] px-4 py-3"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--site-section)] text-[var(--site-accent)]">
              <Music2 className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <span>
              <span className="block text-sm text-[var(--site-heading)]">{track.title}</span>
              <span className="block text-xs text-[var(--site-muted)]">{track.artist}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function GalleryPage({ content }: { content: WeddingExperienceContent }) {
  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Sube tus fotos del gran día" title="Galería" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {content.gallery.map((photo) => (
          <div key={photo.id} className="relative aspect-square overflow-hidden rounded-2xl">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(max-width: 768px) 50vw, 220px"
              className="object-cover"
            />
          </div>
        ))}
      </div>
      <p className="flex items-center justify-center gap-2 text-sm text-[var(--site-muted)]">
        <Camera className="h-4 w-4" strokeWidth={1.75} />
        Podréis subir vuestras fotos desde vuestra invitación personal.
      </p>
    </div>
  )
}
