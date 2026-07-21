import Image from "next/image"
import { Fragment, type ReactNode } from "react"

import {
  mariaDanielaAssets,
  weddingPlaceholderPhotos,
} from "@/domains/wedding-sites/adapters/next/components/maria-daniela-assets"
import type { InvitationContentDto } from "@/domains/invitations/application/dtos/invitation-design.dto"
import { getInvitationPhotoAsset } from "@/domains/invitations/domain/invitation-template-options"
import type { WeddingDto } from "@/domains/weddings/application/dtos/wedding.dto"
import { EditorialMotion } from "@/shared/components/editorial-motion"
import { cn } from "@/shared/lib/utils"

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
const scriptHeading = "my-0 [font-family:var(--font-allura),cursive] text-[clamp(3.8rem,8vw,7rem)] font-normal leading-[0.85]"
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
  wedding: WeddingDto
  content: InvitationContentDto
  rsvpSlot?: ReactNode
  className?: string
  preview?: boolean
}) {
  const visible = content.visibleSections
  const [firstName = "Nuestra", secondName = "boda"] = wedding.partnerNames
  const selectedPhoto = getInvitationPhotoAsset(content.photoAssetId)
  const ceremony = wedding.ceremonyLocation
  const reception = wedding.restaurant
  const publicRegistryNote = sanitizePublicRegistryNote(content.registryNote)
  const storyFloatIndex = Math.max(1, Math.floor(content.story.length / 4))

  return (
    <EditorialMotion className={cn("min-h-svh overflow-hidden bg-[#fbf4ea] text-[#5b4d47] [font-family:var(--font-manrope),sans-serif]", className)}>
      <header className="relative grid min-h-svh place-items-center isolate text-center">
        <Image draggable="false" src={mariaDanielaAssets.watercolorFrame} alt="" fill priority={!preview} className="z-[-2] object-cover" sizes="100vw" />
        <Image draggable="false" src={mariaDanielaAssets.botanicalSprig} alt="" width={280} height={450} className="absolute right-[-4rem] bottom-[-4rem] z-[-1] w-[clamp(12rem,28vw,23rem)] h-auto" />
        <div>
          <p className="my-0 text-[0.68rem] font-extrabold tracking-[0.34em] uppercase">{content.eyebrow}</p>
          <h1 className="flex flex-col mt-[1.8rem] mb-[2.5rem] [font-family:var(--font-allura),cursive] text-[clamp(5.4rem,15vw,10.5rem)] font-normal leading-[0.56] max-[720px]:leading-[0.7]">
            <span>{firstName}</span><i className="text-[#d5764d] text-[0.6em] font-normal">&amp;</i><span>{secondName}</span>
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
            <h2 className={scriptHeading} data-script-reveal>{content.storyTitle}</h2>
            <figure className="relative w-[min(720px,100%)] min-h-[28rem] mt-4 mx-auto max-[720px]:min-h-[20rem]" data-reveal>
              <Image draggable="false" src={coupleArt.coupleHorizontal2} alt="Fotografía de la pareja" fill sizes="(max-width: 720px) 84vw, 38vw" className="object-contain" />
            </figure>
            <div className="w-[min(1080px,100%)] mt-16 mx-auto [font-family:var(--font-cormorant),serif] text-[clamp(1.18rem,2vw,1.45rem)] leading-[1.65] text-left" data-reveal>
              {content.story.map((paragraph, index) => (
                <Fragment key={`${index}-${paragraph.slice(0, 18)}`}>
                  {index === storyFloatIndex && (
                    <figure className="relative float-right w-[min(36rem,50%)] aspect-[3/4]  rotate-[0deg] max-[720px]:float-none max-[720px]:w-[min(20rem,70%)] max-[720px]:my-6 max-[720px]:mx-auto">
                      <Image draggable="false" src={coupleArt.coupleVertical} alt="Fotografía de la pareja" fill sizes="(max-width: 720px) 60vw, 20rem" className="object-contain" />
                    </figure>
                  )}
                  <p className={index === 0 || index === storyFloatIndex ? "my-0" : "mt-4 mb-0"}>{paragraph}</p>
                </Fragment>
              ))}
            </div>
          </section>
        )}

        {visible.schedule && (
          <section className="relative text-center py-[clamp(7rem,12vw,11rem)] px-[max(4vw,1.25rem)] bg-[#fbf4ea] bg-[url('/images/templates/maria-daniela/sage-watercolor-wash.webp')] bg-center bg-cover ">
            <Image draggable="false" src={mariaDanielaAssets.terracottaBrush} alt="" width={500} height={130} className="absolute top-28 left-1/2 w-[min(30rem,80vw)] h-20 -translate-x-1/2 opacity-60" />
            <p className={cn(kickerBase, "relative")} data-reveal>Guarda la fecha</p>
            <h2 className={cn(scriptHeading, "relative")} data-script-reveal>{content.scheduleTitle}</h2>
            <div className="grid w-[min(1180px,100%)] mt-20 mx-auto gap-px grid-cols-3 max-[720px]:grid-cols-1">
              {content.schedule.map((item, index) => (
                <article key={item.id} className="py-[2.2rem] px-[1.7rem]  max-[720px]:border-b max-[720px]" data-reveal>
                  <div className="relative h-32">
                    <Image draggable="false"
                      src={scheduleArt[index % scheduleArt.length]}
                      alt=""
                      fill
                      sizes="130px"
                      className="object-contain"
                      loading={preview ? "eager" : "lazy"}
                      unoptimized
                    />
                  </div>
                  <time className="text-[#d5764d] text-[0.72rem] font-black tracking-[0.12em]">{item.time}</time>
                  <h3 className="my-2 [font-family:var(--font-cormorant),serif] text-[1.8rem]">{item.title}</h3>
                  <p className={scheduleMeta}>{item.date}</p>
                  {item.location && <strong className={scheduleMeta}>{item.location}</strong>}
                  {item.description && <p className={scheduleMeta}>{item.description}</p>}
                  {item.mapsUrl && <a href={item.mapsUrl} target="_blank" rel="noreferrer" className={linkUnderline}>Ver ubicación</a>}
                </article>
              ))}
            </div>
          </section>
        )}

        {visible.venue && (
          <section className="grid w-[min(1100px,100%)] mx-auto py-[clamp(7rem,12vw,11rem)] px-[max(5vw,1.5rem)] gap-20 grid-cols-2 text-center max-[720px]:grid-cols-1 max-[720px]:gap-12">
            <div data-reveal>
              <Image draggable="false" src={mariaDanielaAssets.churchWatercolor} alt="" width={420} height={320} className="w-full h-[19rem] object-contain" />
              <p className={kickerBase}>Ceremonia</p>
              <h2 className="my-0 mb-[1.3rem] font-normal leading-[0.85] [font-family:var(--font-cormorant),serif] text-[clamp(1.8rem,3vw,2.6rem)]">{ceremony?.name ?? content.venueTitle}</h2>
              <p className={venueCopy}>{ceremony?.address}</p>
              {ceremony?.mapsUrl && (
                <a className="inline-flex items-center gap-[0.55rem]" href={ceremony.mapsUrl} target="_blank" rel="noreferrer">
                  <Image draggable="false" src={mariaDanielaAssets.locationPin} alt="" width={34} height={46} className="w-[1.7rem] h-[2.15rem] object-contain" />
                  <span>Cómo llegar</span>
                </a>
              )}
            </div>
            <div data-reveal>
              <Image draggable="false" src={mariaDanielaAssets.hotelWatercolor} alt="" width={420} height={320} className="w-full h-[19rem] object-contain" />
              <p className={kickerBase}>Celebración</p>
              <h2 className="my-0 mb-[1.3rem] font-normal leading-[0.85] [font-family:var(--font-cormorant),serif] text-[clamp(1.8rem,3vw,2.6rem)]">{reception?.name ?? "Después, seguimos celebrando"}</h2>
              <p className={venueCopy}>{reception?.address ?? content.venueNote}</p>
              {reception?.mapsUrl && (
                <a className="inline-flex items-center gap-[0.55rem]" href={reception.mapsUrl} target="_blank" rel="noreferrer">
                  <Image draggable="false" src={mariaDanielaAssets.locationPin} alt="" width={34} height={46} className="w-[1.7rem] h-[2.15rem] object-contain" />
                  <span>Cómo llegar</span>
                </a>
              )}
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
            <div className="relative w-[min(720px,100%)]" data-reveal>
              <p className={kickerBase}>Vuestra presencia es el mejor regalo</p>
              <h2 className={scriptHeading} data-script-reveal>{content.registryTitle}</h2>
              <p className="mt-8 mb-4 mx-auto [font-family:var(--font-cormorant),serif] text-[1.3rem]">{content.registryIntro}</p>
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
          </section>
        )}

        {visible.rsvp && (
          <section className="text-center py-[clamp(7rem,12vw,10rem)] px-6 bg-[#fbf4ea] bg-[url('/images/templates/maria-daniela/sage-watercolor-wash.webp')] bg-center bg-cover">
            <Image draggable="false" src={mariaDanielaAssets.checklist} alt="" width={115} height={115} className="mx-auto mb-4" data-reveal />
            <p className={kickerBase}>Ahora sí</p>
            <h2 className={scriptHeading} data-script-reveal>{content.rsvpTitle}</h2>
            <p className="w-[min(38rem,100%)] my-8 mx-auto [font-family:var(--font-cormorant),serif] text-[1.25rem] leading-[1.55]">{content.rsvpSubtitle}</p>
            <div className="flex justify-center">{rsvpSlot ?? <a href="#rsvp" className="py-4 px-[1.6rem] rounded-full bg-[#5b4d47] text-white text-[0.68rem] font-extrabold tracking-[0.14em] no-underline uppercase">Confirmar asistencia</a>}</div>
            
          </section>
        )}

        {visible.questions && (
          <section className="text-center py-24 px-6" data-reveal>
            {/* <Image draggable="false" src={mariaDanielaAssets.cocktailsLight} alt="" width={120} height={150} className="mx-auto" /> */}
            <h2 className="mt-4 mb-6 [font-family:var(--font-allura),cursive] text-[clamp(3.8rem,8vw,7rem)] font-normal leading-[0.85]">{content.questionsTitle}</h2>
            <p className="w-[min(35rem,100%)] mx-auto my-0 [font-family:var(--font-cormorant),serif] text-[1.2rem] leading-[1.55]">Si necesitas cualquier cosa, escríbenos directamente por WhatsApp. Estaremos encantados de ayudarte.</p>
            <figure className="relative min-h-[min(72vw,46rem)] m-0">
              <Image draggable="false" src={coupleArt.coupleHorizontal2} alt="Pareja bailando" fill sizes="100vw" className="object-contain" />
            </figure>
          </section>
        )}
      </main>

      <footer className="grid text-[#5b4d47] text-center max-[720px]:min-h-[58svh]">
        <div className="relative grid min-h-[32rem] py-12 px-4 place-items-center content-center isolate bg-[#fff9f2]">
          <Image draggable="false" src={mariaDanielaAssets.watercolorFrame} alt="" fill sizes="100vw" className="z-[-1] object-cover rotate-180" />
          <p className="my-0 text-[0.65rem] font-extrabold tracking-[0.22em] uppercase">Nos vemos muy pronto</p>
          <h2 className="mt-4 mb-0 [font-family:var(--font-allura),cursive] text-[clamp(4.5rem,12vw,9rem)] font-normal leading-[0.85]">{firstName} <i className="text-[#d5764d] font-normal">&amp;</i> {secondName}</h2>
          
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
