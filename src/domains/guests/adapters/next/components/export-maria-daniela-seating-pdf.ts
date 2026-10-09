import type { InvitationPartyGuestDto } from "@/domains/guests/application/dtos/invitation-party.dto"
import type { TableDto } from "@/domains/guests/application/dtos/table.dto"
import { seatedGuestsAtTable } from "@/domains/guests/domain/seating"
import { mariaDanielaAssets } from "@/domains/wedding-sites/adapters/next/components/maria-daniela-assets"

export type SeatingPdfLayout = "a5" | "a6" | "a4-2xa5" | "a4-4xa6"

export interface MariaDanielaSeatingPdfTheme {
  partnerNames: [string, string]
  dateLabel: string
}

type CardSize = "a5" | "a6"

const CARD_SIZES_MM: Record<CardSize, { width: number; height: number }> = {
  a5: { width: 148, height: 210 },
  a6: { width: 105, height: 148 },
}

interface SheetLayout {
  card: CardSize
  sheet: { format: "a4" | CardSize; orientation: "portrait" | "landscape" }
  columns: number
  rows: number
}

// En A4 caben justas dos A5 (apaisado) o cuatro A6 (vertical, 2 × 2); se
// centran y se marcan las líneas de corte interiores.
const SHEET_LAYOUTS: Record<SeatingPdfLayout, SheetLayout> = {
  a5: { card: "a5", sheet: { format: "a5", orientation: "portrait" }, columns: 1, rows: 1 },
  a6: { card: "a6", sheet: { format: "a6", orientation: "portrait" }, columns: 1, rows: 1 },
  "a4-2xa5": { card: "a5", sheet: { format: "a4", orientation: "landscape" }, columns: 2, rows: 1 },
  "a4-4xa6": { card: "a6", sheet: { format: "a4", orientation: "portrait" }, columns: 2, rows: 2 },
}

const CUT_LINE_COLOR = "#c9bfb2"

// 300 ppp: calidad de imprenta sin disparar el peso del PDF.
const PIXELS_PER_MM = 300 / 25.4
const PETAL_OPACITY = 0.55
const BRUSH_OPACITY = 0.55
const PAPER_COLOR = "#fbf4ea"
const INK_COLOR = "#1c1712"
const SCRIPT_INK_COLOR = "#3a2a1f"
const AMPERSAND_COLOR = "#d5764d"

interface Fonts {
  script: string
  serif: string
}

interface DecorImages {
  frame: HTMLImageElement
  sideFlowers: HTMLImageElement
  blobs: HTMLImageElement
  blobsAlternative: HTMLImageElement
  brush: HTMLImageElement
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
  ])

  return fonts
}

