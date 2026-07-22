import Image from "next/image"
import { Fragment, type ReactNode } from "react"

import nachoData from "../../../../../../DATA/nacho.json"

import {
  mariaDanielaAssets,
  weddingPlaceholderPhotos,
} from "@/domains/wedding-sites/adapters/next/components/maria-daniela-assets"
import { NACHO_WEDDING_SLUG } from "@/domains/wedding-sites/application/dtos/wedding-experience.dto"
import type { InvitationContentDto } from "@/domains/invitations/application/dtos/invitation-design.dto"
import { MariaDanielaCountdown } from "@/domains/invitations/adapters/next/components/maria-daniela-countdown"
import type { PublicInvitationWeddingDto } from "@/domains/invitations/application/dtos/public-invitation.dto"
import { EditorialMotion } from "@/shared/components/editorial-motion"
import { cn } from "@/shared/lib/utils"

const ACCOMMODATION_CODE = "BODAD&N2026"

const scheduleArt = [
  mariaDanielaAssets.churchLineDark,
  mariaDanielaAssets.cocktailsDark,
  mariaDanielaAssets.dinnerTableDark,
  mariaDanielaAssets.discoBallDark,
]

const coupleArt = {
  church: mariaDanielaAssets.churchWatercolor,
  hotel: mariaDanielaAssets.hotelWatercolor,
  coupleVertical: mariaDanielaAssets.coupleVertical,
  coupleHorizontal1: mariaDanielaAssets.coupleHorizontal1,
  coupleHorizontal2: mariaDanielaAssets.coupleHorizontal2,
}

const kickerBase = "my-0 mb-4! text-[0.65rem] font-extrabold tracking-[0.24em] uppercase"
const scriptHeading = "my-0 [font-family:var(--font-parisienne),cursive] text-[clamp(3.8rem,8vw,7rem)] font-normal leading-[1.1] pb-[12px]"
const linkUnderline = "inline-block mt-3 border-b border-current text-inherit text-[0.62rem] font-extrabold tracking-[0.15em] no-underline uppercase"
const scheduleMeta = "block my-[0.35rem] text-[rgba(91,77,71,0.72)] text-[0.76rem] leading-[1.5]"
const venueCopy = "my-0 text-[rgba(48,61,56,0.68)] text-[0.85rem] leading-[1.6]"
const registryLink = "block w-fit mx-auto text-inherit [font-family:var(--font-cormorant),serif] text-[clamp(1rem,3vw,1.35rem)] tracking-[0.08em] no-underline"

