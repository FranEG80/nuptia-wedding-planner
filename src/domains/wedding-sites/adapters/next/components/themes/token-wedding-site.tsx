import Image from "next/image"
import type { CSSProperties } from "react"
import { Camera, Clock, Gift, MapPin, Music2 } from "lucide-react"

import { CopyIbanButton } from "@/domains/wedding-sites/adapters/next/components/copy-iban-button"
import { WeddingCountdown } from "@/domains/wedding-sites/adapters/next/components/wedding-countdown"
import type { WeddingSiteThemeProps } from "@/domains/wedding-sites/adapters/next/components/themes/wedding-site-theme-props"
import {
  SAMPLE_GALLERY_PHOTOS,
  SAMPLE_GUESTBOOK_SIGNATURES,
  type WeddingExperienceContent,
} from "@/domains/wedding-sites/application/dtos/wedding-experience.dto"
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
  preview = false,
  variant,
}: WeddingSiteThemeProps & { variant: TokenWeddingSiteVariant }) {
  const colorPreset = getInvitationColorPreset(theme.colorPresetId)
  const fontPair = getInvitationFontPair(theme.fontPairId)
  const isDemo = variant === "demo"

  return (
    <div
      className="min-h-svh bg-(--site-page) text-(--site-text) font-(family-name:--site-body-font)"
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
          "sticky top-0 z-20 border-b border-(--site-border) bg-(--site-panel)/95 backdrop-blur",
          isDemo ? "px-4 py-3 text-center" : "px-5 py-4 text-center",
        )}
      >
        <p
          className={cn(
            "text-(--site-heading) font-(family-name:--site-title-font)",
            isDemo ? "text-lg tracking-[0.18em] uppercase" : "text-2xl",
          )}
        >
          {content.displayName}
        </p>
        <p className="mt-0.5 text-xs uppercase tracking-[0.28em] text-(--site-muted)">
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
                    ? "text-(--site-heading)"
                    : "text-(--site-muted) hover:text-(--site-heading)",
                )}
              >
                {page.label}
                {isActive && (
                  <span className="absolute inset-x-0 bottom-0 h-px bg-(--site-accent)" />
                )}
              </button>
            )
          })}
        </nav>
      </header>

      <main className={cn("mx-auto w-full", isDemo ? "max-w-2xl px-4 py-10" : "max-w-4xl px-5 py-14")}>
        {currentPage === "inicio" && <HomePage content={content} isDemo={isDemo} />}
        {currentPage === "historia" && <StoryPage content={content} />}
        {currentPage === "menu" && <MenuPage content={content} isDemo={isDemo} />}
        {currentPage === "musica" && <MusicPage content={content} />}
        {currentPage === "galeria" && <GalleryPage content={content} preview={preview} />}
        {currentPage === "firmas" && <GuestbookPage content={content} preview={preview} />}
      </main>

      <footer className="border-t border-(--site-border) bg-(--site-panel) px-5 py-10 text-center">
        <p className="text-sm text-(--site-muted)">
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
                className="rounded-full border border-(--site-border) px-4 py-2 text-xs text-(--site-heading) transition-colors hover:bg-(--site-section)"
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
      <p className="text-[10px] uppercase tracking-[0.32em] text-(--site-accent)">{eyebrow}</p>
      <h2 className="mt-2 text-3xl text-(--site-heading) font-(family-name:--site-title-font)">
        {title}
      </h2>
    </div>
  )
}