interface Box {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Un pétalo es un recorte de una acuarela colocado para que asome desde un
 * borde. `x` y `width` van en fracción del ancho de página e `y` en fracción
 * del alto, así A5 y A6 comparten composición.
 */
interface Petal {
  image: Exclude<keyof DecorImages, "brush">
  source?: Box
  x: number
  y: number
  width: number
  rotate?: number
}

// Cada recorte queda casi entero fuera de página: solo asoma la punta, para
// enmarcar sin tapar el título, la lista ni los novios.
const PETALS: Petal[] = [
  // Esquina superior izquierda: rosa con un toque naranja arriba.
  { image: "frame", source: { x: 0, y: 0, width: 560, height: 800 }, x: -0.13, y: -0.1, width: 0.36 },
  // Hoja, rosa y naranja asomando por arriba a la derecha.
  { image: "frame", source: { x: 780, y: 0, width: 1140, height: 700 }, x: 0.5, y: -0.09, width: 0.6 },
  // Margen izquierdo a media altura: girado para apilar naranja, verde y
  // rosa en vertical, asomando lo justo antes de la lista.
  { image: "blobsAlternative", x: -0.134, y: 0.392, width: 0.35, rotate: -136.5 },
  // Naranja en la esquina inferior izquierda.
  { image: "sideFlowers", source: { x: 0, y: 150, width: 400, height: 850 }, x: -0.06, y: 0.78, width: 0.26 },
  // Junto al naranja: rosa asomando al pie, por debajo de la fecha.
  { image: "blobs", x: 0.118, y: 0.935, width: 0.345, rotate: 90 },
  // Hoja y rosa en la esquina inferior derecha.
  { image: "sideFlowers", source: { x: 1480, y: 100, width: 440, height: 850 }, x: 0.86, y: 0.78, width: 0.22 },
]

function drawPetal(ctx: CanvasRenderingContext2D, images: DecorImages, petal: Petal) {
  const { width: pageWidth, height: pageHeight } = ctx.canvas
  const image = images[petal.image]
  const source = petal.source ?? {
    x: 0,
    y: 0,
    width: image.naturalWidth,
    height: image.naturalHeight,
  }
  const width = petal.width * pageWidth
  const height = (width * source.height) / source.width

  ctx.save()
  ctx.translate(petal.x * pageWidth + width / 2, petal.y * pageHeight + height / 2)
  ctx.rotate(((petal.rotate ?? 0) * Math.PI) / 180)
  ctx.drawImage(
    image,
    source.x,
    source.y,
    source.width,
    source.height,
    -width / 2,
    -height / 2,
    width,
    height,
  )
  ctx.restore()
}

function drawDecor(
  ctx: CanvasRenderingContext2D,
  images: DecorImages,
  brushBox: Box,
) {
  const { width, height } = ctx.canvas

  ctx.fillStyle = PAPER_COLOR
  ctx.fillRect(0, 0, width, height)

  // "darken" no oscurece el pigmento (ya es más oscuro que el papel): solo
  // hace desaparecer el fondo crema de las acuarelas sin transparencia.
  ctx.save()
  ctx.globalCompositeOperation = "darken"
  ctx.globalAlpha = PETAL_OPACITY
  PETALS.forEach((petal) => drawPetal(ctx, images, petal))
  ctx.restore()

  ctx.save()
  ctx.globalAlpha = BRUSH_OPACITY
  ctx.drawImage(images.brush, brushBox.x, brushBox.y, brushBox.width, brushBox.height)
  ctx.restore()
}

function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: (size: number) => string,
  size: number,
  maxWidth: number,
) {
  ctx.font = font(size)
  const measured = ctx.measureText(text).width

  return measured > maxWidth ? (size * maxWidth) / measured : size
}

function setLetterSpacing(ctx: CanvasRenderingContext2D, value: string) {
  if ("letterSpacing" in ctx) {
    ctx.letterSpacing = value
  }
}

function drawCentered(
  ctx: CanvasRenderingContext2D,
  text: string,
  y: number,
  options: { font: (size: number) => string; size: number; maxWidth: number; color: string },
) {
  const size = fitFontSize(ctx, text, options.font, options.size, options.maxWidth)
  ctx.font = options.font(size)
  ctx.fillStyle = options.color
  ctx.fillText(text, ctx.canvas.width / 2, y)
}

function isDefaultTableName(name: string) {
  return /^mesa\s*\d+$/i.test(name.trim())
}

// Los nombres de mesa suelen guardarse en mayúsculas y en Parisienne quedan
// ilegibles: solo la primera letra va en mayúscula.
// function toSentenceCase(text: string) {
//   const lower = text.toLocaleLowerCase("es-ES")

//   return lower.charAt(0).toLocaleUpperCase("es-ES") + lower.slice(1)
// }

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

interface HeaderLayout {
  lines: string[]
  fontSize: number
  baselines: number[]
  brush: Box
}

const MAX_TABLE_NAME_LINES = 2

