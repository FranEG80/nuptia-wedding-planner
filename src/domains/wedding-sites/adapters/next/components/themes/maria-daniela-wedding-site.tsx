import Image from "next/image"

import { CopyIbanButton } from "@/domains/wedding-sites/adapters/next/components/copy-iban-button"
import {
  mariaDanielaAssets,
  weddingPlaceholderPhotos,
} from "@/domains/wedding-sites/adapters/next/components/maria-daniela-assets"
import { WeddingCountdown } from "@/domains/wedding-sites/adapters/next/components/wedding-countdown"
import type { WeddingSiteThemeProps } from "@/domains/wedding-sites/adapters/next/components/themes/wedding-site-theme-props"
import type { WeddingExperienceContent } from "@/domains/wedding-sites/application/dtos/wedding-experience.dto"
import { EditorialMotion } from "@/shared/components/editorial-motion"

import styles from "../wedding-experience.module.css"

const timelineImages = {
  church: mariaDanielaAssets.churchLineDark,
  cocktails: mariaDanielaAssets.cocktailsDark,
  dinner: mariaDanielaAssets.dinnerTableDark,
  party: mariaDanielaAssets.discoBallDark,
} as const

export function MariaDanielaWeddingSite({
  content,
  pages,
  currentPage,
  onNavigate,
  preview = false,
}: WeddingSiteThemeProps) {
  const [firstName, secondName] = content.partnerNames

  return (
    <div className={styles.site}>
      <nav className={styles.nav}>
        <p className={styles.navBrand}>
          {firstName} &amp; {secondName}
        </p>
        <div className={styles.navLinks}>
          {pages.map((page) => (
            <button
              key={page.id}
              type="button"
              onClick={() => onNavigate(page.id)}
              aria-current={page.id === currentPage ? "page" : undefined}
              className={page.id === currentPage ? styles.navLinkActive : undefined}
            >
              {page.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Remontar por página reinicia las animaciones de scroll de cada sección. */}
      <EditorialMotion key={currentPage}>
        {currentPage === "inicio" && <HomePage content={content} preview={preview} />}
        {currentPage === "menu" && <MenuPage content={content} />}
        {currentPage === "itinerario" && <TimelinePage content={content} preview={preview} />}
        {currentPage === "regalos" && <GiftsPage content={content} />}
        {currentPage === "musica" && <MusicPage content={content} />}
        {currentPage === "galeria" && <GalleryPage content={content} />}

        <footer className={styles.footer}>
          <figure>
            <Image
              draggable="false"
              src={weddingPlaceholderPhotos.place}
              alt="Paisaje de la celebración"
              fill
              sizes="100vw"
              className={styles.cover}
            />
          </figure>
          <div>
            <Image
              draggable="false"
              src={mariaDanielaAssets.watercolorFrame}
              alt=""
              fill
              sizes="100vw"
              className={styles.footerFrame}
            />
            <p>Gracias por ser parte de nuestra historia</p>
            <h2>
              {firstName} <i>&amp;</i> {secondName}
            </h2>
            <time>{content.dateLabel}</time>
          </div>
        </footer>
      </EditorialMotion>
    </div>
  )
}

function HomePage({ content, preview }: { content: WeddingExperienceContent; preview: boolean }) {
  const [firstName, secondName] = content.partnerNames
  const hasLocation = content.enabledModules.includes("location")

  return (
    <>
      <header className={styles.hero}>
        <Image
          draggable="false"
          src={mariaDanielaAssets.sageWash}
          alt=""
          width={1920}
          height={1080}
          priority
          sizes="100vw"
          className={styles.heroSage}
        />
        <Image
          draggable="false"
          src={mariaDanielaAssets.watercolorSides}
          alt=""
          width={1920}
          height={1080}
          priority
          sizes="100vw"
          className={styles.heroWatercolor}
        />
        <div className={styles.heroCopy}>
          <p>Nos casamos</p>
          <h1>
            <span>{firstName}</span>
            <i>&amp;</i>
            <span>{secondName}</span>
          </h1>
          <p className={styles.heroDate}>
            {content.dateLabel} · {content.city}
          </p>
        </div>
        <a className={styles.scrollCue} href="#historia">Descubre nuestra historia</a>
      </header>

      <figure className={styles.heroPortrait} data-reveal>
        <Image
          draggable="false"
          src={weddingPlaceholderPhotos.hero}
          alt={`Fotografía de ${content.displayName}`}
          fill
          priority={!preview}
          sizes="(max-width: 760px) 92vw, 72vw"
          className={styles.cover}
        />
      </figure>

      <section className={styles.story} id="historia">
        <Image
          draggable="false"
          src={mariaDanielaAssets.botanicalSprig}
          alt=""
          width={260}
          height={420}
          className={styles.storySprig}
        />
        <div className={styles.eyebrow} data-reveal>Una historia que empieza con un sí</div>
        <h2 data-script-reveal>Nuestra historia</h2>
        <div className={styles.storyGrid}>
          <figure className={styles.storyPhoto} data-reveal>
            <Image draggable="false" src={weddingPlaceholderPhotos.hands} alt="Pareja entre flores" fill sizes="(max-width: 760px) 84vw, 36vw" className={styles.cover} />
          </figure>
          <div className={styles.storyText} data-reveal>
            {content.story.slice(0, 5).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {content.story.length > 5 && <p>{content.story.at(-2)}</p>}
          </div>
          <figure className={`${styles.storyPhoto} ${styles.storyPhotoSecond}`} data-reveal>
            <Image draggable="false" src={weddingPlaceholderPhotos.garden} alt="Un paseo por el jardín" fill sizes="(max-width: 760px) 72vw, 28vw" className={styles.cover} />
          </figure>
        </div>
      </section>

      {hasLocation && (
        <section className={styles.places}>
          <div className={styles.sectionIntro} data-reveal>
            <p className={styles.eyebrow}>Dónde nos encontramos</p>
            <h2 data-script-reveal>El gran día</h2>
          </div>
          <div className={styles.placeGrid}>
            {[
              { label: "La ceremonia", place: content.ceremony, image: mariaDanielaAssets.churchWatercolor },
              { label: "La celebración", place: content.reception, image: mariaDanielaAssets.hotelWatercolor },
            ].map(({ label, place, image }) => (
              <article className={styles.placeCard} key={label} data-reveal>
                <div className={styles.placeArt}>
                  <Image draggable="false" src={image} alt="" fill sizes="(max-width: 760px) 84vw, 38vw" className={styles.contain} />
                </div>
                <p>{label}</p>
                <h3>{place.name}</h3>
                <time>{place.time} h</time>
                <address>{place.address}</address>
                <a className={styles.mapLink} href={place.mapsUrl} target="_blank" rel="noreferrer">
                  <Image draggable="false" src={mariaDanielaAssets.locationPin} alt="" width={34} height={46} />
                  <span>Cómo llegar</span>
                </a>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className={styles.countdown}>
        <Image draggable="false" src={mariaDanielaAssets.sageWash} alt="" width={760} height={240} className={styles.countdownWash} />
        <Image draggable="false" src={mariaDanielaAssets.watercolorBlobs} alt="" width={340} height={190} className={styles.countdownBlobs} />
        <div className={styles.countdownCopy} data-reveal>
          <p>Nos vemos en</p>
          <WeddingCountdown dateIso={content.dateIso} />
        </div>
      </section>

      <section className={styles.contact}>
        <Image draggable="false" src={mariaDanielaAssets.checklist} alt="" width={105} height={105} data-reveal />
        <p className={styles.eyebrow}>Información importante</p>
        <h2 data-script-reveal>Confirma desde tu invitación personal</h2>
        <p>
          Encontrarás el formulario de asistencia, menú y acompañantes en el enlace privado de tu
          invitación. Fecha límite: {content.rsvpDeadline}.
        </p>
        {content.contacts.length > 0 && (
          <div className={styles.contacts}>
            {content.contacts.map((contact) => (
              <a href={contact.whatsappUrl} target="_blank" rel="noreferrer" key={contact.phone}>
                <Image draggable="false" src={mariaDanielaAssets.whatsappWatercolor} alt="" width={46} height={46} />
                <span className={styles.contactCopy}>
                  <strong>WhatsApp de {contact.name}</strong>
                  <span>{contact.phone}</span>
                </span>
              </a>
            ))}
          </div>
        )}
      </section>
    </>
  )
}

function MenuPage({ content }: { content: WeddingExperienceContent }) {
  return (
    <>
      <section className={styles.tableSection}>
        <div className={styles.tableCollage} data-reveal>
          <figure>
            <Image draggable="false" src={weddingPlaceholderPhotos.table} alt="Mesa preparada para el banquete" fill sizes="(max-width: 760px) 76vw, 42vw" className={styles.cover} />
          </figure>
          <Image draggable="false" src={mariaDanielaAssets.cocktailsLight} alt="" width={145} height={180} />
        </div>
        <div data-reveal>
          <p className={styles.eyebrow}>Mesa, brindis y sobremesa</p>
          <h2 data-script-reveal>Celebrar juntos</h2>
          <p>Hemos preparado una noche para sentarnos sin prisa, brindar por todo lo vivido y bailar por todo lo que está por llegar.</p>
          <p>Las intolerancias y preferencias de menú se recogen de forma privada en cada invitación.</p>
        </div>
      </section>

      <section className={styles.galleryPage}>
        <p className={styles.eyebrow} data-reveal>Lo que serviremos</p>
        <h2 data-script-reveal>El menú</h2>
        <div className={styles.menuCourses}>
          {content.menu.map((course) => (
            <article className={styles.menuCourse} key={course.id} data-reveal>
              <figure>
                <Image draggable="false" src={course.imageSrc} alt={course.name} fill sizes="(max-width: 760px) 84vw, 30vw" className={styles.cover} />
              </figure>
              <p>{course.course}</p>
              <h3>{course.name}</h3>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}

function TimelinePage({ content, preview }: { content: WeddingExperienceContent; preview: boolean }) {
  return (
    <section className={styles.timeline}>
      <Image draggable="false" src={mariaDanielaAssets.terracottaBrush} alt="" width={520} height={120} className={styles.timelineBrush} />
      <p className={styles.eyebrow} data-reveal>Guarda energía</p>
      <h2 data-script-reveal>Así será el día</h2>
      <div className={styles.timelineGrid}>
        {content.timeline.map((item) => (
          <article key={item.id} data-reveal>
            <div className={styles.timelineArt}>
              <Image
                draggable="false"
                src={timelineImages[item.illustration]}
                alt=""
                fill
                sizes="150px"
                className={styles.contain}
                loading={preview ? "eager" : "lazy"}
                unoptimized
              />
            </div>
            <time>{item.time}</time>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function GiftsPage({ content }: { content: WeddingExperienceContent }) {
  return (
    <section className={styles.gifts}>
      <Image draggable="false" src={mariaDanielaAssets.watercolorBlobs} alt="" width={380} height={210} className={styles.giftBlobs} />
      <div data-reveal>
        <p className={styles.eyebrow}>El mejor regalo es veros</p>
        <h2 data-script-reveal>Si queréis ayudarnos a seguir sumando kilómetros…</h2>
        <p>Vuestra presencia es lo más importante. Para quienes nos habéis preguntado, os dejamos aquí nuestra cuenta.</p>
        {content.gifts && (
          <div className={styles.ibanBox}>
            <Image draggable="false" src={mariaDanielaAssets.ibanPencilFrame} alt="" fill sizes="(max-width: 760px) 90vw, 610px" className={styles.ibanFrame} unoptimized />
            <small>Titular: {content.gifts.accountHolder}</small>
            <strong>{content.gifts.iban}</strong>
            <CopyIbanButton iban={content.gifts.iban} />
          </div>
        )}
      </div>
    </section>
  )
}

function MusicPage({ content }: { content: WeddingExperienceContent }) {
  return (
    <section className={styles.partySection}>
      <Image draggable="false" src={mariaDanielaAssets.terracottaBrush} alt="" width={620} height={150} className={styles.partyBrush} />
      <Image draggable="false" src={mariaDanielaAssets.discoBallLight} alt="" width={170} height={210} className={styles.partyIllustration} data-reveal />
      <p className={styles.eyebrow}>Después de cenar</p>
      <h2 data-script-reveal>Que empiece la fiesta</h2>
      <p data-reveal>Ven con ganas de bailar. Nosotros ponemos la música; vosotros, los mejores pasos.</p>
      <ul className={styles.playlist} data-reveal>
        {content.playlist.map((track) => (
          <li key={track.id}>
            <strong>{track.title}</strong>
            <span>{track.artist}</span>
          </li>
        ))}
      </ul>
      <figure data-reveal>
        <Image draggable="false" src={weddingPlaceholderPhotos.dance} alt="Baile de los novios" fill sizes="(max-width: 760px) 86vw, 52vw" className={styles.cover} />
      </figure>
    </section>
  )
}

function GalleryPage({ content }: { content: WeddingExperienceContent }) {
  return (
    <section className={styles.galleryPage}>
      <p className={styles.eyebrow} data-reveal>Recuerdos compartidos</p>
      <h2 data-script-reveal>Galería</h2>
      <div className={styles.galleryGrid}>
        {content.gallery.map((photo) => (
          <figure key={photo.id} data-reveal>
            <Image draggable="false" src={photo.src} alt={photo.alt} fill sizes="(max-width: 760px) 45vw, 22vw" className={styles.cover} />
          </figure>
        ))}
      </div>
      <p>Podréis subir vuestras fotos del gran día desde vuestra invitación personal.</p>
    </section>
  )
}
