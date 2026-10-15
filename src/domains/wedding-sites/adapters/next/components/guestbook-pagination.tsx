"use client"

import { guestbookPaginationItems } from "@/domains/wedding-sites/domain/guestbook"

import styles from "./guestbook.module.css"

/**
 * Paginación del tablón. Las firmas van de la más reciente a la más antigua,
 * así que los extremos dicen hacia dónde se viaja en el tiempo.
 */
export function GuestbookPagination({
  page,
  pageCount,
  total,
  onPageChange,
  isPending = false,
}: {
  page: number
  pageCount: number
  total: number
  onPageChange: (page: number) => void
  isPending?: boolean
}) {
  if (pageCount <= 1) {
    return null
  }

  const items = guestbookPaginationItems(page, pageCount)

  return (
    <nav className={styles.pagination} aria-label="Páginas del tablón de firmas">
      <button
        type="button"
        className={styles.pageStep}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1 || isPending}
      >
        <span aria-hidden="true">←</span> Más recientes
      </button>

      <ol className={styles.pageList}>
        {items.map((item, index) =>
          item === "gap" ? (
            <li key={`gap-${index}`} className={styles.pageGap} aria-hidden="true">
              …
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                className={styles.pageNumber}
                onClick={() => onPageChange(item)}
                aria-current={item === page ? "page" : undefined}
                aria-label={`Página ${item}`}
                disabled={isPending}
              >
                {item}
              </button>
            </li>
          ),
        )}
      </ol>

      <button
        type="button"
        className={styles.pageStep}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pageCount || isPending}
      >
        Más antiguas <span aria-hidden="true">→</span>
      </button>

      <p className={styles.pageStatus} aria-live="polite">
        Página {page} de {pageCount} · {total} {total === 1 ? "firma" : "firmas"}
      </p>
    </nav>
  )
}
