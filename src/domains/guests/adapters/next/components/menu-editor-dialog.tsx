"use client"

import { Dialog } from "@base-ui/react/dialog"
import { Download, Loader2, Plus, Trash2, X } from "lucide-react"
import { useEffect, useId, useState } from "react"

import {
  drawMariaDanielaMenuPreview,
  exportMariaDanielaMenuPdf,
  hasPrintableMenu,
  MENU_COURSE_DISHES_MAX_LENGTH,
  MENU_COURSE_TITLE_MAX_LENGTH,
  type MariaDanielaMenuTheme,
  type MenuCourse,
  type MenuPdfLayout,
} from "@/domains/guests/adapters/next/components/export-maria-daniela-menu-pdf"
import { cn } from "@/shared/lib/utils"

export interface MenuCourseDraft extends MenuCourse {
  key: number
}

export const INITIAL_MENU_COURSES: MenuCourseDraft[] = [
  { key: 0, title: "Entrantes", dishes: "" },
  { key: 1, title: "Corners", dishes: "" },
  { key: 2, title: "Plato principal", dishes: "" },
  { key: 3, title: "Postre", dishes: "" },
  { key: 4, title: "Bebidas", dishes: "" },
]

const DISH_PLACEHOLDERS = [
  "Jamón ibérico con pan de cristal\nCroquetas caseras de puchero",
  "Corner de quesos\nCorner de arroces",
  "Solomillo al Pedro Ximénez con patatas panaderas",
  "Tarta nupcial\nCafé y licores",
  "Vino tinto D.O. Ribera del Duero\nCerveza, refrescos y agua",
]

const FORMAT_CHOICES: { value: MenuPdfLayout; label: string; detail: string }[] = [
  { value: "a4", label: "A4", detail: "Una por hoja" },
  { value: "a5", label: "A5", detail: "Una por hoja" },
  { value: "a4-2xa5", label: "A4 (A5×2)", detail: "Dos por hoja" },
]

// Ancho de la vista previa en píxeles CSS; el alto sale de la proporción A4/A5.
const PREVIEW_WIDTH = 320
const PREVIEW_HEIGHT = Math.round((PREVIEW_WIDTH * 297) / 210)
// Doble resolución para que la letra se vea nítida en pantallas retina.
const PREVIEW_PIXEL_RATIO = 2

