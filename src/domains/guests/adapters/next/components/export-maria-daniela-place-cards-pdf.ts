import type { InvitationPartyGuestDto } from "@/domains/guests/application/dtos/invitation-party.dto"
import type { TableDto } from "@/domains/guests/application/dtos/table.dto"
import { seatedGuestsAtTable } from "@/domains/guests/domain/seating"
import { mariaDanielaAssets } from "@/domains/wedding-sites/adapters/next/components/maria-daniela-assets"

export type PlaceCardsPdfLayout = "a6" | "a4"

// Marcasitio: A6 apaisado doblado por la mitad en horizontal, como una
// tienda de campaña. Cada cara mide 148 × 52,5 mm; la de arriba va girada
// 180° para que, ya doblada, las dos se lean derechas.
const CARD_MM = { width: 148, height: 105 }
const A4_LANDSCAPE_MM = { width: 297, height: 210 }
const CARDS_PER_A4 = 4

// 300 ppp: calidad de imprenta sin disparar el peso del PDF.
const PIXELS_PER_MM = 300 / 25.4
const DECOR_OPACITY = 0.66
const PAPER_COLOR = "#fbf4ea"
const INK_COLOR = "#1c1712"
const SCRIPT_INK_COLOR = "#3a2a1f"
const ACCENT_COLOR = "#d5764d"
const CUT_LINE_COLOR = "#c9bfb2"
const QR_CARD_COLOR = "#ffffff"
const QR_CARD_BORDER_COLOR = "#e4d5c3"

const QR_CALL_TO_ACTION = "Escanéame"
const QR_INSTRUCTIONS =
  "Entra en nuestra web con tu número de teléfono y déjanos un mensaje y tus fotos de hoy"

interface Fonts {
  script: string
  serif: string
}

// Margen lateral del contenido para no pisar los pétalos de los cantos.
const CONTENT_INSET = 0.12

interface DecorImages {
  blobs: HTMLImageElement
  blobsAlternative: HTMLImageElement
}

interface Panel {
  width: number
  height: number
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.decoding = "async"
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`No se pudo cargar ${src}`))
    image.src = src
  })
}

// next/font registra las familias con nombres generados; las variables CSS
// del <html> son la única referencia estable para usarlas en el canvas.
function fontFamilyFromVariable(variable: string, fallback: string) {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim()

  return value ? `${value}, ${fallback}` : fallback
}

async function loadFonts(): Promise<Fonts> {
  const fonts = {
    script: fontFamilyFromVariable("--font-parisienne", "'Parisienne', cursive"),
    serif: fontFamilyFromVariable("--font-cormorant", "'Cormorant Garamond', serif"),
  }

  await Promise.all([
    document.fonts.load(`400 64px ${fonts.script}`),
    document.fonts.load(`400 64px ${fonts.serif}`),
    document.fonts.load(`600 64px ${fonts.serif}`),
  ])

  return fonts
}

// Coloca la imagen por su centro: los pétalos se sitúan respecto al doblez.
function drawImageCentered(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  center: { x: number; y: number; width: number; rotate: number },
) {
  const height = (center.width * image.naturalHeight) / image.naturalWidth

  ctx.save()
  ctx.translate(center.x, center.y)
  ctx.rotate((center.rotate * Math.PI) / 180)
  ctx.drawImage(image, -center.width / 2, -height / 2, center.width, height)
  ctx.restore()
}

// Pétalos pequeños pintados sobre la hoja entera, no por cara: el de la
// derecha cae justo en el doblez y, ya doblado, envuelve el canto sin cortes.
function drawSheetDecor(ctx: CanvasRenderingContext2D, images: DecorImages) {
  const { width, height } = ctx.canvas

  ctx.save()
  ctx.globalAlpha = DECOR_OPACITY
  drawImageCentered(ctx, images.blobs, {
    x: 0.97 * width,
    y: 0.5 * height,
    width: 0.22 * width,
    rotate: 40,
  })
  drawImageCentered(ctx, images.blobsAlternative, {
    x: 0.025 * width,
    y: 0.91 * height,
    width: 0.22 * width,
    rotate: 160,
  })
  drawImageCentered(ctx, images.blobsAlternative, {
    x: 0.025 * width,
    y: 0.08 * height,
    width: 0.2 * width,
    rotate: -24,
  })
  ctx.restore()
}

