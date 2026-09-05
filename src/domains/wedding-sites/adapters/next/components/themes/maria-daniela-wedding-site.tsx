import Image from "next/image"
import { Fragment, useEffect, useRef } from "react"
import { flushSync } from "react-dom"

import { CopyIbanButton } from "@/domains/wedding-sites/adapters/next/components/copy-iban-button"
import { MariaDanielaCountdown } from "@/domains/invitations/adapters/next/components/maria-daniela-countdown"
import { mariaDanielaAssets } from "@/domains/wedding-sites/adapters/next/components/maria-daniela-assets"
import type { WeddingSiteThemeProps } from "@/domains/wedding-sites/adapters/next/components/themes/wedding-site-theme-props"
import {
  SAMPLE_GALLERY_PHOTOS,
  SAMPLE_GUESTBOOK_SIGNATURES,
  spotifyEmbedUrl,
  type WeddingExperienceContent,
} from "@/domains/wedding-sites/application/dtos/wedding-experience.dto"
import { EditorialMotion } from "@/shared/components/editorial-motion"
import { cn } from "@/shared/lib/utils"

import styles from "../wedding-experience.module.css"

/**
 * Las ilustraciones "warm" son las de trazo cálido: son las únicas que se leen
 * sobre el papel crema del template.
 */
const timelineImages = {
  church: mariaDanielaAssets.churchLineDark,
  cocktails: mariaDanielaAssets.cocktailsDark,
  dinner: mariaDanielaAssets.dinnerTableDark,
  party: mariaDanielaAssets.discoBallDark,
} as const

// Clases compartidas con la invitación, para que las secciones que se reutilizan
// se compongan exactamente igual.
const kickerBase = "my-0 mb-4! text-[0.65rem] font-extrabold tracking-[0.24em] uppercase"
const scriptHeading =
  "my-0 [font-family:var(--font-parisienne),cursive] text-[length:var(--script-title-size)] font-normal leading-[1.15] pb-[0.14em]"
const scheduleMeta =
  "block my-[0.35rem] text-[rgba(91,77,71,0.72)] text-[0.76rem] leading-[1.5]"
const venueCopy = "my-0 text-[rgba(48,61,56,0.68)] text-[0.85rem] leading-[1.6]"
const registryLink =
  "block w-fit mx-auto text-inherit [font-family:var(--font-cormorant),serif] text-[clamp(1rem,3vw,1.35rem)] tracking-[0.08em] no-underline"

/** Píxeles de aproximación al borde en los que la sombra pasa de 0 a 1. */
const RAMP = 220

