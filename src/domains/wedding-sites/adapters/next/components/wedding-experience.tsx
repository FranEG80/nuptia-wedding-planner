import Image from "next/image"

import { CopyIbanButton } from "@/domains/wedding-sites/adapters/next/components/copy-iban-button"
import {
  mariaDanielaAssets,
  weddingPlaceholderPhotos,
} from "@/domains/wedding-sites/adapters/next/components/maria-daniela-assets"
import { WeddingCountdown } from "@/domains/wedding-sites/adapters/next/components/wedding-countdown"
import type { WeddingExperienceContent } from "@/domains/wedding-sites/application/dtos/wedding-experience.dto"
import { EditorialMotion } from "@/shared/components/editorial-motion"
import { mariaDanielaFontVariables } from "@/shared/fonts/maria-daniela-fonts"

import styles from "./wedding-experience.module.css"

const timelineImages = {
  church: mariaDanielaAssets.churchLineDark,
  cocktails: mariaDanielaAssets.cocktailsDark,
  dinner: mariaDanielaAssets.dinnerTableDark,
  party: mariaDanielaAssets.discoBallDark,
} as const

function isEnabled(content: WeddingExperienceContent, module: WeddingExperienceContent["enabledModules"][number]) {
  return content.enabledModules.includes(module)
}

export function WeddingExperience({
  content,
  preview = false,
}: {
  content: WeddingExperienceContent
  preview?: boolean
}) {
  const [firstName, secondName] = content.partnerNames

  return (
    <EditorialMotion className={`${styles.site} ${mariaDanielaFontVariables}`}>
      <header className={styles.hero}>
        <Image draggable="false" src={mariaDanielaAssets.sageWash} alt="" width={1920} height={1080} priority sizes="100vw" className={styles.heroSage} />
        <Image draggable="false"
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
          <p className={styles.heroDate}>{content.dateLabel} · {content.city}</p>
        </div>
        <a className={styles.scrollCue} href="#historia">Descubre nuestra historia</a>
      </header>

      <figure className={styles.heroPortrait} data-reveal>
        <Image draggable="false"
          src={weddingPlaceholderPhotos.hero}
          alt={`Fotografía de ${content.displayName}`}
          fill
          priority={!preview}
          sizes="(max-width: 760px) 92vw, 72vw"
          className={styles.cover}
        />
      </figure>

      {isEnabled(content, "gallery") && (
        <section className={styles.story} id="historia">
          <Image draggable="false"
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
      )}

      {isEnabled(content, "location") && (
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

      {isEnabled(content, "timeline") && (
        <section className={styles.timeline}>
          <Image draggable="false" src={mariaDanielaAssets.terracottaBrush} alt="" width={520} height={120} className={styles.timelineBrush} />
          <p className={styles.eyebrow} data-reveal>Guarda energía</p>
          <h2 data-script-reveal>Así será el día</h2>
          <div className={styles.timelineGrid}>
            {content.timeline.map((item) => (
              <article key={item.id} data-reveal>
                <div className={styles.timelineArt}>
                  <Image draggable="false"
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
      )}

      <section className={styles.countdown}>
        <Image draggable="false" src={mariaDanielaAssets.sageWash} alt="" width={760} height={240} className={styles.countdownWash} />
        <Image draggable="false" src={mariaDanielaAssets.watercolorBlobs} alt="" width={340} height={190} className={styles.countdownBlobs} />
        <div className={styles.countdownCopy} data-reveal>
          <p>Nos vemos en</p>
          <WeddingCountdown dateIso={content.dateIso} />
        </div>
      </section>

      {isEnabled(content, "menu") && (
        <section className={styles.tableSection}>
          <div className={styles.tableCollage} data-reveal>
            <figure><Image draggable="false" src={weddingPlaceholderPhotos.table} alt="Mesa preparada para el banquete" fill sizes="(max-width: 760px) 76vw, 42vw" className={styles.cover} /></figure>
            <Image draggable="false" src={mariaDanielaAssets.cocktailsLight} alt="" width={145} height={180} />
          </div>
          <div data-reveal>
            <p className={styles.eyebrow}>Mesa, brindis y sobremesa</p>
            <h2 data-script-reveal>Celebrar juntos</h2>
            <p>Hemos preparado una noche para sentarnos sin prisa, brindar por todo lo vivido y bailar por todo lo que está por llegar.</p>
            <p>Las intolerancias y preferencias de menú se recogen de forma privada en cada invitación.</p>
          </div>
        </section>
      )}

      {isEnabled(content, "spotify") && (
        <section className={styles.partySection}>
          <Image draggable="false" src={mariaDanielaAssets.terracottaBrush} alt="" width={620} height={150} className={styles.partyBrush} />
          <Image draggable="false" src={mariaDanielaAssets.discoBallLight} alt="" width={170} height={210} className={styles.partyIllustration} data-reveal />
          <p className={styles.eyebrow}>Después de cenar</p>
          <h2 data-script-reveal>Que empiece la fiesta</h2>
          <p data-reveal>Ven con ganas de bailar. Nosotros ponemos la música; vosotros, los mejores pasos.</p>
          <figure data-reveal><Image draggable="false" src={weddingPlaceholderPhotos.dance} alt="Baile de los novios" fill sizes="(max-width: 760px) 86vw, 52vw" className={styles.cover} /></figure>
        </section>
      )}

      {isEnabled(content, "gifts") && content.gifts && (
        <section className={styles.gifts}>
          <Image draggable="false" src={mariaDanielaAssets.watercolorBlobs} alt="" width={380} height={210} className={styles.giftBlobs} />
          <div data-reveal>
            <p className={styles.eyebrow}>El mejor regalo es veros</p>
            <h2 data-script-reveal>Si queréis ayudarnos a seguir sumando kilómetros…</h2>
            <p>Vuestra presencia es lo más importante. Para quienes nos habéis preguntado, os dejamos aquí nuestra cuenta.</p>
            <div className={styles.ibanBox}>
              <Image draggable="false" src={mariaDanielaAssets.ibanPencilFrame} alt="" fill sizes="(max-width: 760px) 90vw, 610px" className={styles.ibanFrame} unoptimized />
              <small>Titular: {content.gifts.accountHolder}</small>
              <strong>{content.gifts.iban}</strong>
              <CopyIbanButton iban={content.gifts.iban} />
            </div>
          </div>
        </section>
      )}

      <section className={styles.contact}>
        <Image draggable="false" src={mariaDanielaAssets.checklist} alt="" width={105} height={105} data-reveal />
        <p className={styles.eyebrow}>Información importante</p>
        <h2 data-script-reveal>Confirma desde tu invitación personal</h2>
        <p>Encontrarás el formulario de asistencia, menú y acompañantes en el enlace privado de tu invitación. Fecha límite: {content.rsvpDeadline}.</p>
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

      {isEnabled(content, "guestbook") && (
        <footer className={styles.footer}>
          <figure><Image draggable="false" src={weddingPlaceholderPhotos.place} alt="Paisaje de la celebración" fill sizes="100vw" className={styles.cover} /></figure>
          <div>
            <Image draggable="false" src={mariaDanielaAssets.watercolorFrame} alt="" fill sizes="100vw" className={styles.footerFrame} />
            <p>Gracias por ser parte de nuestra historia</p>
            <h2>{firstName} <i>&amp;</i> {secondName}</h2>
            <time>{content.dateLabel}</time>
          </div>
        </footer>
      )}
    </EditorialMotion>
  )
}