function StoryPage({ content }: { content: WeddingExperienceContent }) {
  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Cómo llegamos hasta aquí" title="Nuestra historia" />
      <div className="mx-auto max-w-2xl space-y-4 text-sm leading-7 text-(--site-muted)">
        {content.story.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
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
          <div className="absolute inset-0 bg-(--site-heading)/45" />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center text-white">
            <p className="text-[10px] uppercase tracking-[0.42em]">Nos casamos</p>
            <p className={cn("mt-2 font-(family-name:--site-title-font)", isDemo ? "text-4xl" : "text-5xl")}>
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
          <div key={item.key} className="rounded-2xl bg-(--site-section) px-3 py-4">
            <p className="text-lg text-(--site-heading) font-(family-name:--site-title-font)">
              {item.value}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-(--site-muted)">
              {item.key}
            </p>
          </div>
        ))}
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
                className="rounded-2xl border border-(--site-border) bg-(--site-card) p-5"
              >
                <p className="text-[10px] uppercase tracking-[0.24em] text-(--site-accent)">{label}</p>
                <h3 className="mt-2 text-xl text-(--site-heading) font-(family-name:--site-title-font)">
                  {place.name}
                </h3>
                <p className="mt-1 text-sm text-(--site-muted)">{place.time} h</p>
                <address className="mt-2 text-sm not-italic leading-6 text-(--site-muted)">
                  {place.address}
                </address>
                <a
                  href={place.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm text-(--site-heading) underline underline-offset-4"
                >
                  <MapPin className="h-4 w-4" strokeWidth={1.75} />
                  Cómo llegar
                </a>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-3xl bg-(--site-section) px-5 py-10 text-center">
        <p className="text-[10px] uppercase tracking-[0.32em] text-(--site-muted)">Nos vemos en</p>
        <div className="mt-3 text-(--site-heading) font-(family-name:--site-title-font)">
          <WeddingCountdown dateIso={content.dateIso} />
        </div>
      </section>

      {content.enabledModules.includes("timeline") && (
        <TimelineSection content={content} isDemo={isDemo} />
      )}
      {content.enabledModules.includes("gifts") && <GiftsSection content={content} />}
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
            className="overflow-hidden rounded-2xl border border-(--site-border) bg-(--site-card)"
          >
            {course.imageSrc && (
              <div className="relative h-44 w-full">
                <Image
                  src={course.imageSrc}
                  alt={course.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 320px"
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-(--site-accent)">
                {course.course}
              </p>
              <p className="mt-1 text-lg text-(--site-heading) font-(family-name:--site-title-font)">
                {course.name}
              </p>
              <ul className="mt-2 space-y-1 text-sm text-(--site-muted)">
                {course.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
      <p className="rounded-2xl bg-(--site-section) px-5 py-4 text-center text-sm text-(--site-muted)">
        ¿Alguna alergia o intolerancia? Indícanoslo al confirmar tu asistencia.
      </p>
    </div>
  )
}

function TimelineSection({ content, isDemo }: { content: WeddingExperienceContent; isDemo: boolean }) {
  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="El plan del gran día" title="Itinerario" />
      <ol className="mx-auto max-w-xl space-y-4">
        {content.timeline.map((item) => (
          <li
            key={item.id}
            className={cn(
              "flex items-start gap-4 rounded-2xl border border-(--site-border) bg-(--site-card) p-4",
              isDemo && "text-center sm:text-left",
            )}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--site-section) text-(--site-accent)">
              <Clock className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-sm tabular-nums text-(--site-accent)">{item.time} h</p>
              <h3 className="text-lg text-(--site-heading) font-(family-name:--site-title-font)">
                {item.title}
              </h3>
              <p className="text-sm text-(--site-muted)">{item.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

function GiftsSection({ content }: { content: WeddingExperienceContent }) {
  return (
    <div className="space-y-6 text-center">
      <Gift className="mx-auto h-9 w-9 text-(--site-accent)" strokeWidth={1.5} />
      <SectionTitle eyebrow="El mejor regalo es veros" title="Mesa de regalos" />
      <p className="mx-auto max-w-lg text-sm leading-7 text-(--site-muted)">
        Vuestra presencia es nuestro mejor regalo. Si aun así queréis tener un detalle, os dejamos
        nuestra cuenta.
      </p>
      {content.gifts ? (
        <div className="mx-auto max-w-md space-y-3 rounded-2xl border border-dashed border-(--site-border) bg-(--site-card) px-5 py-6">
          <p className="text-xs uppercase tracking-[0.22em] text-(--site-muted)">
            Titular: {content.gifts.accountHolder}
          </p>
          <p className="font-mono text-sm text-(--site-heading)">{content.gifts.iban}</p>
          <CopyIbanButton iban={content.gifts.iban} />
        </div>
      ) : (
        <p className="text-sm text-(--site-muted)">
          Todavía no hemos publicado los datos de la cuenta.
        </p>
      )}
    </div>
  )
}

function MusicPage({ content }: { content: WeddingExperienceContent }) {
  return (
    <div className="space-y-8">
      <Music2 className="mx-auto h-9 w-9 text-(--site-accent)" strokeWidth={1.5} />
      <SectionTitle eyebrow="Ayúdanos con la lista" title="La banda sonora" />
      <ul className="mx-auto max-w-lg space-y-3">
        {content.playlist.map((track) => (
          <li
            key={track.id}
            className="flex items-center gap-3 rounded-2xl border border-(--site-border) bg-(--site-card) px-4 py-3"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-(--site-section) text-(--site-accent)">
              <Music2 className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <span>
              <span className="block text-sm text-(--site-heading)">{track.title}</span>
              <span className="block text-xs text-(--site-muted)">{track.artist}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function GuestbookPage({
  content,
  preview,
}: {
  content: WeddingExperienceContent
  preview: boolean
}) {
  const signatures = content.guestbook.length
    ? content.guestbook
    : preview
      ? SAMPLE_GUESTBOOK_SIGNATURES
      : []

  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Dejadnos unas palabras" title="Firmas y felicitaciones" />
      {signatures.length > 0 ? (
        <ul className="mx-auto max-w-lg space-y-3">
          {signatures.map((signature) => (
            <li
              key={signature.id}
              className="rounded-2xl border border-(--site-border) bg-(--site-card) px-4 py-3"
            >
              <p className="text-sm text-(--site-text)">{signature.message}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-(--site-accent)">
                {signature.name}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mx-auto max-w-md text-center text-sm text-(--site-muted)">
          Todavía no hay mensajes. Podéis dejar el vuestro desde el enlace privado de vuestra
          invitación.
        </p>
      )}
    </div>
  )
}

function GalleryPage({ content, preview }: { content: WeddingExperienceContent; preview: boolean }) {
  // La web publicada no enseña fotos de ejemplo: solo las que suban los novios.
  const photos = content.gallery.length ? content.gallery : preview ? SAMPLE_GALLERY_PHOTOS : []

  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Sube tus fotos del gran día" title="Galería" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {photos.map((photo) => (
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
      <p className="flex items-center justify-center gap-2 text-sm text-(--site-muted)">
        <Camera className="h-4 w-4" strokeWidth={1.75} />
        Podréis subir vuestras fotos desde vuestra invitación personal.
      </p>
    </div>
  )
}