export function MariaDanielaWeddingSite({
  content,
  pages,
  currentPage,
  onNavigate,
  preview = false,
}: WeddingSiteThemeProps) {
  const [firstName, secondName] = content.partnerNames
  const siteRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const activeLinkRef = useRef<HTMLButtonElement>(null)
  const transitionIdRef = useRef(0)

  // En móvil los enlaces viven en un carril desplazable: la sección activa se
  // centra sola para que nunca quede fuera de pantalla.
  useEffect(() => {
    activeLinkRef.current?.scrollIntoView({ inline: "center", block: "nearest" })
  }, [currentPage])

  // La sombra de la barra crece a medida que sube hacia el borde superior, en
  // vez de encenderse de golpe al quedarse pegada.
  useEffect(() => {
    const site = siteRef.current
    const nav = navRef.current

    if (!site || !nav) {
      return
    }

    let frame = 0

    function update() {
      frame = 0

      // Sin portada la barra ya nace pegada al borde: sombra completa desde el
      // principio. Sobre la portada crece según la barra sube hacia el borde.
      if (currentPage !== "inicio") {
        site!.style.setProperty("--nav-shadow", "1")
        return
      }

      const distance = nav!.getBoundingClientRect().top

      site!.style.setProperty(
        "--nav-shadow",
        Math.min(1, Math.max(0, (RAMP - distance) / RAMP)).toFixed(3),
      )
    }

    function schedule() {
      frame ||= window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
    }
  }, [currentPage])

  function navigateWithTransition(nextPage: Parameters<typeof onNavigate>[0]) {
    if (nextPage === currentPage) {
      onNavigate(nextPage)
      return
    }

    if (typeof document.startViewTransition !== "function") {
      onNavigate(nextPage)
      return
    }

    const root = document.documentElement
    const transitionId = ++transitionIdRef.current
    const transitionKind =
      currentPage === "inicio"
        ? "home-to-page"
        : nextPage === "inicio"
          ? "page-to-home"
          : "page-to-page"

    root.dataset.mariaDanielaTransition = transitionKind

    const transition = document.startViewTransition(() => {
      // La API toma la captura nueva al terminar este callback. Forzamos el
      // commit para que incluya a la vez el cambio de página y el scroll a 0.
      flushSync(() => onNavigate(nextPage))
    })

    const cleanUpTransitionMarker = () => {
      if (transitionIdRef.current === transitionId) {
        delete root.dataset.mariaDanielaTransition
      }
    }

    void transition.finished.then(cleanUpTransitionMarker, cleanUpTransitionMarker)
  }
console.log(content)
  return (
    <div className={styles.site} ref={siteRef}>
      {/* Remontar por página reinicia las animaciones de scroll de cada sección. */}
      <EditorialMotion key={currentPage}>
        {currentPage === "inicio" && <Hero content={content} preview={preview} />}

        {/* La navegación vive debajo de la portada y se queda pegada arriba al
            subir: en el resto de subpáginas, sin portada, ya nace en el borde. */}
        <header className={styles.nav} ref={navRef}>
          <div className={styles.navInner}>
            <button
              type="button"
              className={styles.navBrand}
              onClick={() => navigateWithTransition("inicio")}
            >
              {firstName} <i aria-hidden="true">&amp;</i> {secondName}
            </button>
            <nav className={styles.navLinks} aria-label="Secciones de la web">
              {pages.map((page) => {
                const isActive = page.id === currentPage

                return (
                  <button
                    key={page.id}
                    type="button"
                    ref={isActive ? activeLinkRef : undefined}
                    onClick={() => navigateWithTransition(page.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={isActive ? styles.navLinkActive : undefined}
                  >
                    {page.label}
                  </button>
                )
              })}
            </nav>
          </div>
        </header>

        <main>
          {currentPage === "inicio" && <HomePage content={content} preview={preview} />}
          {currentPage === "historia" && <StoryPage content={content} preview={preview} />}
          {currentPage === "menu" && <MenuPage content={content} />}
          {currentPage === "musica" && <MusicPage content={content} />}
          {currentPage === "galeria" && <GalleryPage content={content} preview={preview} />}
          {currentPage === "firmas" && <GuestbookPage content={content} preview={preview} />}
        </main>

        <footer className={styles.footer}>
          <p className={styles.footerLine}>Gracias por acompañarnos en este día</p>
          <p className={styles.footerMeta}>
            <time dateTime={content.dateIso}>{content.dateLabel}</time>
            <span aria-hidden="true">·</span>
            <span>{content.city}</span>
          </p>
        </footer>
      </EditorialMotion>
    </div>
  )
}

function Hero({
  content,
  preview,
}: {
  content: WeddingExperienceContent
  preview: boolean
}) {
  const [firstName, secondName] = content.partnerNames

  return (
    <header className="relative isolate grid min-h-[calc(100svh-var(--nav-h))] place-items-center overflow-hidden text-center">
      <Image
        draggable="false"
        src={mariaDanielaAssets.watercolorFrame}
        alt=""
        fill
        priority={!preview}
        sizes="100vw"
        className="z-[-2] object-cover"
      />
      <Image
        draggable="false"
        src={mariaDanielaAssets.botanicalSprig}
        alt=""
        width={280}
        height={450}
        sizes="(max-width: 720px) 48vw, 23rem"
        className="absolute right-[-2rem] bottom-4 z-[-1] h-auto w-[clamp(10rem,24vw,21rem)]"
      />
      <div>
        <p className="my-0 py-6 text-md font-extrabold tracking-[0.34em] uppercase md:text-xl">
          ¡¡ Nos casamos !!
        </p>
        <h1 className="mt-[1.8rem] mb-[2.5rem] flex flex-col [font-family:var(--font-parisienne),cursive] text-[clamp(5.4rem,15vw,10.5rem)] leading-[0.75] font-normal max-[720px]:leading-[0.95]">
          <span>{firstName}</span>
          <i
            aria-hidden="true"
            className="z-[-2] text-[0.75em] leading-15 font-normal text-[#d5764d]"
          >
            &amp;
          </i>
          <span>{secondName}</span>
        </h1>
        <time
          dateTime={content.dateIso}
          className="block [font-family:var(--font-cormorant),serif] text-[clamp(1.25rem,3vw,1.7rem)] uppercase"
        >
          {content.dateLabel}
        </time>
        <small className="mt-2 block text-[0.63rem] tracking-[0.2em] uppercase">
          {content.city}
        </small>
      </div>
    </header>
  )
}

function ScriptHeading({
  children,
  brush,
}: {
  children: string
  brush?: "terracotta" | "sage"
}) {
  return (
    <div className={styles.scriptHead}>
      {brush && (
        <Image
          draggable="false"
          src={mariaDanielaAssets.terracottaBrush}
          alt=""
          fill
          sizes="(max-width: 760px) 92vw, 46rem"
          className={cn(
            styles.scriptBrush,
            brush === "sage" && styles.scriptBrushSage,
          )}
        />
      )}
      <h2 data-script-reveal>{children}</h2>
    </div>
  )
}

function StoryPage({ content, preview }: { content: WeddingExperienceContent; preview: boolean }) {
  const floatIndex = Math.max(1, Math.floor(content.story.length / 4))
  const floatIndexMobile = Math.max(1, Math.floor(content.story.length / 2))

  return (
    <section className="px-[max(6vw,1.5rem)] py-[clamp(7rem,13vw,12rem)] text-center">
      <p className={kickerBase} data-reveal>
        Queremos celebrarlo contigo
      </p>
      <ScriptHeading brush="terracotta">Nuestra historia</ScriptHeading>
      <figure
        className="relative mx-auto mt-4 min-h-[28rem] w-[min(720px,100%)] max-[720px]:min-h-[20rem]"
        data-reveal
      >
        <Image
          draggable="false"
          src={mariaDanielaAssets.coupleHorizontal2}
          alt="Fotografía de la pareja"
          fill
          priority={!preview}
          sizes="(max-width: 720px) 84vw, 38vw"
          className="object-contain"
        />
      </figure>

      <div
        className="mx-auto mt-0 w-[min(1080px,100%)] text-left [font-family:var(--font-cormorant),serif] text-[clamp(1.18rem,2vw,1.45rem)] leading-[1.65] md:mt-16"
        data-reveal
      >
        {content.story.map((paragraph, index) => (
          <Fragment key={`${index}-${paragraph.slice(0, 18)}`}>
            {index === floatIndex && (
              <figure className="relative float-right aspect-[3/4] w-[min(36rem,50%)] rotate-0 max-[720px]:hidden">
                <Image
                  draggable="false"
                  src={mariaDanielaAssets.coupleVertical}
                  alt="Fotografía de la pareja"
                  fill
                  sizes="(max-width: 720px) 60vw, 20rem"
                  className="object-contain"
                />
              </figure>
            )}
            {index === floatIndexMobile && (
              <figure className="relative mx-auto my-6 hidden aspect-3/4 w-full max-[720px]:block">
                <Image
                  draggable="false"
                  src={mariaDanielaAssets.coupleVertical}
                  alt="Fotografía de la pareja"
                  fill
                  sizes="90vw"
                  className="object-contain"
                />
              </figure>
            )}
            <p className={index === 0 || index === floatIndex ? "my-0 mt-4" : "mt-4 mb-0"}>
              {paragraph}
            </p>
          </Fragment>
        ))}
      </div>
    </section>
  )
}

function HomePage({ content, preview }: { content: WeddingExperienceContent; preview: boolean }) {
  const hasLocation = content.enabledModules.includes("location")
  const hasTimeline = content.enabledModules.includes("timeline")
  const hasGifts = content.enabledModules.includes("gifts")

  return (
    <>
      {hasTimeline && <TimelineSection content={content} preview={preview} />}

      {hasLocation && <VenueSection content={content} />}

      <div className="my-32 " >
      <MariaDanielaCountdown weddingDate={content.dateIso}  />
      </div>

      {hasGifts && <GiftsSection content={content} />}

      <PracticalInfoSection content={content} />

      {/* <div
        aria-hidden="true"
        className="h-20 bg-gradient-to-b from-[#fbf4ea] to-[#fff9f2] max-[720px]:h-12"
      /> */}

    </>
  )
}

function VenueSection({ content }: { content: WeddingExperienceContent }) {
  return (
    <section className="mx-auto flex w-[min(1100px,100%)] items-stretch gap-20 px-[max(2vw,1rem)] py-18 text-center md:py-32 max-[720px]:flex-col max-[720px]:gap-12">
      <div className="flex-1" data-reveal>
        <Image
          draggable="false"
          src={mariaDanielaAssets.churchWatercolor}
          alt=""
          width={420}
          height={320}
          sizes="(max-width: 720px) 92vw, 34rem"
          className="mb-4 aspect-420/320 w-full object-contain"
        />
        <p className={cn(kickerBase, "text-[#d5764d]")}>Ceremonia</p>
        <h2 className="my-0 mb-[1.3rem] [font-family:var(--font-cormorant),serif] text-[clamp(1.8rem,3vw,2.6rem)] leading-[1.1] font-normal">
          {content.ceremony.name}
        </h2>
        <a
          className="inline-flex flex-col items-center gap-[0.55rem]"
          href={content.ceremony.mapsUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`Ver ${content.ceremony.name} en el mapa`}
        >
          <Image
            draggable="false"
            src={mariaDanielaAssets.locationPin}
            alt=""
            width={34}
            height={46}
            className="size-30 aspect-340/46 object-contain"
          />
        </a>
        <p className={cn(venueCopy, "mt-6")}>{content.ceremony.address}</p>
      </div>

      <span
        className="w-px self-stretch bg-border max-[720px]:h-px max-[720px]:w-full max-[720px]:self-auto"
        aria-hidden="true"
      />

      <div className="flex-1" data-reveal>
        <Image
          draggable="false"
          src={mariaDanielaAssets.hotelWatercolor}
          alt=""
          width={420}
          height={320}
          sizes="(max-width: 720px) 92vw, 34rem"
          className="mb-4 aspect-420/320 w-full object-contain"
        />
        <p className={cn(kickerBase, "text-[#d5764d]")}>Coctel - Banquete - Fiesta</p>
        <h2 className="my-0 mb-[1.3rem] [font-family:var(--font-cormorant),serif] text-[clamp(1.8rem,3vw,2.6rem)] leading-[1.1] font-normal">
          {content.reception.name}
        </h2>
        <a
          className="inline-flex items-center gap-[0.55rem]"
          href={content.reception.mapsUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`Ver ${content.reception.name} en el mapa`}
        >
          <Image
            draggable="false"
            src={mariaDanielaAssets.locationPin}
            alt=""
            width={34}
            height={46}
            className="size-30 aspect-340/46 object-contain"
          />
        </a>
        <p className={cn(venueCopy, "mt-6")}>{content.reception.address}</p>
      </div>
    </section>
  )
}

function PracticalInfoSection({ content }: { content: WeddingExperienceContent }) {
  return (
    
      <section className={styles.info}>
        <div className={styles.infoGrid}>
          <article data-reveal>
            <h3>Confirma tu asistencia</h3>
            <p>
              El formulario de asistencia, el menú y los acompañantes están en el enlace privado de
              tu invitación.
            </p>
            <p className={styles.infoHighlight}>Antes del {content.rsvpDeadline}</p>
          </article>

          {content.accommodation && (
            <article data-reveal>
              <h3>¿Necesitas alojamiento?</h3>
              <p>{content.accommodation.note}</p>
              <p className={styles.infoHighlight}>
                Código <strong>{content.accommodation.code}</strong>
              </p>
            </article>
          )}
        </div>

        {content.contacts.length > 0 && (
          <div className={styles.contacts} data-reveal>
            <p>Si necesitas cualquier cosa, escríbenos directamente por WhatsApp.</p>
            <div>
              {content.contacts.map((contact) => (
                <a href={contact.whatsappUrl} target="_blank" rel="noreferrer" key={contact.phone}>
                  <Image
                    draggable="false"
                    src={mariaDanielaAssets.whatsappWatercolor}
                    alt=""
                    width={1254}
                    height={1254}
                  />
                  <span>{contact.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </section>
  )
}

function MenuPage({ content }: { content: WeddingExperienceContent }) {
  return (
    <section className={styles.menuPage}>
      <ScriptHeading brush="sage">El menú</ScriptHeading>
      <article className={styles.menuCard} data-reveal>
        <Image
          draggable="false"
          src={mariaDanielaAssets.dinnerTableDark}
          alt=""
          width={800}
          height={653}
          sizes="9rem"
          className={styles.menuCrest}
        />
        {content.menu.map((course) => (
          <div className={styles.menuCourse} key={course.id}>
            <h3>{course.course}</h3>
            <ul>
              {course.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </article>
      <p className={styles.menuNote}>
        Menú provisional: lo cerraremos con el hotel unas semanas antes de la boda. Las alergias e
        intolerancias se recogen de forma privada en cada invitación.
      </p>
    </section>
  )
}

function TimelineSection({ content, preview }: { content: WeddingExperienceContent; preview: boolean }) {
  return (
    <section className="relative inset-0 mt-[clamp(2rem,5vw,4rem)] bg-[url('/images/templates/maria-daniela/sage-watercolor-wash.webp')] bg-center bg-size-[auto_135%] px-[max(4vw,1.25rem)] pt-[clamp(6.5rem,9vw,8.5rem)] pb-[clamp(6rem,10vw,9rem)] text-center [background-position-y:-4rem]">
      <div className="relative inline-block max-w-full px-[1.6rem] py-[0.35rem]">
        <h2 className={cn(scriptHeading, "relative")} data-script-reveal>
          Itinerario
        </h2>
      </div>
      <ol className="mx-auto mt-8 grid w-[min(1180px,100%)] grid-cols-4 items-start justify-items-center gap-x-[clamp(1rem,3vw,3rem)] max-[720px]:grid-cols-2 max-[720px]:gap-x-2">
        {content.timeline.map((item) => (
          <li
            className="mx-auto grid w-full max-w-[17rem] justify-items-center px-[0.9rem] py-[1.6rem] text-center max-[720px]:border-b"
            key={item.id}
            data-reveal
          >
            <div className="relative h-24 w-full max-w-36">
              <Image
                draggable="false"
                src={timelineImages[item.illustration]}
                alt=""
                fill
                sizes="100px"
                className="object-contain"
                loading={preview ? "eager" : "lazy"}
                unoptimized
              />
            </div>
            <h3 className="my-2 mb-0 [font-family:var(--font-cormorant),serif] text-[1.5rem] leading-none">
              {item.title}
            </h3>
            <time className="text-[0.68rem] font-black tracking-[0.12em] text-[#d5764d]">
              {item.time}
            </time>
            {item.description && (
              <p className={cn(scheduleMeta, "max-w-60")}>{item.description}</p>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}

/** Misma composición que la sección de regalos de la invitación. */
function GiftsSection({ content }: { content: WeddingExperienceContent }) {
  return (
    <section className="relative grid min-h-[48rem] place-items-center overflow-hidden px-6 py-28 text-center">
      <Image
        draggable="false"
        src={mariaDanielaAssets.watercolorBlobs}
        alt=""
        width={420}
        height={230}
        className="absolute top-8 right-[-3rem] h-auto w-[min(30rem,65vw)] opacity-70"
      />
      <Image
        draggable="false"
        src={mariaDanielaAssets.watercolorBlobsAlternative}
        alt=""
        width={420}
        height={230}
        className="absolute bottom-8 left-[-7rem] h-auto w-[min(30rem,65vw)] opacity-70"
      />
      <div
        className="relative flex w-[min(1050px,100%)] flex-col md:flex-row md:items-center md:gap-14"
        data-reveal
      >
        <h2 className={cn(scriptHeading, "px-4")} data-script-reveal>
          Vuestra presencia es el mayor regalo
        </h2>
        <div className="mt-8 w-full mx-auto [font-family:var(--font-cormorant),serif] text-[1.3rem]">
          <p>Lo importante es que vengáis con ilusión, alegría y ganas de pasarlo bien.</p>
          <p>Pero como algunos nos habéis preguntado…</p>
          {content.gifts && (
            <div className="relative isolate mt-8 mx-auto flex w-[min(38rem,100%)] min-h-[12rem] flex-col items-center justify-center gap-[0.8rem] py-[2.4rem] px-[clamp(1.5rem,5vw,3rem)]">
              <Image
                draggable="false"
                src={mariaDanielaAssets.ibanPencilFrame}
                alt=""
                fill
                sizes="(max-width: 720px) 88vw, 610px"
                className="z-[-1] w-full! h-full! object-fill"
                unoptimized
              />
              <strong className={registryLink}>{content.gifts.iban}</strong>
              <small className="block text-[rgba(48,61,56,0.62)]">
                Titular: {content.gifts.accountHolder}
              </small>
              <CopyIbanButton
                iban={content.gifts.iban}
                className="mt-1 cursor-pointer border-b border-current pb-[2px] text-[0.62rem] font-extrabold tracking-[0.18em] uppercase [font-family:var(--font-manrope),sans-serif] transition-colors hover:text-[#a04e28]"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function MusicPage({ content }: { content: WeddingExperienceContent }) {
  const embedUrl = content.spotifyPlaylistUrl ? spotifyEmbedUrl(content.spotifyPlaylistUrl) : null
  const [firstContact] = content.contacts

  return (
    <section className={styles.music}>
      <Image
        draggable="false"
        src={mariaDanielaAssets.discoBallDark}
        alt=""
        width={629}
        height={800}
        sizes="11rem"
        className={styles.musicArt}
        data-reveal
      />
      <ScriptHeading brush="terracotta">Que empiece la fiesta</ScriptHeading>
      <p className={styles.musicIntro} data-reveal>
        Ven con ganas de bailar. Nosotros ponemos la música; vosotros, los mejores pasos.
      </p>

      {embedUrl ? (
        <div className={styles.spotify} data-reveal>
          <iframe
            src={embedUrl}
            title="Playlist de la boda en Spotify"
            loading="lazy"
            allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          />
        </div>
      ) : (
        <div className={styles.playlistCard} data-reveal>
          <p className={styles.playlistLabel}>Lista en construcción</p>
          <ul className={styles.playlist}>
            {content.playlist.map((track) => (
              <li key={track.id}>
                <strong>{track.title}</strong>
                <span>{track.artist}</span>
              </li>
            ))}
          </ul>
          {firstContact && (
            <a
              className={styles.songCta}
              href={`${firstContact.whatsappUrl}?text=${encodeURIComponent(
                "¡Hola! Para la playlist de la boda no puede faltar: ",
              )}`}
              target="_blank"
              rel="noreferrer"
            >
              Mándanos tu canción
            </a>
          )}
        </div>
      )}
    </section>
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
    <section className={styles.guestbook}>
      <ScriptHeading brush="terracotta">Firmas y felicitaciones</ScriptHeading>
      {signatures.length > 0 ? (
        <>
          <div className={styles.signatures}>
            {signatures.map((signature) => (
              <figure key={signature.id} data-reveal>
                <blockquote>{signature.message}</blockquote>
                <figcaption>{signature.name}</figcaption>
              </figure>
            ))}
          </div>
          <p className={styles.guestbookNote}>
            Puedes dejarnos tu mensaje desde el enlace privado de tu invitación.
          </p>
        </>
      ) : (
        <div className={styles.guestbookEmpty} data-reveal>
          <Image
            draggable="false"
            src={mariaDanielaAssets.botanicalSprig}
            alt=""
            width={343}
            height={750}
            sizes="10rem"
          />
          <p>El tablón todavía está en blanco.</p>
          <p>
            El día de la boda podrás escribirnos dedicatorias, consejos o lo que quieras. Iremos colgando aquí cada mensaje.
          </p>
        </div>
      )}
    </section>
  )
}

function GalleryPage({ content, preview }: { content: WeddingExperienceContent; preview: boolean }) {
  // La web publicada no enseña fotos de ejemplo: solo las que suban los novios.
  const photos = content.gallery.length ? content.gallery : preview ? SAMPLE_GALLERY_PHOTOS : []

  return (
    <section className={styles.gallery}>
      <ScriptHeading brush="sage">Galería</ScriptHeading>
      {photos.length > 0 ? (
        <>
          <div className={styles.galleryGrid}>
            {photos.map((photo) => (
              <figure key={photo.id} data-reveal>
                <Image
                  draggable="false"
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 760px) 45vw, 16rem"
                />
              </figure>
            ))}
          </div>
          <p className={styles.galleryNote}>
            Podréis subir vuestras fotos del gran día desde vuestra invitación.
          </p>
        </>
      ) : (
        <div className={styles.galleryEmpty} data-reveal>
          <Image
            draggable="false"
            src={mariaDanielaAssets.botanicalSprig}
            alt=""
            width={343}
            height={750}
            sizes="10rem"
          />
          <p>Todavía no hay fotos que enseñaros.</p>
          <p>
            Después de la boda aparecerán aquí: las nuestras y las que subáis vosotros desde
            vuestra invitación.
          </p>
        </div>
      )}
    </section>
  )
}