// El nombre de la mesa es libre: se parte en dos líneas como mucho y, si aun
// así no cabe, baja el cuerpo de letra. El brochazo crece con el texto.
function layoutHeader(
  ctx: CanvasRenderingContext2D,
  page: { number: number; name: string },
  fonts: Fonts,
): HeaderLayout {
  const { width, height } = ctx.canvas
  const script = (size: number) => `400 ${size}px ${fonts.script}`
  const maxWidth = 0.66 * width
  // const name = toSentenceCase(page.name.trim().replace(/\s+/g, " "))
  const name = page.name.trim().replace(/\s+/g, " ")
  const showName = name.length > 0 && !isDefaultTableName(name)
  let fontSize = 0.068 * height
  let nameLines: string[] = []

  if (showName) {
    const minSize = 0.044 * height

    for (;;) {
      ctx.font = script(fontSize)
      nameLines = wrapWords(ctx, name, maxWidth)

      if (nameLines.length <= MAX_TABLE_NAME_LINES || fontSize <= minSize) {
        break
      }

      fontSize = Math.max(minSize, fontSize * 0.92)
    }

    if (nameLines.length > MAX_TABLE_NAME_LINES) {
      nameLines = [
        nameLines[0],
        nameLines.slice(1).join(" "),
      ]
    }

    // Tres líneas en el brochazo: algo más pequeñas para no comerse la lista.
    if (nameLines.length === MAX_TABLE_NAME_LINES) {
      fontSize = Math.min(fontSize, 0.058 * height)
    }
  }

  const lines = [`Mesa ${page.number}`, ...nameLines]
  const lineHeight = fontSize * 0.88
  const brushHeight = Math.max(0.155 * height, lines.length * lineHeight + 0.035 * height)
  const brush = { x: 0.11 * width, y: 0.042 * height, width: 0.74 * width, height: brushHeight }
  const blockTop = brush.y + (brush.height - lines.length * lineHeight) / 2
  const baselines = lines.map((_, index) => blockTop + lineHeight * (index + 0.78))

  return { lines, fontSize, baselines, brush }
}

function drawTablePage(
  ctx: CanvasRenderingContext2D,
  page: { guests: string[] },
  header: HeaderLayout,
  theme: MariaDanielaSeatingPdfTheme,
  fonts: Fonts,
) {
  const { width, height } = ctx.canvas
  const script = (size: number) => `400 ${size}px ${fonts.script}`
  const serif = (size: number) => `400 ${size}px ${fonts.serif}`

  ctx.textAlign = "center"
  ctx.textBaseline = "alphabetic"
  setLetterSpacing(ctx, "0px")

  header.lines.forEach((line, index) => {
    drawCentered(ctx, line, header.baselines[index], {
      font: script,
      size: header.fontSize,
      maxWidth: 0.66 * width,
      color: SCRIPT_INK_COLOR,
    })
  })

  // La lista ocupa la franja central; con muchas personas se compacta.
  const listTop = header.brush.y + header.brush.height + 0.07 * height
  const listBottom = 0.79 * height
  const count = Math.max(page.guests.length, 1)
  const lineHeight = Math.min(0.0735 * height, (listBottom - listTop) / count)
  const nameSize = Math.min(0.036 * height, lineHeight * 0.62)
  const firstBaseline =
    listTop + (listBottom - listTop - lineHeight * count) / 2 + lineHeight * 0.6

  page.guests.forEach((guest, index) => {
    drawCentered(ctx, guest, firstBaseline + index * lineHeight, {
      font: serif,
      size: nameSize,
      maxWidth: 0.72 * width,
      color: INK_COLOR,
    })
  })

  // Novios: "Nombre & Nombre" con el ampersand en terracota.
  const [first, second] = theme.partnerNames
  const coupleSize = fitFontSize(
    ctx,
    `${first} & ${second}`,
    script,
    0.042 * height,
    0.7 * width,
  )
  const coupleY = 0.895 * height
  ctx.font = script(coupleSize)
  const left = `${first} `
  const right = ` ${second}`
  const leftWidth = ctx.measureText(left).width
  const ampWidth = ctx.measureText("&").width
  const rightWidth = ctx.measureText(right).width
  let cursor = width / 2 - (leftWidth + ampWidth + rightWidth) / 2

  ctx.textAlign = "left"
  ctx.fillStyle = INK_COLOR
  ctx.fillText(left, cursor, coupleY)
  cursor += leftWidth
  ctx.fillStyle = AMPERSAND_COLOR
  ctx.fillText("&", cursor, coupleY)
  cursor += ampWidth
  ctx.fillStyle = INK_COLOR
  ctx.fillText(right, cursor, coupleY)
  ctx.textAlign = "center"

  setLetterSpacing(ctx, `${Math.round(0.0012 * height)}px`)
  drawCentered(ctx, theme.dateLabel.toLocaleUpperCase("es-ES"), 0.928 * height, {
    font: serif,
    size: 0.019 * height,
    maxWidth: 0.7 * width,
    color: INK_COLOR,
  })
  setLetterSpacing(ctx, "0px")
}