export function MariaDanielaInvitationTemplate({
  wedding,
  content,
  rsvpSlot,
  className,
  preview = false,
}: {
  wedding: PublicInvitationWeddingDto
  content: InvitationContentDto
  rsvpSlot?: ReactNode
  className?: string
  preview?: boolean
}) {
  const visible = content.visibleSections
  const [firstName = "Nuestra", secondName = "boda"] = wedding.partnerNames
  const ceremony = wedding.ceremonyLocation
  const reception = wedding.restaurant
  const publicRegistryNote = sanitizePublicRegistryNote(content.registryNote)
  const storyFloatIndex = Math.max(1, Math.floor(content.story.length / 4))
  const storyFloatIndexMobile = Math.max(1, Math.floor(content.story.length / 2))
  const isNachoWedding = wedding.slug === NACHO_WEDDING_SLUG
  const contacts = isNachoWedding
    ? [nachoData.husband, nachoData.wife].map((person) => ({
        name: person.name,
        phone: person.phone,
        whatsappUrl: `https://wa.me/${person.phone.replace(/\D/g, "")}`,
      }))
    : []

  return (
    <EditorialMotion className={cn("min-h-svh overflow-hidden bg-[#fbf4ea] text-[#5b4d47] [font-family:var(--font-manrope),sans-serif]", className)}>
      <header className="relative grid min-h-svh place-items-center isolate text-center">
        <Image draggable="false" src={mariaDanielaAssets.watercolorFrame} alt="" fill priority={!preview} className="z-[-2] object-cover" sizes="100vw" />
        <Image draggable="false" src={mariaDanielaAssets.botanicalSprig} alt="" width={280} height={450} className="absolute right-[-4rem] bottom-[-4rem] z-[-1] w-[clamp(12rem,28vw,23rem)] h-auto" />
        <div>
          <p className="my-0 py-6 text-md md:text-xl font-extrabold tracking-[0.34em] uppercase">{content.eyebrow}</p>
          <h1 className="flex flex-col mt-[1.8rem] mb-[2.5rem] [font-family:var(--font-parisienne),cursive] text-[clamp(5.4rem,15vw,10.5rem)] font-normal leading-[0.75] max-[720px]:leading-[0.95]">
            <span>{firstName}</span>
            <i className="text-[#d5764d] text-[0.75em] font-normal leading-15 z-[-2]">&amp;</i>
            <span>{secondName}</span>
          </h1>
          <time className="block [font-family:var(--font-cormorant),serif] text-[clamp(1.25rem,3vw,1.7rem)] uppercase">{formatDate(wedding.date)}</time>
          <small className="block mt-2 text-[0.63rem] tracking-[0.2em] uppercase">{wedding.primaryCity}</small>
        </div>
        <a href="#invitacion" className="absolute bottom-8 border-b border-current text-[0.62rem] font-extrabold tracking-[0.18em] no-underline uppercase text-inherit">Abrir invitación</a>
      </header>

      <main id="invitacion">
        {visible.story && (
          <section className="text-center py-[clamp(7rem,13vw,12rem)] px-[max(6vw,1.5rem)]">
            <p className={kickerBase} data-reveal>Queremos celebrarlo contigo</p>
            <div className="relative inline-block max-w-full px-[1.6rem] py-[0.35rem]">
              <Image draggable="false" src={mariaDanielaAssets.terracottaBrush} alt="" fill sizes="(max-width: 720px) 90vw, 40rem" className="absolute inset-0 object-cover opacity-60" />
              {/* <h2 className={scriptHeading} data-script-reveal>{content.storyTitle}</h2> */}
              <h2 className={cn(scriptHeading, "relative")} data-script-reveal>{content.storyTitle}</h2>
            </div>
            <figure className="relative w-[min(720px,100%)] min-h-[28rem] mt-4 mx-auto max-[720px]:min-h-[20rem]" data-reveal>
              <Image draggable="false" src={coupleArt.coupleHorizontal2} alt="Fotografía de la pareja" fill sizes="(max-width: 720px) 84vw, 38vw" className="object-contain" />
            </figure>
            <div className="w-[min(1080px,100%)] mt-0 md:mt-16 mx-auto [font-family:var(--font-cormorant),serif] text-[clamp(1.18rem,2vw,1.45rem)] leading-[1.65] text-left" data-reveal>
              {content.story.map((paragraph, index) => (
                <Fragment key={`${index}-${paragraph.slice(0, 18)}`}>
                  {index === storyFloatIndex && (
                    <figure className="relative float-right w-[min(36rem,50%)] aspect-[3/4] rotate-[0deg] max-[720px]:hidden">
                      <Image draggable="false" src={coupleArt.coupleVertical} alt="Fotografía de la pareja" fill sizes="(max-width: 720px) 60vw, 20rem" className="object-contain" />
                    </figure>
                  )}
                  {index === storyFloatIndexMobile && (
                    <figure className="relative hidden w-full aspect-3/4 mx-auto my-6 max-[720px]:block">
                      <Image draggable="false" src={coupleArt.coupleVertical} alt="Fotografía de la pareja" fill className="object-contain" />
                    </figure>
                  )}
                  <p className={index === 0 || index === storyFloatIndex ? "my-0 mt-4" : "mt-4 mb-0"}>{paragraph}</p>
                </Fragment>
              ))}
            </div>
          </section>
        )}

        {visible.schedule && (
          <section className="relative text-center py-[clamp(3rem,12vw,10rem)] px-[max(4vw,1.25rem)]  bg-[url('/images/templates/maria-daniela/sage-watercolor-wash.webp')] bg-center inset-0 [background-position-y:-10rem] bg-size-[auto_145%] pt-12">
            <div className="relative inline-block max-w-full px-[1.6rem] py-[0.35rem]">
              {/* <Image draggable="false" src={mariaDanielaAssets.terracottaBrush} alt="" fill sizes="(max-width: 720px) 90vw, 40rem" className="absolute inset-0 object-cover opacity-60" /> */}
              <h2 className={cn(scriptHeading, "relative")} data-script-reveal>{content.scheduleTitle}</h2>
            </div>
            <div className="grid w-[min(1180px,100%)] mt-0 mx-auto gap-px grid-cols-4 max-[720px]:grid-cols-2">
              {content.schedule.map((item, index) => (
                <article key={item.id} className="py-[1.6rem] px-[0.9rem]  max-[720px]:border-b max-[720px]" data-reveal>
                  <div className="relative h-24">
                    <Image draggable="false"
                      src={scheduleArt[index % scheduleArt.length]}
                      alt=""
                      fill
                      sizes="100px"
                      className="object-contain"
                      loading={preview ? "eager" : "lazy"}
                      unoptimized
                    />
                  </div>
                  <h3 className="my-2 [font-family:var(--font-cormorant),serif] text-[1.5rem] leading-none mb-0">{item.title}</h3>
                  <time className="text-[#d5764d] text-[0.68rem] font-black tracking-[0.12em]">{item.time}</time>
                  {/* <p className={scheduleMeta}>{item.date}</p> */}
                  {item.location && <strong className={scheduleMeta}>{item.location}</strong>}
                  {item.description && <p className={scheduleMeta}>{item.description}</p>}
                  {/* {item.mapsUrl && <a href={item.mapsUrl} target="_blank" rel="noreferrer" className={linkUnderline}>Ver ubicación</a>} */}
                </article>
              ))}
            </div>
          </section>
        )}

        {visible.venue && (
          <section className="flex w-[min(1100px,100%)] mx-auto  py-12 md:py-14 px-[max(2vw,1rem)] gap-20 items-stretch text-center max-[720px]:flex-col max-[720px]:gap-12">
            <div className="flex-1" data-reveal>
              <Image draggable="false" src={mariaDanielaAssets.churchWatercolor} alt="" width={420} height={320} className="w-full  object-contain aspect-420/320 mb-4" />
              <p className={cn(kickerBase, "text-[#d5764d]")}>Ceremonia</p>
              <h2 className="my-0 mb-[1.3rem] font-normal leading-[1.1] [font-family:var(--font-cormorant),serif] text-[clamp(1.8rem,3vw,2.6rem)]">{ceremony?.name ?? content.venueTitle}</h2>
              {ceremony?.mapsUrl && (
                <a className="inline-flex flex-col items-center gap-[0.55rem]" href={ceremony.mapsUrl} target="_blank" rel="noreferrer">
                  <Image draggable="false" src={mariaDanielaAssets.locationPin} alt="" width={34} height={46} className="size-30 aspect-340/46 object-contain" />
                </a>
              )}
              <p className={cn(venueCopy, "mt-6")}>{ceremony?.address}</p>
            </div>
            <span className="w-px self-stretch bg-border max-[720px]:h-px max-[720px]:w-full max-[720px]:self-auto" aria-hidden="true"></span>
            <div className="flex-1" data-reveal>
              <Image draggable="false" src={mariaDanielaAssets.hotelWatercolor} alt="" width={420} height={320} className="w-full  object-contain aspect-420/320 mb-4" />
              <p className={cn(kickerBase, "text-[#d5764d]")}>Coctel - Banquete - Fiesta</p>
              <h2 className="my-0 mb-[1.3rem] font-normal leading-[1.1] [font-family:var(--font-cormorant),serif] text-[clamp(1.8rem,3vw,2.6rem)]">{reception?.name ?? "Después, seguimos celebrando"}</h2>
              {reception?.mapsUrl && (
                <a className="inline-flex items-center gap-[0.55rem]" href={reception.mapsUrl} target="_blank" rel="noreferrer">
                  <Image draggable="false" src={mariaDanielaAssets.locationPin} alt="" width={34} height={46} className="size-30 aspect-340/46 object-contain" />
                </a>
              )}
              <p className={cn(venueCopy, "mt-6")}>{reception?.address ?? content.venueNote}</p>
            </div>
          </section>
        )}

        {false && visible.travel && content.travel.length > 0 && (
          <section className="relative text-center py-[clamp(7rem,12vw,11rem)] px-[max(6vw,1.5rem)] bg-[#fbf4ea] text-[#5b4d47]">
            <Image draggable="false" src={mariaDanielaAssets.terracottaBrush} alt="" width={620} height={150} className="absolute top-[clamp(8rem,13vw,11rem)] left-1/2 w-[min(34rem,86vw)] h-auto opacity-70 -translate-x-1/2 rotate-[-2deg]" />
            <p className={cn(kickerBase, "relative")} data-reveal>Para que solo te preocupes de disfrutar</p>
            <h2 className={cn(scriptHeading, "relative")} data-script-reveal>{content.travelTitle}</h2>
            <div className="grid w-[min(1050px,100%)] mt-16 mx-auto gap-12 grid-cols-2 text-left max-[720px]:grid-cols-1 max-[720px]:gap-[4.5rem]">
              {content.travel.map((item, index) => (
                <article key={item.id} className="relative" data-reveal>
                  <figure className="relative min-h-[24rem] mb-6"><Image draggable="false" src={item.imageSrc || weddingPlaceholderPhotos.place} alt="" fill sizes="(max-width: 720px) 86vw, 34vw" className="object-contain" /></figure>
                  <span className="[font-family:var(--font-cormorant),serif] text-[2.2rem] opacity-55">0{index + 1}</span>
                  <h3 className="mt-1 mb-[0.8rem] [font-family:var(--font-cormorant),serif] text-[2rem]">{item.title}</h3>
                  <p className="my-0 text-[0.85rem] leading-[1.65]">{item.description}</p>
                  <nav className="flex gap-[1.2rem]">
                    {item.websiteUrl && <a href={item.websiteUrl} target="_blank" rel="noreferrer" className={linkUnderline}>Visitar web</a>}
                    {item.mapsUrl && <a href={item.mapsUrl} target="_blank" rel="noreferrer" className={linkUnderline}>Ver mapa</a>}
                  </nav>
                </article>
              ))}
            </div>
          </section>
        )}

        {visible.registry && content.registry.length > 0 && (
          <section className="relative grid min-h-[48rem] py-28 px-6 place-items-center text-center">
            <Image draggable="false" src={mariaDanielaAssets.watercolorBlobs} alt="" width={420} height={230} className="absolute top-8 right-[-3rem] w-[min(30rem,65vw)] h-auto opacity-70" />
            <Image draggable="false" src={mariaDanielaAssets.watercolorBlobsAlternative} alt="" width={420} height={230} className="absolute bottom-8 left-[-7rem] w-[min(30rem,65vw)] h-auto opacity-70" />
            <div className="relative w-[min(1050px,100%)] flex flex-col md:items-center md:flex-row md:gap-14 " data-reveal>
              {/* <p className={kickerBase}>Vuestra presencia es el mejor regalo</p> */}
              {/* <h2 className={scriptHeading} data-script-reveal>{content.registryTitle}</h2> */}
              <h2 className={cn(scriptHeading, "px-4")} data-script-reveal>Vuestra presencia es el mayor regalo</h2>
              {/* <p className="mt-8 mb-4 mx-auto [font-family:var(--font-cormorant),serif] text-[1.3rem]">{content.registryIntro}</p> */}
              <div className="mt-8 mx-auto [font-family:var(--font-cormorant),serif] text-[1.3rem] w-full">
                <p>Lo importante es que vengáis con ilusión, alegría y ganas de pasarlo bien.</p>
                <p>Pero como algunos nos habéis preguntado...</p>
                <div className="relative flex w-[min(38rem,100%)] min-h-[12rem] mt-8 mx-auto py-[2.4rem] px-[clamp(1.5rem,5vw,3rem)] items-center justify-center flex-col gap-[0.8rem] isolate">
                  <Image draggable="false"
                    src={mariaDanielaAssets.ibanPencilFrame}
                    alt=""
                    fill
                    sizes="(max-width: 720px) 88vw, 610px"
                    className="z-[-1] w-full! h-full! object-fill"
                    unoptimized
                  />
                  {content.registry.map((item) => (
                    item.url
                      ? <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className={cn(registryLink, "border-b border-current")}>{item.title}</a>
                      : <strong key={item.id} className={registryLink}>{item.title}</strong>
                  ))}
                  {publicRegistryNote && <small className="block text-[rgba(48,61,56,0.62)]">{publicRegistryNote}</small>}
                </div>
              </div>
            </div>
          </section>
        )}

        {visible.rsvp && (
          <section className="text-center py-[clamp(7rem,12vw,10rem)] px-6 bg-[#fbf4ea] bg-[url('/images/templates/maria-daniela/sage-watercolor-wash-transparent.webp')] bg-center bg-cover">
            {/* <Image draggable="false" src={mariaDanielaAssets.checklist} alt="" width={115} height={115} className="mx-auto mb-4" data-reveal />
            <p className={kickerBase}>Ahora sí</p> */}
            <h2 className={cn(scriptHeading, "lg:w-[18ch]")} data-script-reveal>{content.rsvpTitle}</h2>
            <p className="w-[min(38rem,100%)] my-8 mx-auto [font-family:var(--font-cormorant),serif] text-[1.25rem] leading-[1.55]">{content.rsvpSubtitle}</p>
            <div className="flex justify-center">{rsvpSlot ?? <a href="#rsvp" className="py-4 px-[1.6rem] rounded-full bg-[#5b4d47] text-white text-[0.68rem] font-extrabold tracking-[0.14em] no-underline uppercase">Confirmar asistencia</a>}</div>
            
          </section>
        )}

        {visible.questions && (
          <section className="text-center py-12 px-6" data-reveal>
            {/* <Image draggable="false" src={mariaDanielaAssets.cocktailsLight} alt="" width={120} height={150} className="mx-auto" /> */}
            <h2 className="mt-4 mb-6 [font-family:var(--font-parisienne),cursive] text-[clamp(3.8rem,8vw,7rem)] font-normal leading-[1.1]">{content.questionsTitle}</h2>

            <div className="flex w-[min(1100px,100%)] mx-auto gap-x-8 items-center text-center max-[720px]:flex-col max-[720px]:gap-y-10">
              <div className="relative flex-1 mx-auto max-w-[32rem]">
                <Image draggable="false" src={mariaDanielaAssets.watercolorBlobs} alt="" width={200} height={200} className="absolute -top-10 -left-12 -z-10 w-28 h-auto opacity-35 max-[720px]:hidden" />

                <p className="my-0 [font-family:var(--font-cormorant),serif] text-[1.2rem] leading-[1.55]">Si necesitas cualquier cosa, escríbenos directamente por WhatsApp. Estaremos encantados de ayudarte.</p>

                {contacts.length > 0 && (
                  <div className="mt-6 flex justify-center gap-10">
                    {contacts.map((contact) => (
                      <a
                        key={contact.phone}
                        href={contact.whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex flex-col items-center gap-2 text-inherit no-underline"
                      >
                        <Image draggable="false" src={mariaDanielaAssets.whatsappWatercolor} alt="" width={96} height={96} className="w-20 h-20 object-contain" />
                        <span className="text-[0.68rem] font-extrabold tracking-[0.14em] uppercase">{contact.name}</span>
                      </a>
                    ))}
                  </div>
                )}

                <figure className="relative m-0 mt-10 min-h-[min(80vw,26rem)] w-full hidden max-[720px]:block">
                  <Image draggable="false" src={coupleArt.coupleHorizontal1} alt="Pareja bailando" fill sizes="90vw" className="object-contain" />
                </figure>

                {isNachoWedding && (
                  <div className="relative mt-10">
                    <Image draggable="false" src={mariaDanielaAssets.watercolorBlobsAlternative} alt="" width={200} height={200} className="absolute -right-10 -bottom-6 -z-10 w-24 h-auto opacity-35 max-[720px]:hidden" />

                    <p className="my-0 text-[1.05rem] font-extrabold tracking-[0.02em] text-[#d5764d]">¿Necesitas alojamiento?</p>
                    <p className="mt-3 mb-0 [font-family:var(--font-cormorant),serif] text-[1.15rem] leading-[1.6] text-[rgba(48,61,56,0.75)]">
                      Si vais a necesitar alojamiento, tenemos un código especial para reservar directamente en la web del hotel con un descuento adicional sobre la tarifa publicada. Es válido para todas las habitaciones, en régimen de Alojamiento + Desayuno.
                    </p>
                    <p className="mt-4 mb-0 [font-family:var(--font-cormorant),serif] text-[1.25rem] tracking-[0.04em]">
                      Código: <strong className="text-[#d5764d]">{ACCOMMODATION_CODE}</strong>
                    </p>
                  </div>
                )}
              </div>

              <figure className="relative flex-1 w-full min-h-[min(80vw,38rem)] m-0 max-[720px]:hidden">
                <Image draggable="false" src={coupleArt.coupleHorizontal1} alt="Pareja bailando" fill sizes="(max-width: 720px) 90vw, 40vw" className="object-contain" />
              </figure>
            </div>
          </section>
        )}
      </main>

      <div aria-hidden="true" className="h-20 bg-gradient-to-b from-[#fbf4ea] to-[#fff9f2] max-[720px]:h-12" />

      <MariaDanielaCountdown weddingDate={wedding.date} />

      <footer className="grid text-[#5b4d47] text-center max-[720px]:min-h-[58svh]">
        <div className="relative grid min-h-[32rem] py-12 px-4 place-items-center content-center isolate bg-[#fff9f2]">
          <Image draggable="false" src={mariaDanielaAssets.watercolorFrame} alt="" fill sizes="100vw" className="z-[-1] object-cover rotate-180" />
          <p className="my-0 text-[0.65rem] font-extrabold tracking-[0.22em] uppercase">Nos vemos muy pronto</p>
          <h2 className="mt-4 mb-0 [font-family:var(--font-parisienne),cursive] text-[clamp(4.5rem,12vw,9rem)] font-normal leading-[1.1]">{firstName} <i className="text-[#d5764d] font-normal">&amp;</i> {secondName}</h2>
          
        </div>
      </footer>
    </EditorialMotion>
  )
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
}

function sanitizePublicRegistryNote(value: string) {
  return value
    .replace(/(?:\s*·\s*)?BIC\s+\S+/gi, "")
    .replace(/\s*·\s*·\s*/g, " · ")
    .trim()
}