function setLetterSpacing(ctx: CanvasRenderingContext2D, value: string) {
  if ("letterSpacing" in ctx) {
    ctx.letterSpacing = value
  }
}

function wrapWords(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = []

  for (const word of text.trim().split(/\s+/)) {
    const current = lines.at(-1)
    const candidate = current ? `${current} ${word}` : word

    if (current && ctx.measureText(candidate).width > maxWidth) {
      lines.push(word)
    } else if (current) {
      lines[lines.length - 1] = candidate
    } else {
      lines.push(word)
    }
  }

  return lines
}

// Estrecha el ancho mientras no aparezcan más líneas, para que el párrafo
// quede compensado y sin una palabra suelta al final.
function wrapBalanced(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines = wrapWords(ctx, text, maxWidth)
  let balanced = lines
  let width = maxWidth

  while (width > maxWidth * 0.5) {
    width *= 0.97
    const candidate = wrapWords(ctx, text, width)

    if (candidate.length > lines.length) {
      break
    }

    balanced = candidate
  }

  return balanced
}

// Los nombres en mayúsculas quedan ilegibles en Parisienne: se pasan a
// "Nombre Apellido" sin tocar los que ya vienen bien escritos.
function toDisplayName(name: string) {
  
  const clean = name.trim().replace(/\s+/g, " ")

  if (clean !== clean.toLocaleUpperCase("es-ES")) {
    return clean
  }

  return clean
    .toLocaleLowerCase("es-ES")
    .replace(/(^|[\s-])(\p{L})/gu, (_, separator: string, letter: string) =>
      `${separator}${letter.toLocaleUpperCase("es-ES")}`,
    )
}

function displayUrl(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "")
}

// Coloca el origen en la esquina de la cara (arriba = doblez) y recorta
// para que las acuarelas no invadan la otra mitad.
function withPanel(
  ctx: CanvasRenderingContext2D,
  panel: Panel,
  placement: "bottom" | "top",
  draw: () => void,
) {
  ctx.save()

  if (placement === "bottom") {
    ctx.translate(0, panel.height)
  } else {
    ctx.translate(panel.width, panel.height)
    ctx.rotate(Math.PI)
  }

  ctx.beginPath()
  ctx.rect(0, 0, panel.width, panel.height)
  ctx.clip()
  draw()
  ctx.restore()
}

interface NameLayout {
  lines: string[]
  fontSize: number
}

// Una línea siempre que se pueda; los nombres largos pasan a dos líneas
// antes de encoger tanto que dejen de leerse desde el otro lado de la mesa.
function layoutName(
  ctx: CanvasRenderingContext2D,
  name: string,
  panel: Panel,
  fonts: Fonts,
): NameLayout {
  const script = (size: number) => `400 ${size}px ${fonts.script}`
  const maxWidth = (1 - 2 * CONTENT_INSET - 0.02) * panel.width
  const singleLineSize = 0.4 * panel.height
  const minSingleLineSize = 0.28 * panel.height

  ctx.font = script(singleLineSize)
  const singleWidth = ctx.measureText(name).width
  const fittedSize = Math.min(singleLineSize, (singleLineSize * maxWidth) / singleWidth)

  if (fittedSize >= minSingleLineSize || !name.includes(" ")) {
    return { lines: [name], fontSize: fittedSize }
  }

  let fontSize = 0.3 * panel.height
  ctx.font = script(fontSize)
  let lines = wrapWords(ctx, name, maxWidth)

  if (lines.length > 2) {
    const words = name.split(" ")
    const half = Math.ceil(words.length / 2)
    lines = [words.slice(0, half).join(" "), words.slice(half).join(" ")]
  }

  const widest = Math.max(...lines.map((line) => ctx.measureText(line).width))

  if (widest > maxWidth) {
    fontSize = (fontSize * maxWidth) / widest
  }

  return { lines, fontSize }
}

