"use client"

import { ArrowRight, Download, Loader2, PenLine } from "lucide-react"
import Link from "next/link"
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
import { hasPrintableMenu } from "@/domains/guests/adapters/next/components/export-maria-daniela-menu-pdf"
import {
  INITIAL_MENU_COURSES,
  MenuEditorDialog,
  type MenuCourseDraft,
} from "@/domains/guests/adapters/next/components/menu-editor-dialog"
import {
  INITIAL_MISC_SIGNS,
  MiscSignsDialog,
  type MiscSignDraft,
} from "@/domains/guests/adapters/next/components/misc-signs-dialog"
import type {
  InvitationPartyDto,
  InvitationPartyGuestDto,
} from "@/domains/guests/application/dtos/invitation-party.dto"
import type { TableDto } from "@/domains/guests/application/dtos/table.dto"
import { Button } from "@/shared/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import { cn } from "@/shared/lib/utils"

interface SignageData {
  tables: TableDto[]
  confirmed: InvitationPartyGuestDto[]
}

type SheetMotif =
  | "seating"
  | "seating-list"
  | "place-card"
  | "table-sign"
  | "menu"
  | "misc-sign"

// Hoja de papel tal como sale de la impresora: tamaño, orientación, cuántas
// piezas caben en ella y qué pieza es, para esbozar su contenido.
interface Sheet {
  motif: SheetMotif
  size: "a4" | "a5" | "a6"
  landscape?: boolean
  columns?: number
  rows?: number
}

interface PrintFormat {
  id: string
  label: string
  detail: string
  sheet: Sheet
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
  // Lo escrito en los editores solo vive mientras la pantalla está abierta,
  // pero sobrevive a cerrar y reabrir cada diálogo.
  const [menuCourses, setMenuCourses] = useState<MenuCourseDraft[]>(INITIAL_MENU_COURSES)
  const [isMenuEditorOpen, setIsMenuEditorOpen] = useState(false)
  const [miscSigns, setMiscSigns] = useState<MiscSignDraft[]>(INITIAL_MISC_SIGNS)
  const [isMiscSignsOpen, setIsMiscSignsOpen] = useState(false)

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