export async function exportMariaDanielaSeatingPdf(
  tables: TableDto[],
  guests: InvitationPartyGuestDto[],
  theme: MariaDanielaSeatingPdfTheme,
  layoutId: SeatingPdfLayout,
) {
  const pages = tables
    .map((table, index) => ({
      number: index + 1,
      name: table.name,
      guests: seatedGuestsAtTable(guests, table.id).map((guest) => guest.name),
    }))
    .filter((page) => page.guests.length > 0)

  if (!pages.length) {
    throw new Error("No hay mesas con invitados para exportar.")
  }

  const [{ jsPDF }, fonts, frame, sideFlowers, blobs, blobsAlternative, brush] = await Promise.all([
    import("jspdf"),
    loadFonts(),
    loadImage(mariaDanielaAssets.watercolorFrame),
    loadImage(mariaDanielaAssets.watercolorSides),
    loadImage(mariaDanielaAssets.watercolorBlobs),
    loadImage(mariaDanielaAssets.watercolorBlobsAlternative),
    loadImage(mariaDanielaAssets.terracottaBrush),
  ])

  const layout = SHEET_LAYOUTS[layoutId]
  const card = CARD_SIZES_MM[layout.card]
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(card.width * PIXELS_PER_MM)
  canvas.height = Math.round(card.height * PIXELS_PER_MM)
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("El navegador no permite generar el PDF.")
  }

  const doc = new jsPDF({
    unit: "mm",
    format: layout.sheet.format,
    orientation: layout.sheet.orientation,
  })
  const sheetWidth = doc.internal.pageSize.getWidth()
  const sheetHeight = doc.internal.pageSize.getHeight()
  const cardsPerSheet = layout.columns * layout.rows
  const offsetX = (sheetWidth - layout.columns * card.width) / 2
  const offsetY = (sheetHeight - layout.rows * card.height) / 2

  function drawCutLines() {
    doc.setDrawColor(CUT_LINE_COLOR)
    doc.setLineWidth(0.15)

    for (let column = 1; column < layout.columns; column++) {
      const x = offsetX + column * card.width
      doc.line(x, 0, x, sheetHeight)
    }

    for (let row = 1; row < layout.rows; row++) {
      const y = offsetY + row * card.height
      doc.line(0, y, sheetWidth, y)
    }
  }

  pages.forEach((page, index) => {
    const slot = index % cardsPerSheet

    if (index > 0 && slot === 0) {
      doc.addPage(layout.sheet.format, layout.sheet.orientation)
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const header = layoutHeader(ctx, page, fonts)
    drawDecor(ctx, { frame, sideFlowers, blobs, blobsAlternative, brush }, header.brush)
    drawTablePage(ctx, page, header, theme, fonts)

    doc.addImage(
      canvas.toDataURL("image/jpeg", 0.92),
      "JPEG",
      offsetX + (slot % layout.columns) * card.width,
      offsetY + Math.floor(slot / layout.columns) * card.height,
      card.width,
      card.height,
      undefined,
      "FAST",
    )

    if (cardsPerSheet > 1 && (slot === cardsPerSheet - 1 || index === pages.length - 1)) {
      drawCutLines()
    }
  })

  doc.save(`mesas-${layoutId}.pdf`)
}
