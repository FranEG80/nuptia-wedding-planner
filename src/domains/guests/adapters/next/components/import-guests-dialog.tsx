"use client"

import { Dialog } from "@base-ui/react/dialog"
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Loader2,
  Upload,
  X,
  XCircle,
} from "lucide-react"
import { useRef, useState } from "react"

import { createInvitationPartyAction } from "@/domains/guests/adapters/next/actions"
import { buildDemoInvitationParty } from "@/domains/guests/adapters/next/components/build-demo-invitation-party"
import { downloadGuestImportTemplate } from "@/domains/guests/adapters/next/components/guest-import-template"
import {
  parseGuestImportRows,
  type GuestImportParseResult,
} from "@/domains/guests/application/guest-import"
import type { InvitationPartyDto } from "@/domains/guests/application/dtos/invitation-party.dto"

export function ImportGuestsDialog({
  open,
  onOpenChange,
  parties,
  isDemo,
  onImported,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  parties: InvitationPartyDto[]
  isDemo: boolean
  onImported: (newParties: InvitationPartyDto[]) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [parseResult, setParseResult] = useState<GuestImportParseResult | null>(null)
  const [importSummary, setImportSummary] = useState<string | null>(null)

  function reset() {
    setFileName(null)
    setParseError(null)
    setParseResult(null)
    setImportSummary(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setFileName(file.name)
    setParseError(null)
    setParseResult(null)
    setImportSummary(null)
    setIsParsing(true)

    try {
      const XLSX = await import("xlsx")
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: "array" })
      const sheetName = workbook.SheetNames[0]

      if (!sheetName) {
        setParseError("El archivo no tiene hojas con datos.")
        return
      }

      const sheet = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      })

      if (rows.length === 0) {
        setParseError("El archivo no tiene filas de datos bajo la cabecera.")
        return
      }

      const existingEmails = new Set(
        parties.flatMap((party) =>
          party.guests
            .map((guest) => guest.email?.trim().toLowerCase())
            .filter((email): email is string => Boolean(email)),
        ),
      )

      setParseResult(parseGuestImportRows(rows, { existingEmails }))
    } catch {
      setParseError(
        "No se pudo leer el archivo. Comprueba que sea un .xlsx, .csv o .ods válido.",
      )
    } finally {
      setIsParsing(false)
    }
  }

  async function handleImport() {
    if (!parseResult || parseResult.parties.length === 0) {
      return
    }

    setIsImporting(true)

    if (isDemo) {
      const created = parseResult.parties.map(buildDemoInvitationParty)
      onImported(created)
      setImportSummary(`Se importaron ${created.length} invitaciones.`)
      setIsImporting(false)
      return
    }

    const created: InvitationPartyDto[] = []
    let failed = 0

    for (const input of parseResult.parties) {
      try {
        const party = await createInvitationPartyAction(input)

        if (party) {
          created.push(party)
        } else {
          failed += 1
        }
      } catch {
        failed += 1
      }
    }

    onImported(created)
    setImportSummary(
      failed > 0
        ? `Se importaron ${created.length} invitaciones. ${failed} no se pudieron guardar.`
        : `Se importaron ${created.length} invitaciones.`,
    )
    setIsImporting(false)
  }

  const okRows = parseResult?.rows.filter((row) => row.status === "ok") ?? []
  const warningRows = parseResult?.rows.filter((row) => row.status === "warning") ?? []
  const errorRows = parseResult?.rows.filter((row) => row.status === "error") ?? []

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) {
          reset()
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
          <Dialog.Popup className="relative my-auto w-full max-w-2xl rounded-3xl border border-border bg-card p-5 text-foreground shadow-2xl outline-none transition-all data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 sm:p-7">
            <div className="pr-12">
              <Dialog.Title className="font-serif text-2xl">
                Importar invitados
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm leading-6 text-muted-foreground">
                Sube un Excel, Google Sheets exportado o una hoja de OpenOffice
                (.xlsx, .csv, .ods) con tu lista de invitados.
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Cerrar"
              className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>

            <button
              type="button"
              onClick={() => downloadGuestImportTemplate()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:border-accent hover:text-foreground"
            >
              <Download className="h-4 w-4" />
              Descargar plantilla vacía
            </button>

            <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background/50 px-4 py-3 text-sm hover:border-accent">
              <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate">
                {fileName ?? "Selecciona tu archivo de invitados..."}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.ods,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.oasis.opendocument.spreadsheet,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {isParsing ? (
              <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Leyendo archivo...
              </p>
            ) : null}

            {parseError ? (
              <p
                className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                role="alert"
              >
                {parseError}
              </p>
            ) : null}

            {parseResult ? (
              <div className="mt-5 space-y-3">
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="inline-flex items-center gap-1.5 text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {okRows.length} listas
                  </span>
                  {warningRows.length > 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-foreground">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      {warningRows.length} con aviso
                    </span>
                  ) : null}
                  {errorRows.length > 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-foreground">
                      <XCircle className="h-4 w-4 text-destructive" />
                      {errorRows.length} con error
                    </span>
                  ) : null}
                </div>

                <div className="max-h-56 overflow-y-auto rounded-xl border border-border">
                  {parseResult.rows.map((row, index) => (
                    <div
                      key={`${row.rowNumber}-${index}`}
                      className="flex items-start gap-2 border-b border-border/60 px-3 py-2 text-xs last:border-b-0"
                    >
                      {row.status === "ok" ? (
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      ) : row.status === "warning" ? (
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                      ) : (
                        <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                      )}
                      <span className="text-muted-foreground">
                        Fila {row.rowNumber}: {row.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {importSummary ? (
              <p className="mt-4 rounded-xl border border-emerald-600/20 bg-emerald-600/10 px-4 py-3 text-sm text-foreground">
                {importSummary}
              </p>
            ) : null}

            <div className="mt-6 flex justify-end gap-3">
              <Dialog.Close className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-secondary">
                Cerrar
              </Dialog.Close>
              <button
                type="button"
                onClick={handleImport}
                disabled={!parseResult || parseResult.parties.length === 0 || isImporting}
                className="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {isImporting
                  ? "Importando..."
                  : `Importar ${parseResult?.parties.length ?? 0} invitaciones`}
              </button>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