export function MenuEditorDialog({
  open,
  onOpenChange,
  courses,
  onCoursesChange,
  theme,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  courses: MenuCourseDraft[]
  onCoursesChange: (courses: MenuCourseDraft[]) => void
  theme: MariaDanielaMenuTheme
}) {
  const idPrefix = useId()
  // Callback ref: el canvas se monta con el portal del diálogo, después de
  // que este componente ya esté en pantalla.
  const [preview, setPreview] = useState<HTMLCanvasElement | null>(null)
  const [layout, setLayout] = useState<MenuPdfLayout>("a4")
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canExport = hasPrintableMenu(courses)

  // Se repinta en cada cambio del menú.
  useEffect(() => {
    if (!preview) {
      return
    }

    drawMariaDanielaMenuPreview(preview, courses, theme).catch(() => {
      // La vista previa es orientativa: si falla una acuarela, el PDF lo dirá.
    })
  }, [preview, courses, theme])

  function updateCourse(key: number, patch: Partial<MenuCourse>) {
    setError(null)
    onCoursesChange(
      courses.map((course) => (course.key === key ? { ...course, ...patch } : course)),
    )
  }

  function addCourse() {
    const nextKey = Math.max(-1, ...courses.map((course) => course.key)) + 1
    onCoursesChange([...courses, { key: nextKey, title: "", dishes: "" }])
  }

  function removeCourse(key: number) {
    onCoursesChange(courses.filter((course) => course.key !== key))
  }

  async function handleExport() {
    setIsExporting(true)
    setError(null)

    try {
      await exportMariaDanielaMenuPdf(courses, theme, layout)
    } catch (exportError) {
      setError(
        exportError instanceof Error ? exportError.message : "No se pudo generar el PDF.",
      )
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
          <Dialog.Popup className="relative my-auto w-full max-w-4xl rounded-3xl border border-border bg-card p-5 text-foreground shadow-2xl outline-none transition-all data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 sm:p-7">
            <div className="pr-12">
              <Dialog.Title className="font-serif text-2xl">Escribir el menú</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Un bloque por cada momento de la cena y un plato por línea.
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Cerrar"
              className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>

            <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-w-0 space-y-4">
                <ol className="space-y-3">
                  {courses.map((course, index) => {
                    const titleId = `${idPrefix}-title-${course.key}`
                    const dishesId = `${idPrefix}-dishes-${course.key}`

                    return (
                      <li
                        key={course.key}
                        className="rounded-2xl border border-border bg-background p-3"
                      >
                        <div className="flex items-center gap-2">
                          <label htmlFor={titleId} className="sr-only">
                            Título del bloque {index + 1}
                          </label>
                          <input
                            id={titleId}
                            value={course.title}
                            maxLength={MENU_COURSE_TITLE_MAX_LENGTH}
                            placeholder="Entrantes"
                            onChange={(event) =>
                              updateCourse(course.key, { title: event.target.value })
                            }
                            className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-card px-3 font-serif text-lg outline-none focus:border-accent"
                          />
                          <button
                            type="button"
                            aria-label={`Quitar bloque ${index + 1}`}
                            disabled={courses.length === 1}
                            onClick={() => removeCourse(course.key)}
                            className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <label htmlFor={dishesId} className="sr-only">
                          Platos del bloque {index + 1}, uno por línea
                        </label>
                        <textarea
                          id={dishesId}
                          value={course.dishes}
                          maxLength={MENU_COURSE_DISHES_MAX_LENGTH}
                          rows={3}
                          placeholder={DISH_PLACEHOLDERS[course.key] ?? "Un plato por línea"}
                          onChange={(event) =>
                            updateCourse(course.key, { dishes: event.target.value })
                          }
                          className="mt-2 w-full resize-y rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
                        />
                      </li>
                    )
                  })}
                </ol>

                <button
                  type="button"
                  onClick={addCourse}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-4 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <Plus className="h-4 w-4" />
                  Añadir bloque
                </button>
              </div>

              <div className="flex flex-col items-center gap-2 md:sticky md:top-0 md:self-start">
                <canvas
                  ref={setPreview}
                  width={PREVIEW_WIDTH * PREVIEW_PIXEL_RATIO}
                  height={PREVIEW_HEIGHT * PREVIEW_PIXEL_RATIO}
                  aria-label="Vista previa de la minuta"
                  role="img"
                  style={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }}
                  className="max-w-full rounded-md border border-border bg-[#fbf4ea] shadow-sm"
                />
                <p className="text-xs text-muted-foreground">Vista previa</p>
              </div>
            </div>

            {error ? (
              <p className="mt-5 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
              <div
                role="radiogroup"
                aria-label="Formato de la minuta"
                className="flex rounded-xl border border-border p-1"
              >
                {FORMAT_CHOICES.map((choice) => {
                  const selected = layout === choice.value

                  return (
                    <button
                      key={choice.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      title={choice.detail}
                      onClick={() => setLayout(choice.value)}
                      className={cn(
                        "cursor-pointer rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
                        selected && "bg-secondary font-medium text-foreground",
                      )}
                    >
                      {choice.label}
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-3">
                <Dialog.Close className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-secondary">
                  Cerrar
                </Dialog.Close>
                <button
                  type="button"
                  onClick={() => void handleExport()}
                  disabled={isExporting || !canExport}
                  aria-busy={isExporting}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isExporting ? "Generando…" : "Descargar PDF"}
                </button>
              </div>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
