"use client"

import Image from "next/image"
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { ImagePlus } from "lucide-react"

import type {
  GuestPhotoDto,
  GuestPhotoPageDto,
} from "@/domains/guest-photos/application/dtos/guest-photo.dto"
import { GuestWallDialog } from "@/domains/wedding-sites/adapters/next/components/guest-wall-dialog"
import {
  GuestPhotoLightbox,
  guestPhotoAlt,
} from "@/domains/wedding-sites/adapters/next/components/guest-photos/guest-photo-lightbox"
import { GuestPhotoUploader } from "@/domains/wedding-sites/adapters/next/components/guest-photos/guest-photo-uploader"
import type { WeddingExperienceGalleryPhoto } from "@/domains/wedding-sites/application/dtos/wedding-experience.dto"

import styles from "./guest-photo-gallery.module.css"

type LoadStatus = "loading" | "idle" | "error"

/** Cuántas polaroids de una página entran escalonadas; el resto, a la vez. */
const MAX_STAGGER = 8

/** Inclinación estable por foto (entre -2,2° y 2,2°): mismo ángulo al recargar. */
function tiltFor(id: string) {
  let hash = 0

  for (const character of id) {
    hash = (hash * 31 + character.charCodeAt(0)) | 0
  }

  return ((Math.abs(hash) % 9) - 4) * 0.55
}

function previewToGuestPhoto(photo: WeddingExperienceGalleryPhoto): GuestPhotoDto {
  return {
    id: photo.id,
    thumbnailUrl: photo.src,
    url: photo.src,
    width: 1200,
    height: 1200,
    credit: photo.credit ?? null,
  }
}

function mergePhotos(current: GuestPhotoDto[], incoming: GuestPhotoDto[]) {
  const seen = new Set(current.map((photo) => photo.id))
  return [...current, ...incoming.filter((photo) => !seen.has(photo.id))]
}

