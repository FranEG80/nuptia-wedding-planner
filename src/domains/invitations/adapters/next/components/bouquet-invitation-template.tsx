import Image from "next/image"
import type { CSSProperties, ReactNode } from "react"
import { ExternalLink, Gift, Link as LinkIcon, MapPin } from "lucide-react"

import type { InvitationContentDto } from "@/domains/invitations/application/dtos/invitation-design.dto"
import {
  getInvitationColorPreset,
  getInvitationFontPair,
  getInvitationPhotoAsset,
} from "@/domains/invitations/domain/invitation-template-options"
import type { WeddingDto } from "@/domains/weddings/application/dtos/wedding.dto"
import { cn } from "@/shared/lib/utils"
import { InvitationMenuDrawer } from "@/domains/invitations/adapters/next/components/invitation-menu-drawer"

export function BouquetInvitationTemplate({
  wedding,
  content,
  rsvpSlot,
  className,
  preview = false,
}: {
  wedding: WeddingDto
  content: InvitationContentDto
  rsvpSlot?: ReactNode
  className?: string
  preview?: boolean
}) {
  const names = wedding.displayName
  const venueName =
    wedding.ceremonyLocation?.name ?? wedding.restaurant?.name ?? content.venueTitle
  const venueAddress =
    wedding.ceremonyLocation?.address ?? wedding.restaurant?.address
  const venueCity = wedding.primaryCity
  const mapsUrl =
    wedding.ceremonyLocation?.mapsUrl ?? wedding.restaurant?.mapsUrl ?? ""
  const fontPair = getInvitationFontPair(content.fontPairId)
  const colorPreset = getInvitationColorPreset(content.colorPresetId)
  const heroPhoto = getInvitationPhotoAsset(content.photoAssetId)
  const visible = content.visibleSections

  return (
    <div
      className={cn(
        "min-h-svh bg-[var(--invite-page)] text-[var(--invite-text)] lg:h-svh lg:overflow-hidden",
        className,
      )}
      style={{
        "--invite-page": colorPreset.tokens.page,
        "--invite-panel": colorPreset.tokens.panel,
        "--invite-section": colorPreset.tokens.section,
        "--invite-card": colorPreset.tokens.card,
        "--invite-text": colorPreset.tokens.text,
        "--invite-heading": colorPreset.tokens.heading,
        "--invite-muted": colorPreset.tokens.muted,
        "--invite-accent": colorPreset.tokens.accent,
        "--invite-accent-dark": colorPreset.tokens.accentDark,
        "--invite-accent-text": colorPreset.tokens.accentText,
        "--invite-border": colorPreset.tokens.border,
        "--invite-title-font": fontPair.titleFamily,
        "--invite-body-font": fontPair.bodyFamily,
      } as CSSProperties}
    >
      <div className="grid min-h-svh lg:h-svh lg:overflow-hidden lg:grid-cols-[minmax(0,1.07fr)_minmax(360px,0.93fr)]">
        <section className="relative min-h-svh overflow-y-auto scroll-smooth bg-[var(--invite-panel)] [font-family:var(--invite-body-font)] lg:h-svh lg:overscroll-contain [scrollbar-gutter:stable]">
          {preview ? null : <InvitationMenuDrawer visibleSections={visible} />}

          <div className="grid min-h-svh place-items-center px-5 py-24 text-center">
            <div className="w-full max-w-[520px]">
              <p className="text-[clamp(0.8rem,2.6vw,1.05rem)] uppercase tracking-[0.42em] text-[var(--invite-heading)]">
                {content.eyebrow}
              </p>
              <div className="mt-5 rounded-[28px] bg-white/88 px-5 py-5 shadow-[0_24px_90px_rgba(110,90,62,0.10)]">
                <h1
                  className="bg-cover bg-center text-[clamp(5rem,18vw,9rem)] font-black leading-[0.82] tracking-[0.03em] text-transparent [font-family:var(--invite-title-font)]"
                  style={{
                    backgroundImage: `url(${content.monogramImageSrc})`,
                    backgroundPosition: "right bottom",
                    backgroundSize: "145%",
                    WebkitBackgroundClip: "text",
                    WebkitTextStroke: "1px color-mix(in srgb, var(--invite-accent) 24%, transparent)",
                    backgroundClip: "text",
                  }}
                  aria-label={content.heroWord}
                >
                  {content.heroWord}
                </h1>
              </div>
              <p className="mt-6 text-3xl text-[var(--invite-heading)] [font-family:var(--invite-title-font)] sm:text-4xl">
                {names}
              </p>
              <p className="mt-2 text-sm uppercase tracking-[0.22em] text-[var(--invite-accent-dark)]">
                {formatDate(wedding.date)} · {venueCity}
              </p>
            </div>
          </div>

          <a
            href="#story"
            className=" bottom-4 left-0 right-0 hidden text-center text-lg text-white/80 lg:block"
          >
            Scroll Down
          </a>

          <main id="story" className="bg-[var(--invite-panel)] border-t-6 border-[var(--invite-section)]">
            {visible.story ? (
            <section className="px-8 py-14 sm:px-12">
              <h2 className="text-center text-4xl text-[var(--invite-heading)] [font-family:var(--invite-title-font)]">
                {content.storyTitle}
              </h2>
              <div className="mx-auto mt-7 max-w-3xl space-y-5 text-pretty text-lg leading-8 text-[var(--invite-muted)]">
                {content.story.map((paragraph, index) => (
                  <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
                ))}
              </div>
            </section>
            ) : null}

            {visible.schedule ? (
            <section id="schedule" className="bg-[var(--invite-section)] px-6 py-12 sm:px-10">
              <h2 className="text-center text-4xl text-[var(--invite-heading)] [font-family:var(--invite-title-font)]">
                {content.scheduleTitle}
              </h2>
              <div className="mx-auto mt-9 max-w-3xl">
                <div className="relative space-y-8 before:absolute before:left-7 before:top-3 before:h-[calc(100%-1.5rem)] before:w-px before:bg-[var(--invite-accent)]">
                  {content.schedule.map((item) => (
                    <article key={item.id} className="relative grid grid-cols-[3.5rem_1fr] gap-4">
                      <span className="relative z-10 mt-0.5 h-12 w-12 rounded-full border border-[var(--invite-accent)] bg-[var(--invite-section)]" />
                      <div className="pb-2 text-lg leading-7">
                        <h3 className="font-bold text-[var(--invite-text)]">{item.title}</h3>
                        <p>{item.date} · {item.time}</p>
                        {item.location ? (
                          item.mapsUrl ? (
                            <a
                              href={item.mapsUrl}
                              className="inline-flex items-center gap-1 text-[var(--invite-accent-dark)]"
                              target="_blank"
                              rel="noreferrer"
                            >
                              {item.location}
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <p className="text-[var(--invite-accent-dark)]">{item.location}</p>
                          )
                        ) : null}
                        <p className="mt-4 text-base text-[var(--invite-text)]">{item.description}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
            ) : null}

            {visible.venue ? (
            <section id="venue" className="px-8 py-14 text-center sm:px-12">
              <h2 className="text-4xl text-[var(--invite-heading)] [font-family:var(--invite-title-font)]">{content.venueTitle}</h2>
              <div className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-[var(--invite-muted)]">
                <p className="font-bold">{venueName}</p>
                {venueAddress ? <p>{venueAddress}</p> : null}
                <p>{venueCity}</p>
                <p className="mt-5 italic">{content.venueNote}</p>
                {mapsUrl ? (
                  <a
                    href={mapsUrl}
                    target="_blank"
                  rel="noreferrer"
                    className="mt-5 inline-flex items-center gap-2 text-[var(--invite-accent-dark)]"
                  >
                    <MapPin className="h-4 w-4" />
                    Ver mapa
                  </a>
                ) : null}
              </div>
            </section>
            ) : null}

            {visible.travel ? (
            <section id="travel" className="bg-[var(--invite-section)] px-6 py-14 sm:px-10">
              <h2 className="text-center text-4xl text-[var(--invite-heading)] [font-family:var(--invite-title-font)]">
                {content.travelTitle}
              </h2>
              <div className="mx-auto mt-9 max-w-4xl space-y-6">
                {content.travel.map((item) => (
                  <article key={item.id} className="grid gap-5 sm:grid-cols-[128px_1fr]">
                    <div className="relative h-32 overflow-hidden rounded-[6px] bg-[var(--invite-border)]">
                      <Image draggable="false"
                        src={item.imageSrc || "/images/venue.png"}
                        alt=""
                        fill
                        sizes="128px"
                        className="object-cover"
                      />
                    </div>
                    <div className="text-[var(--invite-text)]">
                      <h3 className="text-xl font-bold">{item.title}</h3>
                      <p className="mt-1 leading-7">{item.description}</p>
                      <div className="mt-3 flex flex-wrap gap-5 text-sm text-[var(--invite-accent-dark)]">
                        {item.websiteUrl ? (
                          <a href={item.websiteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1">
                            <LinkIcon className="h-3.5 w-3.5" />
                            Web
                          </a>
                        ) : null}
                        {item.mapsUrl ? (
                          <a href={item.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            Mapa
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
            ) : null}

            {visible.registry ? (
            <section id="registry" className="px-8 py-14 text-center sm:px-12">
              {/* <h2 className="text-4xl text-[var(--invite-heading)] [font-family:var(--invite-title-font)]">{content.registryTitle}</h2>
              <p className="mx-auto mt-6 max-w-2xl text-lg">{content.registryIntro}</p>
              <p className="mx-auto mt-2 max-w-2xl text-base text-[var(--invite-muted)]">{content.registryNote}</p>
              <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-3">
                {content.registry.map((item) => {
                  const inner = (
                    <span className="grid min-h-28 place-items-center border border-[var(--invite-accent)] px-4 py-5 text-xl text-[var(--invite-accent-dark)] [font-family:var(--invite-title-font)]">
                      {item.title}
                    </span>
                  )

                  return item.url ? (
                    <a key={item.id} href={item.url} target="_blank" rel="noreferrer">
                      {inner}
                    </a>
                  ) : (
                    <div key={item.id}>{inner}</div>
                  )
                })}
              </div> */}
              <div className="space-y-4 p-5 text-center">
                <Gift className="mx-auto size-12 text-accent" strokeWidth={1.5} />
                <h4 className="text-4xl text-[var(--invite-heading)] [font-family:var(--invite-title-font)]">{content.registryTitle}</h4>
                <p className="mx-auto max-w-lg  text-muted-foreground mt-1 leading-7">
                  {content.registryIntro}
                </p>
                {content.registry.map((item) => (
                  <div key={item.id} className="rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-3 font-mono text-xl text-foreground">
                    {item.title}
                  </div>
                ))}
                <p className="text-sm text-muted-foreground">{content.registryNote}</p>
              </div>
            </section>
            ) : null}

            {visible.questions ? (
            <section id="questions" className="bg-[var(--invite-panel)] px-8 pb-20 text-center sm:px-12">
              <h2 className="text-3xl text-[var(--invite-heading)] [font-family:var(--invite-title-font)]">{content.questionsTitle}</h2>
              <p className="mt-3 text-lg text-[var(--invite-muted)]">
                Escríbenos a{" "}
                <a className="text-[var(--invite-accent-dark)]" href={`mailto:${content.contactEmail}`}>
                  {content.contactEmail}
                </a>
              </p>
            </section>
            ) : null}

            {visible.rsvp ? (
            <section
              id="mobile-rsvp"
              className="bg-[var(--invite-section)] px-8 py-14 text-center lg:hidden"
            >
              <h2 className="text-3xl font-bold leading-tight text-[var(--invite-accent)] [font-family:var(--invite-title-font)]">
                {content.rsvpTitle}
              </h2>
              <p className="mt-5 leading-7 text-[var(--invite-accent-dark)]">{content.rsvpSubtitle}</p>
              <div className="mt-8">{rsvpSlot ?? <DefaultRsvpLink />}</div>
            </section>
            ) : null}
          </main>
        </section>

        {visible.rsvp ? (
        <aside id="rsvp" className="relative hidden min-h-svh overflow-hidden lg:block lg:h-svh">
          <Image draggable="false"
            src={heroPhoto.src}
            alt=""
            fill
            priority={!preview}
            sizes="45vw"
            className="object-cover object-right-bottom saturate-[1.15]"
          />
          <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--invite-accent)_18%,transparent)]" />
          <div className="relative z-10 h-full">
            {rsvpSlot ?? (
              <div className="flex min-h-svh items-start justify-center px-8 pt-20">
                <div className="w-full max-w-[520px] rounded-[6px] bg-[color-mix(in_srgb,var(--invite-section)_94%,white)] px-8 py-10 text-center shadow-[0_26px_70px_rgba(71,48,23,0.20)]">
                  <h2 className="text-4xl font-bold leading-tight text-[var(--invite-accent)] [font-family:var(--invite-title-font)]">
                    {content.rsvpTitle}
                  </h2>
                  <p className="mt-6 leading-7 text-[var(--invite-accent-dark)]">{content.rsvpSubtitle}</p>
                  <div className="mt-8"><DefaultRsvpLink /></div>
                </div>
              </div>
            )}
          </div>
        </aside>
        ) : null}
      </div>

      {preview || !visible.rsvp || rsvpSlot ? null : (
        <a
          href="#mobile-rsvp"
          className="fixed bottom-3 left-1/2 z-30 inline-flex w-[calc(100%-4rem)] max-w-sm -translate-x-1/2 items-center justify-center rounded-[6px] bg-[var(--invite-accent)] px-5 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--invite-accent-text)] shadow-lg lg:hidden"
        >
          RSVP
        </a>
      )}
    </div>
  )
}

function DefaultRsvpLink() {
  return (
    <a
      href="#rsvp"
      className="inline-flex items-center justify-center rounded-[6px] bg-white px-6 py-3 font-medium text-[var(--invite-text)] shadow"
    >
      Confirmar asistencia
    </a>
  )
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}
