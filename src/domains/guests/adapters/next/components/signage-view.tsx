"use client"

import {
  Armchair,
  Download,
  Hash,
  IdCard,
  Loader2,
  Signpost,
  type LucideIcon,
} from "lucide-react"
import { useState, type ReactNode } from "react"

import { useDemoState } from "@/core/demo/use-demo-state"
import { loadSignageDataAction } from "@/domains/guests/adapters/next/signage-actions"
import { exportSeatingPdf } from "@/domains/guests/adapters/next/components/export-seating-pdf"
import {
  exportMariaDanielaSeatingPdf,
  type MariaDanielaSeatingPdfTheme,
} from "@/domains/guests/adapters/next/components/export-maria-daniela-seating-pdf"
import { exportMariaDanielaPlaceCardsPdf } from "@/domains/guests/adapters/next/components/export-maria-daniela-place-cards-pdf"
import { exportMariaDanielaTableSignsPdf } from "@/domains/guests/adapters/next/components/export-maria-daniela-table-signs-pdf"
import type {
  InvitationPartyDto,
  InvitationPartyGuestDto,
} from "@/domains/guests/application/dtos/invitation-party.dto"
import type { TableDto } from "@/domains/guests/application/dtos/table.dto"
import { cn } from "@/shared/lib/utils"

const THEMED_ONLY_NOTE = "Disponible con la plantilla María Daniela."

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

  async function runExport(option: ExportOption) {
    setExportingId(option.id)
    setError(null)

    try {
      await option.run(await loadData())
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

  const seatingOptions: ExportOption[] = seatingPdfTheme
    ? [
        {
          id: "seating-a5",
          label: "A5",
          detail: "148 × 210 mm",
          run: ({ tables, confirmed }) =>
            exportMariaDanielaSeatingPdf(tables, confirmed, seatingPdfTheme, "a5"),
        },
        {
          id: "seating-a6",
          label: "A6",
          detail: "105 × 148 mm",
          run: ({ tables, confirmed }) =>
            exportMariaDanielaSeatingPdf(tables, confirmed, seatingPdfTheme, "a6"),
        },
      ]
    : [
        {
          id: "seating-list",
          label: "Listado A4",
          detail: "Mesas e invitados en tabla",
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
          label: "A4",
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
          detail: "Número de mesa y frase",
          run: ({ tables, confirmed }) =>
            exportMariaDanielaTableSignsPdf(tables, confirmed, seatingPdfTheme),
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
          description="A4 apaisado con el diseño de vuestra plantilla: escribid una frase o una palabra y añadid una flecha grande a un lado."
          badge="Próximamente"
          muted
        >
          <UnavailableNote>Estamos preparándolo.</UnavailableNote>
        </SignageCard>
      </div>
    </div>
  )
}

function SignageCard({
  icon: Icon,
  title,
  description,
  badge,
  muted = false,
  children,
}: {
  icon: LucideIcon
  title: string
  description: string
  badge?: string
  muted?: boolean
  children: ReactNode
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm",
        muted && "bg-card/60 shadow-none",
      )}
    >
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-serif text-xl text-foreground">{title}</h2>
            {badge ? (
              <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                {badge}
              </span>
            ) : null}
          </div>
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

function UnavailableNote({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>
}