async function fetchGuestPhotoPage(
  slug: string,
  cursor: string | null,
  signal?: AbortSignal,
): Promise<GuestPhotoPageDto> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""
  const response = await fetch(`/api/w/${encodeURIComponent(slug)}/photos${query}`, {
    cache: "no-store",
    signal,
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  return (await response.json()) as GuestPhotoPageDto
}

/**
 * Galería de la web: fotos de invitados y fotógrafos como polaroids con el
 * nombre de quien la hizo. Carga por páginas al acercarse al final (scroll
 * infinito) y las imágenes son lazy. Arriba, el botón que abre el modal de
 * identificación y subida.
 */
export function GuestPhotoGallery({
  slug,
  preview = false,
  previewPhotos = [],
  emptyState,
  desk,
}: {
  slug: string
  /** Editor de la web: enseña `previewPhotos` sin cargar ni subir nada. */
  preview?: boolean
  previewPhotos?: WeddingExperienceGalleryPhoto[]
  emptyState: ReactNode
  /**
   * Entrada de la galería de la plantilla (rótulo, entradilla) con el botón
   * de subir dentro, igual que la mesa de firmas. Sin ella, solo el botón.
   */
  desk?: (uploadAction: ReactNode) => ReactNode
}) {
  const [photos, setPhotos] = useState<GuestPhotoDto[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [total, setTotal] = useState<number | null>(null)
  const [status, setStatus] = useState<LoadStatus>(preview ? "idle" : "loading")
  const [hasLoaded, setHasLoaded] = useState(false)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const loadingRef = useRef(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const samplePhotos = useMemo(() => previewPhotos.map(previewToGuestPhoto), [previewPhotos])
  const visiblePhotos = preview ? samplePhotos : photos

  const applyPage = useCallback((page: GuestPhotoPageDto, cursor: string | null) => {
    // La primera página va delante de lo que se haya subido mientras cargaba.
    setPhotos((current) =>
      cursor ? mergePhotos(current, page.photos) : mergePhotos(page.photos, current),
    )
    setNextCursor(page.nextCursor)

    if (page.total !== null) {
      setTotal(page.total)
    }

    setHasLoaded(true)
    setStatus("idle")
  }, [])

  /** Páginas siguientes y reintentos; la primera la carga el efecto inicial. */
  const loadPage = useCallback(
    async (cursor: string | null) => {
      if (loadingRef.current) {
        return
      }

      loadingRef.current = true
      setStatus("loading")

      try {
        applyPage(await fetchGuestPhotoPage(slug, cursor), cursor)
      } catch {
        setStatus("error")
      } finally {
        loadingRef.current = false
      }
    },
    [slug, applyPage],
  )

  useEffect(() => {
    if (preview) {
      return
    }

    const controller = new AbortController()

    fetchGuestPhotoPage(slug, null, controller.signal)
      .then((page) => applyPage(page, null))
      .catch(() => {
        if (!controller.signal.aborted) {
          setStatus("error")
        }
      })

    return () => controller.abort()
  }, [preview, slug, applyPage])

  // Scroll infinito: al acercarse el centinela, la página siguiente. Si tras
  // cargarla sigue a la vista, el observador nuevo vuelve a disparar.
  useEffect(() => {
    const sentinel = sentinelRef.current

    if (preview || !nextCursor || status !== "idle" || !sentinel) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadPage(nextCursor)
        }
      },
      { rootMargin: "900px 0px" },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [preview, nextCursor, status, loadPage])

  const loadMoreForLightbox = useCallback(() => {
    if (nextCursor && status === "idle") {
      void loadPage(nextCursor)
    }
  }, [nextCursor, status, loadPage])

  const handleUploaded = useCallback((photo: GuestPhotoDto) => {
    setPhotos((current) =>
      current.some((existing) => existing.id === photo.id) ? current : [photo, ...current],
    )
    setTotal((value) => (value === null ? value : value + 1))
    setHasLoaded(true)
  }, [])

  const isEmpty = preview ? samplePhotos.length === 0 : hasLoaded && photos.length === 0

  const uploadAction = (
    <GuestWallDialog
      slug={slug}
      preview={preview}
      label="Subir fotos"
      icon={<ImagePlus aria-hidden="true" strokeWidth={1.6} />}
      title="Sube tus fotos"
    >
      {({ access, close }) => (
        <GuestPhotoUploader
          slug={slug}
          access={access}
          onUploaded={handleUploaded}
          onClose={close}
        />
      )}
    </GuestWallDialog>
  )

  return (
    <div className={styles.gallery}>
      {desk ? desk(uploadAction) : !preview && <div className={styles.desk}>{uploadAction}</div>}

      {visiblePhotos.length > 0 && (
        <ul className={styles.grid} aria-label="Fotos de la boda">
          {visiblePhotos.map((photo, index) => (
            <li
              key={photo.id}
              className={styles.item}
              style={
                {
                  "--tilt": `${tiltFor(photo.id)}deg`,
                  "--stagger": Math.min(index % 24, MAX_STAGGER),
                } as CSSProperties
              }
            >
              <figure className={styles.polaroid}>
                <button
                  type="button"
                  className={styles.photoButton}
                  onClick={() => setOpenIndex(index)}
                  aria-label={`Ver ${guestPhotoAlt(photo).toLowerCase()} en grande`}
                >
                  <Image
                    src={photo.thumbnailUrl}
                    alt={guestPhotoAlt(photo)}
                    width={640}
                    height={640}
                    unoptimized
                    draggable={false}
                    className={styles.photo}
                    onLoad={(event) => {
                      event.currentTarget.dataset.loaded = "true"
                    }}
                  />
                </button>
                <figcaption className={styles.caption}>{photo.credit ?? ""}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      )}

      {!preview && !hasLoaded && status === "loading" && (
        <p className="sr-only" role="status">Cargando fotos…</p>
      )}

      {isEmpty && status !== "error" && emptyState}

      {!preview && <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />}

      {hasLoaded && status === "loading" && (
        <p className={styles.loadMore} role="status">
          Revelando más fotos…
        </p>
      )}

      {status === "error" && (
        <p className={styles.loadMore} role="alert">
          No se pudieron cargar las fotos.{" "}
          <button
            type="button"
            className={styles.textButton}
            onClick={() => void loadPage(hasLoaded ? nextCursor : null)}
          >
            Reintentar
          </button>
        </p>
      )}

      {hasLoaded && !nextCursor && status === "idle" && photos.length > 8 && (
        <p className={styles.endOfRoll}>Fin del carrete</p>
      )}

      <GuestPhotoLightbox
        photos={visiblePhotos}
        index={openIndex}
        total={preview ? samplePhotos.length : total}
        onIndexChange={setOpenIndex}
        onClose={() => setOpenIndex(null)}
        onNearEnd={loadMoreForLightbox}
      />
    </div>
  )
}
