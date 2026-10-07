"use client"

import {
  Armchair,
  ArrowLeft,
  ArrowRight,
  Download,
  Hash,
  IdCard,
  Loader2,
  Minus,
  PenLine,
  Plus,
  Signpost,
  Trash2,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react"
import { useId, useState, type ReactNode } from "react"

import { useDemoState } from "@/core/demo/use-demo-state"
import { loadSignageDataAction } from "@/domains/guests/adapters/next/signage-actions"
import { exportSeatingPdf } from "@/domains/guests/adapters/next/components/export-seating-pdf"
import {
  exportMariaDanielaSeatingPdf,
  type MariaDanielaSeatingPdfTheme,
} from "@/domains/guests/adapters/next/components/export-maria-daniela-seating-pdf"
import { exportMariaDanielaPlaceCardsPdf } from "@/domains/guests/adapters/next/components/export-maria-daniela-place-cards-pdf"
import { exportMariaDanielaTableSignsPdf } from "@/domains/guests/adapters/next/components/export-maria-daniela-table-signs-pdf"
import { exportMariaDanielaMiscSignsPdf } from "@/domains/guests/adapters/next/components/export-maria-daniela-misc-signs-pdf"
import { exportMariaDanielaMiscSignsDocx } from "@/domains/guests/adapters/next/components/export-maria-daniela-misc-signs-docx"
import type {
  MiscSign,
  MiscSignArrow,
} from "@/domains/guests/adapters/next/components/maria-daniela-misc-signs-render"
import { exportMariaDanielaMenuPdf } from "@/domains/guests/adapters/next/components/export-maria-daniela-menu-pdf"
import {
  INITIAL_MENU_COURSES,
  MenuEditorDialog,
  type MenuCourseDraft,
} from "@/domains/guests/adapters/next/components/menu-editor-dialog"
import type {
  InvitationPartyDto,
  InvitationPartyGuestDto,
} from "@/domains/guests/application/dtos/invitation-party.dto"
import type { TableDto } from "@/domains/guests/application/dtos/table.dto"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { cn } from "@/shared/lib/utils"

const THEMED_ONLY_NOTE = "Disponible con la plantilla María Daniela."
const MAX_MISC_SIGN_LENGTH = 60

const ARROW_CHOICES: { value: MiscSignArrow; label: string; icon: LucideIcon }[] = [
  { value: "left", label: "Flecha a la izquierda", icon: ArrowLeft },
  { value: "none", label: "Sin flecha", icon: Minus },
  { value: "right", label: "Flecha a la derecha", icon: ArrowRight },
]

interface SignageData {
  tables: TableDto[]
  confirmed: InvitationPartyGuestDto[]
}

interface ExportOption {
  id: string
  label: string
  detail: string
  run: (data: SignageData) => Promise<void>
}

export function SignageView({
  seatingPdfTheme,
  placeCardsWebsiteUrl,
}: {
  seatingPdfTheme: MariaDanielaSeatingPdfTheme | null
  placeCardsWebsiteUrl: string | null
}) {
  // En la demo, si ya se ha montado algo en la pantalla de invitados (mismos
  // espacios de nombres), se imprime eso en vez de lo guardado en servidor.
  const [demoParties] = useDemoState<InvitationPartyDto[] | null>("guest-parties", null)
  const [demoTables] = useDemoState<TableDto[] | null>("guest-tables", null)
  const [exportingId, setExportingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // El menú escrito solo vive mientras la pantalla está abierta, como los
  // carteles varios, pero sobrevive a cerrar y reabrir el editor.
  const [menuCourses, setMenuCourses] = useState<MenuCourseDraft[]>(INITIAL_MENU_COURSES)
  const [isMenuEditorOpen, setIsMenuEditorOpen] = useState(false)

  // Invitados y mesas se piden al generar cada PDF: abrir la pantalla no
  // cuesta nada y lo impreso refleja siempre los últimos cambios.
  async function loadData(): Promise<SignageData> {
    const loaded =
      demoParties && demoTables
        ? { parties: demoParties, tables: demoTables }
        : await loadSignageDataAction()

    return {
      tables: demoTables ?? loaded.tables,
      confirmed: (demoParties ?? loaded.parties)
        .flatMap((party) => party.guests)
        .filter((guest) => guest.rsvp === "Confirmado"),
    }
  }

  async function runTask(id: string, task: () => Promise<void>) {
    setExportingId(id)
    setError(null)

    try {
      await task()
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "No se pudo generar el PDF.",
      )
    } finally {
      setExportingId(null)
    }
  }

  function runExport(option: ExportOption) {
    return runTask(option.id, async () => option.run(await loadData()))
  }

  function runStandaloneExport(option: ExportOption) {
    return runTask(option.id, () => option.run({ tables: [], confirmed: [] }))
  }

  const seatingOptions: ExportOption[] = seatingPdfTheme
    ? [
        {
          id: "seating-a5",
          label: "A5",
          detail: "Un cartel por hoja",
          run: ({ tables, confirmed }) =>
            exportMariaDanielaSeatingPdf(tables, confirmed, seatingPdfTheme, "a5"),
        },
        {
          id: "seating-a6",
          label: "A6",
          detail: "Un cartel por hoja",
          run: ({ tables, confirmed }) =>
            exportMariaDanielaSeatingPdf(tables, confirmed, seatingPdfTheme, "a6"),
        },
        {
          id: "seating-a4-2xa5",
          label: "A4 (A5×2)",
          detail: "Dos carteles por hoja",
          run: ({ tables, confirmed }) =>
            exportMariaDanielaSeatingPdf(tables, confirmed, seatingPdfTheme, "a4-2xa5"),
        },
        {
          id: "seating-a4-4xa6",
          label: "A4 (A6×4)",
          detail: "Cuatro carteles por hoja",
          run: ({ tables, confirmed }) =>
            exportMariaDanielaSeatingPdf(tables, confirmed, seatingPdfTheme, "a4-4xa6"),
        },
      ]
    : [
        {
          id: "seating-list",
          label: "A4",
          detail: "Listado de mesas e invitados",
          run: ({ tables, confirmed }) => exportSeatingPdf(tables, confirmed),
        },
      ]

  const placeCardOptions: ExportOption[] = placeCardsWebsiteUrl
    ? [
        {
          id: "place-cards-a6",
          label: "A6",
          detail: "Una tarjeta por hoja",
          run: ({ tables, confirmed }) =>
            exportMariaDanielaPlaceCardsPdf(tables, confirmed, placeCardsWebsiteUrl, "a6"),
        },
        {
          id: "place-cards-a4",
          label: "A4 (A6×4)",
          detail: "Cuatro tarjetas por hoja",
          run: ({ tables, confirmed }) =>
            exportMariaDanielaPlaceCardsPdf(tables, confirmed, placeCardsWebsiteUrl, "a4"),
        },
      ]
    : []

  const tableSignOptions: ExportOption[] = seatingPdfTheme
    ? [
        {
          id: "table-signs-a4",
          label: "A4",
          detail: "Un cartel por hoja",
          run: ({ tables, confirmed }) =>
            exportMariaDanielaTableSignsPdf(tables, confirmed, seatingPdfTheme),
        },
      ]
    : []

  // La minuta en blanco no necesita mesas ni invitados.
  const blankMenuOptions: ExportOption[] = seatingPdfTheme
    ? [
        {
          id: "menu-blank-a4",
          label: "A4",
          detail: "Una por hoja",
          run: () => exportMariaDanielaMenuPdf(null, seatingPdfTheme, "a4"),
        },
        {
          id: "menu-blank-a5",
          label: "A5",
          detail: "Una por hoja",
          run: () => exportMariaDanielaMenuPdf(null, seatingPdfTheme, "a5"),
        },
        {
          id: "menu-blank-a4-2xa5",
          label: "A4 (A5×2)",
          detail: "Dos por hoja",
          run: () => exportMariaDanielaMenuPdf(null, seatingPdfTheme, "a4-2xa5"),
        },
      ]
    : []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Cartelería</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Todo lo que se imprime para el banquete, listo en PDF. Solo salen los
          invitados confirmados que ya tienen mesa.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <SignageCard
          icon={Armchair}
          title="Seating"
          description="Un cartel por mesa con el nombre de la mesa y la lista de quienes se sientan en ella."
        >
          <ExportButtons
            options={seatingOptions}
            exportingId={exportingId}
            onExport={runExport}
          />
        </SignageCard>

        <SignageCard
          icon={IdCard}
          title="Marcasitios"
          description="Tarjeta plegable con el nombre de cada invitado sentado y un QR a la web de la boda."
        >
          {placeCardOptions.length ? (
            <ExportButtons
              options={placeCardOptions}
              exportingId={exportingId}
              onExport={runExport}
            />
          ) : (
            <UnavailableNote>{THEMED_ONLY_NOTE}</UnavailableNote>
          )}
        </SignageCard>

        <SignageCard
          icon={Hash}
          title="Mesario"
          description="Número grande para cada mesa con invitados, acompañado de una frase."
        >
          {tableSignOptions.length ? (
            <ExportButtons
              options={tableSignOptions}
              exportingId={exportingId}
              onExport={runExport}
            />
          ) : (
            <UnavailableNote>{THEMED_ONLY_NOTE}</UnavailableNote>
          )}
        </SignageCard>

        <SignageCard
          icon={Signpost}
          title="Cartelería varia"
          description="A4 apaisado con el diseño de vuestra plantilla: escribid una frase o una palabra y, debajo, una flecha grande hacia la izquierda o hacia la derecha."
        >
          {seatingPdfTheme ? (
            <MiscSignsEditor
              formats={[
                {
                  id: "misc-signs-pdf",
                  label: "PDF",
                  run: (signs) => exportMariaDanielaMiscSignsPdf(signs, seatingPdfTheme),
                },
                {
                  id: "misc-signs-docx",
                  label: "Word",
                  run: (signs) => exportMariaDanielaMiscSignsDocx(signs, seatingPdfTheme),
                },
              ]}
              exportingId={exportingId}
              onExport={runStandaloneExport}
            />
          ) : (
            <UnavailableNote>{THEMED_ONLY_NOTE}</UnavailableNote>
          )}
        </SignageCard>

        <SignageCard
          icon={UtensilsCrossed}
          title="Minuta"
          description="El menú del banquete con el diseño de vuestra plantilla. Imprimidla en blanco para escribirlo a mano o escribidlo aquí."
        >
          {seatingPdfTheme ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">En blanco</p>
                <ExportButtons
                  options={blankMenuOptions}
                  exportingId={exportingId}
                  onExport={runStandaloneExport}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Con el menú escrito</p>
                <button
                  type="button"
                  onClick={() => setIsMenuEditorOpen(true)}
                  disabled={exportingId !== null}
                  className="inline-flex min-w-36 items-center gap-3 rounded-lg border border-border bg-background px-4 py-2.5 text-left transition-colors cursor-pointer hover:bg-secondary/50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <PenLine className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="leading-tight">
                    <span className="block text-sm font-medium text-foreground">
                      Escribir el menú
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      A4 o A5, con vista previa
                    </span>
                  </span>
                </button>
              </div>
              <MenuEditorDialog
                open={isMenuEditorOpen}
                onOpenChange={setIsMenuEditorOpen}
                courses={menuCourses}
                onCoursesChange={setMenuCourses}
                theme={seatingPdfTheme}
              />
            </div>
          ) : (
            <UnavailableNote>{THEMED_ONLY_NOTE}</UnavailableNote>
          )}
        </SignageCard>
      </div>
    </div>
  )
}

function SignageCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-xl text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-pretty text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-auto">{children}</div>
    </section>
  )
}

function ExportButtons({
  options,
  exportingId,
  onExport,
}: {
  options: ExportOption[]
  exportingId: string | null
  onExport: (option: ExportOption) => Promise<void>
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isExporting = exportingId === option.id

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => void onExport(option)}
            disabled={exportingId !== null}
            aria-busy={isExporting}
            className="inline-flex min-w-36 flex-1 items-center gap-3 rounded-lg border border-border bg-background px-4 py-2.5 text-left transition-colors cursor-pointer hover:bg-secondary/50 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className="leading-tight">
              <span className="block text-sm font-medium text-foreground">
                {isExporting ? "Generando…" : option.label}
              </span>
              <span className="block text-xs text-muted-foreground">{option.detail}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

interface MiscSignDraft extends MiscSign {
  key: number
}

interface MiscSignsFormat {
  id: string
  label: string
  run: (signs: MiscSign[]) => Promise<void>
}

// Los carteles varios no dependen de mesas ni invitados: se escriben aquí y
// solo viven mientras la pantalla está abierta.
function MiscSignsEditor({
  formats,
  exportingId,
  onExport,
}: {
  formats: MiscSignsFormat[]
  exportingId: string | null
  onExport: (option: ExportOption) => Promise<void>
}) {
  const idPrefix = useId()
  const [nextKey, setNextKey] = useState(1)
  const [signs, setSigns] = useState<MiscSignDraft[]>([
    { key: 0, text: "", arrow: "right" },
  ])
  const countLabel = signs.length === 1 ? "1 cartel" : `${signs.length} carteles`
  const options: ExportOption[] = formats.map((format) => ({
    id: format.id,
    label: format.label,
    detail: `A4 apaisado · ${countLabel}`,
    run: () => format.run(signs),
  }))

  function updateSign(key: number, patch: Partial<MiscSign>) {
    setSigns((current) =>
      current.map((sign) => (sign.key === key ? { ...sign, ...patch } : sign)),
    )
  }

  function addSign() {
    setSigns((current) => [...current, { key: nextKey, text: "", arrow: "right" }])
    setNextKey((key) => key + 1)
  }

  function removeSign(key: number) {
    setSigns((current) => current.filter((sign) => sign.key !== key))
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {signs.map((sign, index) => {
          const inputId = `${idPrefix}-sign-${sign.key}`

          return (
            <li key={sign.key} className="flex items-center gap-2">
              <label htmlFor={inputId} className="sr-only">
                Texto del cartel {index + 1}
              </label>
              <Input
                id={inputId}
                value={sign.text}
                maxLength={MAX_MISC_SIGN_LENGTH}
                placeholder="Escribid el texto del cartel"
                onChange={(event) => updateSign(sign.key, { text: event.target.value })}
                className="h-9 flex-1"
              />
              <div
                role="radiogroup"
                aria-label={`Flecha del cartel ${index + 1}`}
                className="flex shrink-0 rounded-lg border border-border p-0.5"
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
                        "flex h-7 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground",
                        selected && "bg-secondary text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  )
                })}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Quitar cartel ${index + 1}`}
                disabled={signs.length === 1}
                onClick={() => removeSign(sign.key)}
              >
                <Trash2 />
              </Button>
            </li>
          )
        })}
      </ul>

      <Button type="button" variant="outline" onClick={addSign}>
        <Plus />
        Añadir cartel
      </Button>

      <ExportButtons options={options} exportingId={exportingId} onExport={onExport} />
    </div>
  )
}

function UnavailableNote({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>
}
