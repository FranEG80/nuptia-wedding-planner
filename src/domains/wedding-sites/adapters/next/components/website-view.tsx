"use client"

import Image from "next/image"
import { useMemo, useState, useTransition } from "react"

import { updateWeddingSiteModuleAction } from "@/domains/wedding-sites/adapters/next/actions"
import { mariaDanielaAssets } from "@/domains/wedding-sites/adapters/next/components/maria-daniela-assets"
import type { WeddingExperienceContent } from "@/domains/wedding-sites/application/dtos/wedding-experience.dto"
import type { WeddingSiteModuleDto } from "@/domains/wedding-sites/application/dtos/wedding-site-module.dto"

import styles from "./website-view.module.css"

const moduleArtwork: Record<WeddingSiteModuleDto["type"], string> = {
  gallery: mariaDanielaAssets.watercolorFrame,
  gifts: mariaDanielaAssets.watercolorBlobs,
  guestbook: mariaDanielaAssets.checklist,
  location: mariaDanielaAssets.locationPin,
  menu: mariaDanielaAssets.dinnerTableDark,
  spotify: mariaDanielaAssets.discoBallDark,
  timeline: mariaDanielaAssets.churchLineLight,
}

const deviceWidths = {
  mobile: 390,
  tablet: 768,
  desktop: 1440,
} as const

type Device = keyof typeof deviceWidths

export function WebsiteView({
  modules,
  experience,
}: {
  modules: WeddingSiteModuleDto[]
  experience: WeddingExperienceContent
}) {
  const [active, setActive] = useState<Record<WeddingSiteModuleDto["type"], boolean>>(
    Object.fromEntries(modules.map((module) => [module.type, module.enabled])) as Record<WeddingSiteModuleDto["type"], boolean>,
  )
  const [device, setDevice] = useState<Device>("desktop")
  const [message, setMessage] = useState("Todos los cambios están guardados")
  const [isPending, startTransition] = useTransition()
  const hidden = useMemo(
    () => Object.entries(active).filter(([, enabled]) => !enabled).map(([type]) => type).join(","),
    [active],
  )
  const previewUrl = `/app/web-preview${hidden ? `?hidden=${encodeURIComponent(hidden)}` : ""}`

  function toggleModule(module: WeddingSiteModuleDto) {
    const nextValue = !active[module.type]
    setActive((current) => ({ ...current, [module.type]: nextValue }))
    setMessage("Guardando cambios…")

    startTransition(async () => {
      try {
        const updated = await updateWeddingSiteModuleAction({ type: module.type, enabled: nextValue })

        if (!updated) {
          throw new Error("No se pudo guardar")
        }

        setMessage("Cambios guardados")
      } catch {
        setActive((current) => ({ ...current, [module.type]: !nextValue }))
        setMessage("No se pudo guardar. Inténtalo de nuevo.")
      }
    })
  }

  return (
    <div className={styles.editor}>
      <aside className={styles.controls}>
        <div className={styles.intro}>
          <p>Web a medida</p>
          <h1>{experience.displayName}</h1>
          <span>{isPending ? "Guardando…" : message}</span>
        </div>

        <div className={styles.moduleList}>
          {modules.map((module) => {
            const enabled = active[module.type]

            return (
              <article className={enabled ? styles.moduleActive : undefined} key={module.id}>
                <div className={styles.moduleArtwork}>
                  <Image draggable="false" src={moduleArtwork[module.type]} alt="" fill sizes="64px" />
                </div>
                <div>
                  <h2>{module.title}</h2>
                  <p>{module.desc}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  aria-label={`${enabled ? "Ocultar" : "Mostrar"} ${module.title}`}
                  onClick={() => toggleModule(module)}
                  disabled={isPending}
                  className={enabled ? styles.switchOn : undefined}
                >
                  <span />
                </button>
              </article>
            )
          })}
        </div>

        <a className={styles.publicLink} href={`/w/${experience.slug}`} target="_blank" rel="noreferrer">
          Abrir la web publicada
        </a>
      </aside>

      <section className={styles.previewPanel}>
        <div className={styles.previewToolbar}>
          <div>
            <strong>Vista previa</strong>
            <span>Así la verán vuestros invitados</span>
          </div>
          <div className={styles.devices} aria-label="Tamaño de vista previa">
            {(["mobile", "tablet", "desktop"] as Device[]).map((option) => (
              <button
                type="button"
                key={option}
                onClick={() => setDevice(option)}
                aria-pressed={device === option}
              >
                {option === "mobile" ? "Móvil" : option === "tablet" ? "Tablet" : "Ordenador"}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.canvas}>
          <div
            className={styles.frame}
            style={{ width: `min(100%, ${deviceWidths[device]}px)` }}
          >
            <div className={styles.browserBar}>
              <span /> <span /> <span />
              <small>nuptia.app/w/{experience.slug}</small>
            </div>
            <iframe
              key={previewUrl}
              src={previewUrl}
              title={`Vista previa de la web de ${experience.displayName}`}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
