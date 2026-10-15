"use client"

import Image from "next/image"
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

import type { GuestPhotoDto } from "@/domains/guest-photos/application/dtos/guest-photo.dto"

import styles from "./guest-photo-gallery.module.css"

/** Píxeles de desplazamiento horizontal que cuentan como gesto de pasar foto. */
const SWIPE_THRESHOLD = 48

export function guestPhotoAlt(photo: GuestPhotoDto) {
  return photo.credit ? `Foto de ${photo.credit}` : "Foto de la boda"
}

/**
 * Visor a pantalla completa con la versión optimizada. Es un <dialog> modal:
 * el navegador atrapa el foco, cierra con Esc y devuelve el foco a la
 * polaroid. Flechas del teclado, botones y deslizar para cambiar de foto.
 */
export function GuestPhotoLightbox({
  photos,
  index,
  total,
  onIndexChange,
  onClose,
  onNearEnd,
}: {
  photos: GuestPhotoDto[]
  index: number | null
  /** Total de fotos publicadas, si se conoce. */
  total: number | null
  onIndexChange: (index: number) => void
  onClose: () => void
  /** Se llama al acercarse a la última foto cargada, para pedir más. */
  onNearEnd: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const swipeRef = useRef<{ x: number; y: number } | null>(null)
  const photo = index !== null ? photos[index] : null
  const isOpen = photo !== null && photo !== undefined
  const [loadedId, setLoadedId] = useState<string | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current

    if (!dialog) {
      return
    }

    if (isOpen && !dialog.open) {
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  // Precarga las vecinas para que pasar de foto sea instantáneo.
  useEffect(() => {
    if (index === null) {
      return
    }

    for (const neighbor of [photos[index - 1], photos[index + 1]]) {
      if (neighbor) {
        const image = new window.Image()
        image.src = neighbor.url
      }
    }
  }, [index, photos])

  const hasPrevious = index !== null && index > 0
  const hasNext = index !== null && index < photos.length - 1

  function showPrevious() {
    if (index !== null && hasPrevious) {
      onIndexChange(index - 1)
    }
  }

  function showNext() {
    if (index === null || !hasNext) {
      return
    }

    onIndexChange(index + 1)

    // Cerca del final de lo cargado: se pide la página siguiente.
    if (index + 1 >= photos.length - 3) {
      onNearEnd()
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      showPrevious()
    } else if (event.key === "ArrowRight") {
      event.preventDefault()
      showNext()
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    swipeRef.current = { x: event.clientX, y: event.clientY }
  }

  function handlePointerUp(event: PointerEvent<HTMLElement>) {
    const start = swipeRef.current
    swipeRef.current = null

    if (!start) {
      return
    }

    const deltaX = event.clientX - start.x
    const deltaY = event.clientY - start.y

    if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) < Math.abs(deltaY)) {
      return
    }

    if (deltaX > 0) {
      showPrevious()
    } else {
      showNext()
    }
  }

  const position = index !== null ? index + 1 : 0
  const count = total !== null ? Math.max(total, photos.length) : photos.length

  return (
    <dialog
      ref={dialogRef}
      className={styles.lightbox}
      aria-label="Visor de fotos"
      onClose={onClose}
      onKeyDown={handleKeyDown}
      // El visor ocupa toda la pantalla: un clic fuera de la foto (en el
      // propio dialog o en el escenario) lo cierra. closedby aún no llega a Safari.
      onClick={(event) => {
        const target = event.target as HTMLElement

        if (target === event.currentTarget || target.dataset.lightboxStage !== undefined) {
          event.currentTarget.close()
        }
      }}
    >
      {photo && (
        <div className={styles.lightboxStage} data-lightbox-stage="">
          <figure
            className={styles.lightboxFrame}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => {
              swipeRef.current = null
            }}
          >
            <Image
              key={photo.id}
              src={photo.url}
              alt={guestPhotoAlt(photo)}
              width={photo.width}
              height={photo.height}
              unoptimized
              loading="eager"
              draggable={false}
              className={styles.lightboxImage}
              data-loaded={loadedId === photo.id || undefined}
              onLoad={() => setLoadedId(photo.id)}
            />
            <figcaption className={styles.lightboxCaption}>
              <span className={styles.lightboxCredit}>{photo.credit}</span>
              <span className={styles.lightboxCounter} aria-live="polite">
                {position} de {count}
              </span>
            </figcaption>
          </figure>

          <button
            type="button"
            className={`${styles.lightboxNav} ${styles.lightboxPrevious}`}
            onClick={showPrevious}
            disabled={!hasPrevious}
            aria-label="Foto anterior"
          >
            <ChevronLeft aria-hidden="true" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className={`${styles.lightboxNav} ${styles.lightboxNext}`}
            onClick={showNext}
            disabled={!hasNext}
            aria-label="Foto siguiente"
          >
            <ChevronRight aria-hidden="true" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className={styles.lightboxClose}
            onClick={() => dialogRef.current?.close()}
            aria-label="Cerrar el visor"
            autoFocus
          >
            <X aria-hidden="true" strokeWidth={1.5} />
          </button>
        </div>
      )}
    </dialog>
  )
}