  async function runExport(format: PrintFormat) {
    setExportingId(format.id)
    setError(null)

    try {
      await format.run(await loadData())
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

  const seatingFormats: PrintFormat[] = seatingPdfTheme
    ? [
        {
          id: "seating-a5",
          label: "A5",
          detail: "Un cartel por hoja",
          sheet: { motif: "seating", size: "a5" },
          run: ({ tables, confirmed }) =>
            exportMariaDanielaSeatingPdf(tables, confirmed, seatingPdfTheme, "a5"),
        },
        {
          id: "seating-a6",
          label: "A6",
          detail: "Un cartel por hoja",
          sheet: { motif: "seating", size: "a6" },
          run: ({ tables, confirmed }) =>
            exportMariaDanielaSeatingPdf(tables, confirmed, seatingPdfTheme, "a6"),
        },
        {
          id: "seating-a4-2xa5",
          label: "A4 · 2 × A5",
          detail: "Dos carteles por hoja",
          sheet: { motif: "seating", size: "a4", landscape: true, columns: 2 },
          run: ({ tables, confirmed }) =>
            exportMariaDanielaSeatingPdf(tables, confirmed, seatingPdfTheme, "a4-2xa5"),
        },
        {
          id: "seating-a4-4xa6",
          label: "A4 · 4 × A6",
          detail: "Cuatro carteles por hoja",
          sheet: { motif: "seating", size: "a4", columns: 2, rows: 2 },
          run: ({ tables, confirmed }) =>
            exportMariaDanielaSeatingPdf(tables, confirmed, seatingPdfTheme, "a4-4xa6"),
        },
      ]
    : [
        {
          id: "seating-list",
          label: "A4",
          detail: "Listado de mesas e invitados",
          sheet: { motif: "seating-list", size: "a4" },
          run: ({ tables, confirmed }) => exportSeatingPdf(tables, confirmed),
        },
      ]

  const placeCardFormats: PrintFormat[] = placeCardsWebsiteUrl
    ? [
        {
          id: "place-cards-a6",
          label: "A6",
          detail: "Una tarjeta por hoja",
          sheet: { motif: "place-card", size: "a6", landscape: true },
          run: ({ tables, confirmed }) =>
            exportMariaDanielaPlaceCardsPdf(tables, confirmed, placeCardsWebsiteUrl, "a6"),
        },
        {
          id: "place-cards-a4",
          label: "A4 · 4 × A6",
          detail: "Cuatro tarjetas por hoja",
          sheet: { motif: "place-card", size: "a4", landscape: true, columns: 2, rows: 2 },
          run: ({ tables, confirmed }) =>
            exportMariaDanielaPlaceCardsPdf(tables, confirmed, placeCardsWebsiteUrl, "a4"),
        },
      ]
    : []

  const tableSignFormats: PrintFormat[] = seatingPdfTheme
    ? [
        {
          id: "table-signs-a4",
          label: "A4",
          detail: "Un cartel por hoja",
          sheet: { motif: "table-sign", size: "a4" },
          run: ({ tables, confirmed }) =>
            exportMariaDanielaTableSignsPdf(tables, confirmed, seatingPdfTheme),
        },
      ]
    : []

  const writtenSigns = miscSigns.filter((sign) => sign.text.trim()).length

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-serif text-3xl text-foreground">Cartelería</h1>
        <p className="mt-1 max-w-prose text-sm text-pretty text-muted-foreground">
          Todo lo que se imprime para el banquete, listo en PDF. Solo salen los
          invitados confirmados que ya tienen mesa.
        </p>
      </header>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ExportPiece
          title="Seating"
          description={
            seatingPdfTheme
              ? "Un cartel por mesa con quienes se sientan en ella."
              : "Listado de todas las mesas con sus invitados."
          }
          formats={seatingFormats}
          exportingId={exportingId}
          onExport={runExport}
        />

        {seatingPdfTheme && placeCardFormats.length ? (
          <ExportPiece
            title="Marcasitios"
            description="Tarjeta plegable con cada nombre y un QR a vuestra web."
            formats={placeCardFormats}
            exportingId={exportingId}
            onExport={runExport}
          />
        ) : null}

        {seatingPdfTheme ? (
          <>
            <ExportPiece
              title="Mesario"
              description="El número de cada mesa en grande, con su frase."
              formats={tableSignFormats}
              exportingId={exportingId}
              onExport={runExport}
            />

            <PieceCard
              title="Minuta"
              description="El menú del banquete. Escribidlo aquí o descargadla en blanco."
              sheet={{ motif: "menu", size: "a4" }}
            >
              {hasPrintableMenu(menuCourses) ? <PieceStatus>Menú escrito</PieceStatus> : null}
              <Button
                size="lg"
                className="ml-auto px-3.5"
                disabled={exportingId !== null}
                onClick={() => setIsMenuEditorOpen(true)}
              >
                <PenLine />
                Escribir menú
              </Button>
            </PieceCard>

            <PieceCard
              title="Carteles varios"
              description="Una frase y una flecha grande para guiar por el salón."
              sheet={{ motif: "misc-sign", size: "a4", landscape: true }}
            >
              {writtenSigns > 0 ? (
                <PieceStatus>
                  {writtenSigns === 1 ? "1 cartel escrito" : `${writtenSigns} carteles escritos`}
                </PieceStatus>
              ) : null}
              <Button
                size="lg"
                className="ml-auto px-3.5"
                disabled={exportingId !== null}
                onClick={() => setIsMiscSignsOpen(true)}
              >
                <PenLine />
                Escribir carteles
              </Button>
            </PieceCard>

            <MenuEditorDialog
              open={isMenuEditorOpen}
              onOpenChange={setIsMenuEditorOpen}
              courses={menuCourses}
              onCoursesChange={setMenuCourses}
              theme={seatingPdfTheme}
            />
            <MiscSignsDialog
              open={isMiscSignsOpen}
              onOpenChange={setIsMiscSignsOpen}
              signs={miscSigns}
              onSignsChange={setMiscSigns}
              theme={seatingPdfTheme}
            />
          </>
        ) : (
          <div className="flex flex-col items-start justify-center gap-3 rounded-2xl border border-dashed border-border p-5 xl:col-span-2">
            <p className="max-w-prose text-sm text-pretty text-muted-foreground">
              Marcasitios, mesario, minuta y carteles varios se imprimen con el
              diseño de la plantilla María Daniela.
            </p>
            <Link
              href="/app/invitacion"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              Ver plantillas de invitación
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function PieceCard({
  title,
  description,
  sheet,
  sheetLabel,
  children,
}: {
  title: string
  description: string
  sheet: Sheet
  sheetLabel?: string
  children: ReactNode
}) {
  const titleId = useId()

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm"
    >
      <div className="flex items-start gap-4">
        <SheetGlyph sheet={sheet} label={sheetLabel} />
        <div className="min-w-0 flex-1 pt-1">
          <h2 id={titleId} className="font-serif text-xl text-foreground">
            {title}
          </h2>
          <p className="mt-1 text-sm text-pretty text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 pt-6">{children}</div>
    </section>
  )
}

function ExportPiece({
  title,
  description,
  formats,
  exportingId,
  onExport,
}: {
  title: string
  description: string
  formats: PrintFormat[]
  exportingId: string | null
  onExport: (format: PrintFormat) => Promise<void>
}) {
  const [selectedId, setSelectedId] = useState(formats[0].id)
  const selected = formats.find((format) => format.id === selectedId) ?? formats[0]
  const isExporting = exportingId === selected.id

  return (
    <PieceCard
      title={title}
      description={description}
      sheet={selected.sheet}
      sheetLabel={`${selected.label}: ${selected.detail.toLowerCase()}`}
    >
      {formats.length > 1 ? (
        <Select
          items={formats.map((format) => ({ value: format.id, label: format.label }))}
          value={selected.id}
          onValueChange={(value) => {
            if (value) setSelectedId(value)
          }}
        >
          <SelectTrigger aria-label={`Formato de ${title}`} className="h-9 min-w-0 px-3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="start" className="min-w-48">
            {formats.map((format) => (
              <SelectItem key={format.id} value={format.id} className="py-1.5">
                <span className="flex flex-col">
                  <span className="text-sm">{format.label}</span>
                  <span className="text-xs text-muted-foreground">{format.detail}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <PieceStatus>{selected.label}</PieceStatus>
      )}
      <Button
        size="lg"
        className="px-3.5"
        disabled={exportingId !== null}
        aria-busy={isExporting}
        onClick={() => void onExport(selected)}
      >
        {isExporting ? <Loader2 className="animate-spin" /> : <Download />}
        {isExporting ? "Generando…" : "Descargar"}
      </Button>
    </PieceCard>
  )
}

function PieceStatus({ children }: { children: ReactNode }) {
  return <span className="min-w-0 truncate text-sm text-muted-foreground">{children}</span>
}

// Lado largo de cada tamaño en píxeles; cada paso DIN divide entre √2.
const SHEET_LONG_SIDE: Record<Sheet["size"], number> = { a4: 44, a5: 31, a6: 22 }

// Pliego dibujado a escala: deja ver de un vistazo el tamaño, la orientación,
// cuántas piezas salen por hoja y un esbozo de qué lleva cada una.
function SheetGlyph({ sheet, label }: { sheet: Sheet; label?: string }) {
  const longSide = SHEET_LONG_SIDE[sheet.size]
  const shortSide = Math.round(longSide / Math.SQRT2)
  const width = sheet.landscape ? longSide : shortSide
  const height = sheet.landscape ? shortSide : longSide
  const columns = sheet.columns ?? 1
  const rows = sheet.rows ?? 1
  // Un marcasitio suelto se dibuja ya doblado, de pie: es como se reconoce.
  const isStandingPlaceCard = sheet.motif === "place-card" && columns * rows === 1

  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      title={label}
      className="grid size-14 shrink-0 place-items-center rounded-xl bg-muted"
    >
      {isStandingPlaceCard ? (
        <StandingPlaceCard />
      ) : (
        <span
          className="grid gap-px rounded-[2px] bg-foreground/20 p-px shadow-[0_1px_2px_oklch(0.27_0.02_256/0.12)]"
          style={{
            width,
            height,
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: columns * rows }, (_, index) => (
            <span
              key={index}
              className="flex flex-col items-center justify-center gap-[2px] overflow-hidden bg-card px-[12%]"
            >
              <SheetMotifSketch motif={sheet.motif} />
            </span>
          ))}
        </span>
      )}
    </span>
  )
}

// Trazos del esbozo: el rosa es lo que en papel va en acuarela o terracota
// (títulos, brochazos, flechas); el gris, el texto corrido.
const ACCENT_STROKE = "h-[3px] rounded-full bg-accent/70"
const TEXT_STROKE = "h-px rounded-full bg-foreground/25"

function SheetMotifSketch({ motif }: { motif: SheetMotif }) {
  switch (motif) {
    // Nombre de la mesa en el brochazo y, debajo, la lista de quienes se sientan.
    case "seating":
      return (
        <>
          <span className={cn(ACCENT_STROKE, "mb-[1px] w-3/4")} />
          <span className={cn(TEXT_STROKE, "w-1/2")} />
          <span className={cn(TEXT_STROKE, "w-2/3")} />
          <span className={cn(TEXT_STROKE, "w-1/2")} />
        </>
      )
    // Listado sin plantilla: bloques de mesa con sus invitados, alineados a la izquierda.
    case "seating-list":
      return (
        <span className="flex w-full flex-col gap-[2px]">
          {[0, 1].map((block) => (
            <span key={block} className="mb-[2px] flex flex-col gap-[2px] last:mb-0">
              <span className="h-[2px] w-1/2 rounded-full bg-foreground/45" />
              <span className={cn(TEXT_STROKE, "w-full")} />
              <span className={cn(TEXT_STROKE, "w-3/4")} />
            </span>
          ))}
        </span>
      )
    // "Mesa", el número en grande y la frase debajo.
    case "table-sign":
      return (
        <>
          <span className={cn(ACCENT_STROKE, "w-1/2")} />
          <span className="font-serif text-[15px] leading-none text-foreground/55">7</span>
          <span className={cn(TEXT_STROKE, "w-3/4")} />
          <span className={cn(TEXT_STROKE, "w-1/2")} />
        </>
      )
    // Cabecera "Menú" y los platos separados por filetes.
    case "menu":
      return (
        <>
          <span className={cn(ACCENT_STROKE, "mb-[2px] w-2/3")} />
          <span className={cn(TEXT_STROKE, "w-3/4")} />
          <span className={cn(TEXT_STROKE, "w-1/2")} />
          <span className="h-px w-[18%] bg-accent/70" />
          <span className={cn(TEXT_STROKE, "w-2/3")} />
          <span className={cn(TEXT_STROKE, "w-1/2")} />
          <span className="h-px w-[18%] bg-accent/70" />
          <span className={cn(TEXT_STROKE, "w-3/4")} />
        </>
      )
    // La frase en la aguada y, debajo, la flecha grande.
    case "misc-sign":
      return (
        <>
          <span className="mb-[1px] h-[4px] w-[70%] rounded-full bg-accent/70" />
          <svg viewBox="0 0 20 6" className="w-[66%] overflow-visible text-accent" fill="none">
            <path
              d="M1 3.2 Q10 2.4 18.5 3 M15.5 0.8 L18.8 3 L15.8 5.2"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </>
      )
    case "place-card":
      return <span className={cn(ACCENT_STROKE, "w-1/2")} />
  }
}

// Marcasitio doblado de pie, visto de tres cuartos: un prisma sin base. La
// cara delantera se inclina hacia la cumbrera con el nombre y, por el lateral
// abierto, se ve el triángulo que forman las dos caras.
function StandingPlaceCard() {
  return (
    <svg viewBox="0 0 44 28" className="w-11 overflow-visible" fill="none">
      {/* Sin base: el hueco entre las dos caras se rellena pero no se cierra. */}
      <path d="M31 24 L36 9 L40.5 21 Z" className="fill-secondary" />
      <path
        d="M36 9 L40.5 21"
        className="stroke-foreground/25"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M3 24 L31 24 L36 9 L8 9 Z"
        className="fill-card stroke-foreground/25"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path
        d="M15 16.5 L25 16.5"
        className="stroke-accent/70"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  )
}
