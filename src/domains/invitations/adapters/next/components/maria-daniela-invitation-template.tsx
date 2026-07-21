import Image from "next/image"
import type { ReactNode } from "react"

import {
  mariaDanielaAssets,
  weddingPlaceholderPhotos,
} from "@/domains/wedding-sites/adapters/next/components/maria-daniela-assets"
import type { InvitationContentDto } from "@/domains/invitations/application/dtos/invitation-design.dto"
import { getInvitationPhotoAsset } from "@/domains/invitations/domain/invitation-template-options"
import type { WeddingDto } from "@/domains/weddings/application/dtos/wedding.dto"
import { EditorialMotion } from "@/shared/components/editorial-motion"
import { cn } from "@/shared/lib/utils"

import styles from "./maria-daniela-invitation-template.module.css"

const scheduleArt = [
  mariaDanielaAssets.churchLineDark,
  mariaDanielaAssets.cocktailsDark,
  mariaDanielaAssets.dinnerTableDark,
  mariaDanielaAssets.discoBallDark,
]

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

  return (
    <EditorialMotion className={cn(styles.invitation, className)}>
      <header className={styles.coverPage}>
        <Image draggable="false" src={mariaDanielaAssets.watercolorFrame} alt="" fill priority={!preview} className={styles.frameArt} sizes="100vw" />
        <Image draggable="false" src={mariaDanielaAssets.botanicalSprig} alt="" width={280} height={450} className={styles.sprig} />
        <div className={styles.coverCopy}>
          <p>{content.eyebrow}</p>
          <h1><span>{firstName}</span><i>&amp;</i><span>{secondName}</span></h1>
          <time>{formatDate(wedding.date)}</time>
          <small>{wedding.primaryCity}</small>
        </div>
        <a href="#invitacion">Abrir invitación</a>
      </header>

      <main id="invitacion">
        {visible.story && (
          <section className={styles.letter}>
            <p className={styles.kicker} data-reveal>Queremos celebrarlo contigo</p>
            <h2 data-script-reveal>{content.storyTitle}</h2>
            <div className={styles.letterLayout}>
              <div data-reveal>
                {content.story.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 18)}`}>{paragraph}</p>)}
              </div>
              <figure data-reveal>
                <Image draggable="false" src={selectedPhoto.src} alt="Fotografía de la pareja" fill sizes="(max-width: 720px) 84vw, 38vw" className={styles.photo} />
              </figure>
            </div>
          </section>
        )}

        {visible.schedule && (
          <section className={styles.schedule}>
            <Image draggable="false" src={mariaDanielaAssets.terracottaBrush} alt="" width={500} height={130} className={styles.brush} />
            <p className={styles.kicker} data-reveal>Guarda la fecha</p>
            <h2 data-script-reveal>{content.scheduleTitle}</h2>
            <div className={styles.scheduleList}>
              {content.schedule.map((item, index) => (
                <article key={item.id} data-reveal>
                  <div>
                    <Image draggable="false"
                      src={scheduleArt[index % scheduleArt.length]}
                      alt=""
                      fill
                      sizes="130px"
                      loading={preview ? "eager" : "lazy"}
                      unoptimized
                    />
                  </div>
                  <time>{item.time}</time>
                  <h3>{item.title}</h3>
                  <p>{item.date}</p>
                  {item.location && <strong>{item.location}</strong>}
                  {item.description && <p>{item.description}</p>}
                  {item.mapsUrl && <a href={item.mapsUrl} target="_blank" rel="noreferrer">Ver ubicación</a>}
                </article>
              ))}
            </div>
          </section>
        )}

        {visible.venue && (
          <section className={styles.venue}>
            <div data-reveal>
              <Image draggable="false" src={mariaDanielaAssets.churchWatercolor} alt="" width={420} height={320} />
              <p className={styles.kicker}>Ceremonia</p>
              <h2>{ceremony?.name ?? content.venueTitle}</h2>
              <p>{ceremony?.address}</p>
              {ceremony?.mapsUrl && (
                <a className={styles.mapLink} href={ceremony.mapsUrl} target="_blank" rel="noreferrer">
                  <Image draggable="false" src={mariaDanielaAssets.locationPin} alt="" width={34} height={46} />
                  <span>Cómo llegar</span>
                </a>
              )}
            </div>
            <div data-reveal>
              <Image draggable="false" src={mariaDanielaAssets.hotelWatercolor} alt="" width={420} height={320} />
              <p className={styles.kicker}>Celebración</p>
              <h2>{reception?.name ?? "Después, seguimos celebrando"}</h2>
              <p>{reception?.address ?? content.venueNote}</p>
              {reception?.mapsUrl && (
                <a className={styles.mapLink} href={reception.mapsUrl} target="_blank" rel="noreferrer">
                  <Image draggable="false" src={mariaDanielaAssets.locationPin} alt="" width={34} height={46} />
                  <span>Cómo llegar</span>
                </a>
              )}
            </div>
          </section>
        )}

        {visible.travel && content.travel.length > 0 && (
          <section className={styles.travel}>
            <Image draggable="false" src={mariaDanielaAssets.terracottaBrush} alt="" width={620} height={150} className={styles.travelBrush} />
            <p className={styles.kicker} data-reveal>Para que solo te preocupes de disfrutar</p>
            <h2 data-script-reveal>{content.travelTitle}</h2>
            <div>
              {content.travel.map((item, index) => (
                <article key={item.id} data-reveal>
                  <figure><Image draggable="false" src={item.imageSrc || weddingPlaceholderPhotos.place} alt="" fill sizes="(max-width: 720px) 86vw, 34vw" className={styles.photo} /></figure>
                  <span>0{index + 1}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <nav>
                    {item.websiteUrl && <a href={item.websiteUrl} target="_blank" rel="noreferrer">Visitar web</a>}
                    {item.mapsUrl && <a href={item.mapsUrl} target="_blank" rel="noreferrer">Ver mapa</a>}
                  </nav>
                </article>
              ))}
            </div>
          </section>
        )}

        {visible.registry && content.registry.length > 0 && (
          <section className={styles.registry}>
            <Image draggable="false" src={mariaDanielaAssets.watercolorBlobs} alt="" width={420} height={230} />
            <div data-reveal>
              <p className={styles.kicker}>Vuestra presencia es el mejor regalo</p>
              <h2 data-script-reveal>{content.registryTitle}</h2>
              <p>{content.registryIntro}</p>
              <div className={styles.registryBox}>
                <Image draggable="false"
                  src={mariaDanielaAssets.ibanPencilFrame}
                  alt=""
                  fill
                  sizes="(max-width: 720px) 88vw, 610px"
                  className={styles.registryFrame}
                  unoptimized
                />
                {content.registry.map((item) => (
                  item.url ? <a key={item.id} href={item.url} target="_blank" rel="noreferrer">{item.title}</a> : <strong key={item.id}>{item.title}</strong>
                ))}
                {publicRegistryNote && <small>{publicRegistryNote}</small>}
              </div>
            </div>
          </section>
        )}

        {visible.rsvp && (
          <section className={styles.rsvp}>
            <Image draggable="false" src={mariaDanielaAssets.checklist} alt="" width={115} height={115} data-reveal />
            <p className={styles.kicker}>Ahora sí</p>
            <h2 data-script-reveal>{content.rsvpTitle}</h2>
            <p>{content.rsvpSubtitle}</p>
            <div>{rsvpSlot ?? <a href="#rsvp">Confirmar asistencia</a>}</div>
          </section>
        )}

        {visible.questions && (
          <section className={styles.questions}>
            <Image draggable="false" src={mariaDanielaAssets.cocktailsLight} alt="" width={120} height={150} />
            <h2>{content.questionsTitle}</h2>
            <p>Si necesitas cualquier cosa, escríbenos directamente por WhatsApp. Estaremos encantados de ayudarte.</p>
          </section>
        )}
      </main>

      <footer className={styles.footer}>
        <figure><Image draggable="false" src={weddingPlaceholderPhotos.dance} alt="Pareja bailando" fill sizes="100vw" className={styles.photo} /></figure>
        <div>
          <Image draggable="false" src={mariaDanielaAssets.watercolorFrame} alt="" fill sizes="100vw" />
          <p>Nos vemos muy pronto</p><h2>{firstName} <i>&amp;</i> {secondName}</h2>
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
