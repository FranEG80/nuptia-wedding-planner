"use client"

import { Dialog } from "@base-ui/react/dialog"
import {
  ArrowLeft,
  ArrowRight,
  Download,
  FileText,
  Loader2,
  Minus,
  Plus,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react"
import { useId, useRef, useState } from "react"

import { exportMariaDanielaMiscSignsDocx } from "@/domains/guests/adapters/next/components/export-maria-daniela-misc-signs-docx"
import { exportMariaDanielaMiscSignsPdf } from "@/domains/guests/adapters/next/components/export-maria-daniela-misc-signs-pdf"
import type {
  MariaDanielaMiscSignsTheme,
  MiscSign,
  MiscSignArrow,
} from "@/domains/guests/adapters/next/components/maria-daniela-misc-signs-render"
import { cn } from "@/shared/lib/utils"

export interface MiscSignDraft extends MiscSign {
  key: number
}

export const INITIAL_MISC_SIGNS: MiscSignDraft[] = [{ key: 0, text: "", arrow: "right" }]

const MAX_MISC_SIGN_LENGTH = 60

const ARROW_CHOICES: { value: MiscSignArrow; label: string; icon: LucideIcon }[] = [
  { value: "left", label: "Flecha a la izquierda", icon: ArrowLeft },
  { value: "none", label: "Sin flecha", icon: Minus },
  { value: "right", label: "Flecha a la derecha", icon: ArrowRight },
]

type ExportFormat = "pdf" | "docx"

// Los carteles varios no dependen de mesas ni invitados: se escriben aquí y
// solo viven mientras la pantalla está abierta.
export function MiscSignsDialog({
  open,
  onOpenChange,
  signs,
  onSignsChange,
  theme,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  signs: MiscSignDraft[]
  onSignsChange: (signs: MiscSignDraft[]) => void
  theme: MariaDanielaMiscSignsTheme
}) {
  const idPrefix = useId()
  // Al abrir, el foco va al primer cartel para escribir directamente.
  const firstInputRef = useRef<HTMLInputElement>(null)
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null)
  const [error, setError] = useState<string | null>(null)
  const countLabel = signs.length === 1 ? "1 cartel" : `${signs.length} carteles`

  function updateSign(key: number, patch: Partial<MiscSign>) {
    setError(null)
    onSignsChange(signs.map((sign) => (sign.key === key ? { ...sign, ...patch } : sign)))
  }

  function addSign() {
    const nextKey = Math.max(-1, ...signs.map((sign) => sign.key)) + 1
    onSignsChange([...signs, { key: nextKey, text: "", arrow: "right" }])
  }

  function removeSign(key: number) {
    onSignsChange(signs.filter((sign) => sign.key !== key))
  }

  async function handleExport(format: ExportFormat) {
    setExportingFormat(format)
    setError(null)

    try {
      if (format === "pdf") {
        await exportMariaDanielaMiscSignsPdf(signs, theme)
      } else {
        await exportMariaDanielaMiscSignsDocx(signs, theme)
      }
    } catch (exportError) {
      setError(
        exportError instanceof Error ? exportError.message : "No se pudo generar el archivo.",
      )
    } finally {
      setExportingFormat(null)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
          <Dialog.Popup
            initialFocus={firstInputRef}
            className="relative my-auto w-full max-w-2xl rounded-3xl border border-border bg-card p-5 text-foreground shadow-2xl outline-none transition-all data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 sm:p-7">
            <div className="pr-12">
              <Dialog.Title className="font-serif text-2xl">Carteles varios</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-pretty text-muted-foreground">
                Un A4 apaisado por cartel: una frase o una palabra y, debajo, una flecha
                grande hacia donde haya que ir.
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Cerrar"
              className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>

            <ol className="mt-6 space-y-2">
              {signs.map((sign, index) => {
                const inputId = `${idPrefix}-sign-${sign.key}`

                return (
                  <li
                    key={sign.key}
                    className="flex items-center gap-2 rounded-2xl border border-border bg-background p-2"
                  >
                    <span
                      aria-hidden
                      className="w-6 shrink-0 text-center text-xs tabular-nums text-muted-foreground"
                    >
                      {index + 1}
                    </span>
                    <label htmlFor={inputId} className="sr-only">
                      Texto del cartel {index + 1}
                    </label>
                    <input
                      ref={index === 0 ? firstInputRef : undefined}
                      id={inputId}
                      value={sign.text}
                      maxLength={MAX_MISC_SIGN_LENGTH}
                      placeholder="Ceremonia, Aseos, Photocall…"
                      onChange={(event) => updateSign(sign.key, { text: event.target.value })}
                      className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-card px-3 font-serif text-lg outline-none placeholder:font-sans placeholder:text-sm focus:border-accent"
                    />
                    <div
                      role="radiogroup"
                      aria-label={`Flecha del cartel ${index + 1}`}
                      className="flex shrink-0 rounded-xl border border-border bg-card p-0.5"
                    >
                      {ARROW_CHOICES.map((choice) => {
                        const Icon = choice.icon
                        const selected = sign.arrow === choice.value

                        return (
                          <button
                            key={choice.value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            aria-label={choice.label}
                            title={choice.label}
                            onClick={() => updateSign(sign.key, { arrow: choice.value })}
                            className={cn(
                              "grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-muted-foreground transition-colors hover:text-foreground",
                              selected && "bg-secondary text-foreground",
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </button>
                        )
                      })}
                    </div>
                    <button
                      type="button"
                      aria-label={`Quitar cartel ${index + 1}`}
                      disabled={signs.length === 1}
                      onClick={() => removeSign(sign.key)}
                      className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                )
              })}
            </ol>

            <button
              type="button"
              onClick={addSign}
              className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-4 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
              Añadir cartel
            </button>

            {error ? (
              <p
                role="alert"
                className="mt-5 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive"
              >
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
              <p className="text-sm text-muted-foreground">A4 apaisado · {countLabel}</p>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleExport("docx")}
                  disabled={exportingFormat !== null}
                  aria-busy={exportingFormat === "docx"}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {exportingFormat === "docx" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  {exportingFormat === "docx" ? "Generando…" : "Word"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleExport("pdf")}
                  disabled={exportingFormat !== null}
                  aria-busy={exportingFormat === "pdf"}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {exportingFormat === "pdf" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {exportingFormat === "pdf" ? "Generando…" : "Descargar PDF"}
                </button>
              </div>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