function drawNamePanel(
  ctx: CanvasRenderingContext2D,
  panel: Panel,
  name: string,
  fonts: Fonts,
) {
  const { width, height } = panel
  const layout = layoutName(ctx, name, panel, fonts)

  const lineHeight = layout.fontSize * 1.02
  const blockHeight = layout.lines.length * lineHeight
  const firstBaseline = (height - blockHeight) / 2 + lineHeight * 0.72

  ctx.textAlign = "center"
  ctx.textBaseline = "alphabetic"
  ctx.fillStyle = SCRIPT_INK_COLOR
  ctx.font = `400 ${layout.fontSize}px ${fonts.script}`
  layout.lines.forEach((line, index) => {
    ctx.fillText(line, width / 2, firstBaseline + index * lineHeight)
  })
}

async function renderQrCode(url: string, size: number) {
  const { toCanvas } = await import("qrcode")
  const canvas = document.createElement("canvas")
  const qrUrl = new URL(url)
  qrUrl.searchParams.set("qr", "true")

  await toCanvas(canvas, qrUrl.toString(), {
    errorCorrectionLevel: "M",
    margin: 0,
    width: size,
    color: { dark: INK_COLOR, light: QR_CARD_COLOR },
  })

  return canvas
}

function drawQrPanel(
  ctx: CanvasRenderingContext2D,
  panel: Panel,
  qrCode: HTMLCanvasElement,
  websiteUrl: string,
  fonts: Fonts,
) {
  const { width, height } = panel
  const qrSize = qrCode.width
  const qrPadding = 0.06 * height
  const cardSize = qrSize + 2 * qrPadding
  const cardX = (CONTENT_INSET + 0.02) * width
  const cardY = (height - cardSize) / 2
  const qrX = cardX + qrPadding
  const qrY = cardY + qrPadding

  // Tarjetita blanca con esquinas suaves: da contraste al QR sobre el papel
  // crema y lo enmarca como una pieza más de la papelería.
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(cardX, cardY, cardSize, cardSize, 0.055 * height)
  ctx.shadowColor = "rgba(58, 42, 31, 0.12)"
  ctx.shadowBlur = 0.04 * height
  ctx.shadowOffsetY = 0.008 * height
  ctx.fillStyle = QR_CARD_COLOR
  ctx.fill()
  ctx.shadowColor = "transparent"
  ctx.lineWidth = 0.004 * height
  ctx.strokeStyle = QR_CARD_BORDER_COLOR
  ctx.stroke()
  ctx.restore()

  ctx.imageSmoothingEnabled = false
  ctx.drawImage(qrCode, qrX, qrY, qrSize, qrSize)
  ctx.imageSmoothingEnabled = true

  const textX = cardX + cardSize + 0.04 * width
  const textWidth = (1 - CONTENT_INSET) * width - textX
  const centerX = textX + textWidth / 2

  ctx.textAlign = "center"
  ctx.textBaseline = "alphabetic"

  const ctaSize = 0.2 * height
  const bodySize = 0.078 * height
  const bodyLineHeight = bodySize * 1.22
  ctx.font = `400 ${bodySize}px ${fonts.serif}`
  const bodyLines = wrapBalanced(ctx, QR_INSTRUCTIONS, textWidth)

  const urlSize = 0.055 * height
  const blockHeight = ctaSize * 0.95 + bodyLines.length * bodyLineHeight + urlSize * 2.2
  let cursor = (height - blockHeight) / 2 + ctaSize * 0.72

  ctx.font = `400 ${ctaSize}px ${fonts.script}`
  ctx.fillStyle = ACCENT_COLOR
  ctx.fillText(QR_CALL_TO_ACTION, centerX, cursor)
  cursor += ctaSize * 0.25 + bodyLineHeight

  ctx.font = `400 ${bodySize}px ${fonts.serif}`
  ctx.fillStyle = INK_COLOR
  bodyLines.forEach((line) => {
    ctx.fillText(line, centerX, cursor)
    cursor += bodyLineHeight
  })

  cursor += urlSize * 0.6
  setLetterSpacing(ctx, `${Math.round(0.004 * height)}px`)
  ctx.font = `600 ${urlSize}px ${fonts.serif}`
  ctx.fillStyle = SCRIPT_INK_COLOR
  ctx.fillText(displayUrl(websiteUrl).toLocaleUpperCase("es-ES"), centerX, cursor)
  setLetterSpacing(ctx, "0px")
}

function sortedPlaceCardNames(tables: TableDto[], guests: InvitationPartyGuestDto[]) {
  return tables.flatMap((table) =>
    seatedGuestsAtTable(guests, table.id).map((guest) => toDisplayName(guest.name)),
  )
}

export async function exportMariaDanielaPlaceCardsPdf(
  tables: TableDto[],
  guests: InvitationPartyGuestDto[],
  websiteUrl: string,
  layout: PlaceCardsPdfLayout,
) {
  const names = sortedPlaceCardNames(tables, guests)

  if (!names.length) {
    throw new Error("No hay invitados confirmados sentados en ninguna mesa.")
  }

  const canvas = document.createElement("canvas")
  canvas.width = Math.round(CARD_MM.width * PIXELS_PER_MM)
  canvas.height = Math.round(CARD_MM.height * PIXELS_PER_MM)
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("El navegador no permite generar el PDF.")
  }

  const panel = { width: canvas.width, height: canvas.height / 2 }

  const [{ jsPDF }, fonts, blobs, blobsAlternative, qrCode] = await Promise.all([
    import("jspdf"),
    loadFonts(),
    loadImage(mariaDanielaAssets.watercolorBlobs),
    loadImage(mariaDanielaAssets.watercolorBlobsAlternative),
    renderQrCode(websiteUrl, Math.round(0.52 * panel.height)),
  ])

  const doc =
    layout === "a6"
      ? new jsPDF({ unit: "mm", format: "a6", orientation: "landscape" })
      : new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" })

  // En A4 caben justas cuatro A6 (2 × 2); se centran y se marcan las líneas
  // de corte interiores. El borde exterior coincide con el del folio.
  const offsetX = (A4_LANDSCAPE_MM.width - 2 * CARD_MM.width) / 2
  const offsetY = (A4_LANDSCAPE_MM.height - 2 * CARD_MM.height) / 2

  names.forEach((name, index) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = PAPER_COLOR
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    drawSheetDecor(ctx, { blobs, blobsAlternative })
    withPanel(ctx, panel, "bottom", () => drawNamePanel(ctx, panel, name, fonts))
    withPanel(ctx, panel, "top", () => drawQrPanel(ctx, panel, qrCode, websiteUrl, fonts))

    const image = canvas.toDataURL("image/jpeg", 0.92)

    if (layout === "a6") {
      if (index > 0) {
        doc.addPage("a6", "landscape")
      }

      doc.addImage(image, "JPEG", 0, 0, CARD_MM.width, CARD_MM.height, undefined, "FAST")
      return
    }

    const slot = index % CARDS_PER_A4

    if (index > 0 && slot === 0) {
      doc.addPage("a4", "landscape")
    }

    const x = offsetX + (slot % 2) * CARD_MM.width
    const y = offsetY + Math.floor(slot / 2) * CARD_MM.height
    doc.addImage(image, "JPEG", x, y, CARD_MM.width, CARD_MM.height, undefined, "FAST")

    if (slot === CARDS_PER_A4 - 1 || index === names.length - 1) {
      doc.setDrawColor(CUT_LINE_COLOR)
      doc.setLineWidth(0.15)
      doc.line(offsetX + CARD_MM.width, 0, offsetX + CARD_MM.width, A4_LANDSCAPE_MM.height)
      doc.line(0, offsetY + CARD_MM.height, A4_LANDSCAPE_MM.width, offsetY + CARD_MM.height)
    }
  })

  doc.save(`marcasitios-${layout}.pdf`)
}
