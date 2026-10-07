import { mariaDanielaAssets } from "@/domains/wedding-sites/adapters/next/components/maria-daniela-assets"

export interface MenuCourse {
  title: string
  // Un plato por línea, tal y como se escribe en el editor.
  dishes: string
}

export interface MariaDanielaMenuTheme {
  partnerNames: [string, string]
  dateLabel: string
}

export type MenuPdfLayout = "a4" | "a5" | "a4-2xa5"

export const MENU_COURSE_TITLE_MAX_LENGTH = 40
export const MENU_COURSE_DISHES_MAX_LENGTH = 600

type CardSize = "a4" | "a5"

const CARD_SIZES_MM: Record<CardSize, { width: number; height: number }> = {
  a4: { width: 210, height: 297 },
  a5: { width: 148, height: 210 },
}

interface SheetLayout {
  card: CardSize
  sheet: { format: CardSize; orientation: "portrait" | "landscape" }
  copies: number
}

// En A4 apaisado caben justas dos A5: la misma minuta repetida, con la línea
// de corte en medio.
const SHEET_LAYOUTS: Record<MenuPdfLayout, SheetLayout> = {
  a4: { card: "a4", sheet: { format: "a4", orientation: "portrait" }, copies: 1 },
  a5: { card: "a5", sheet: { format: "a5", orientation: "portrait" }, copies: 1 },
  "a4-2xa5": { card: "a5", sheet: { format: "a4", orientation: "landscape" }, copies: 2 },
}

const CUT_LINE_COLOR = "#c9bfb2"
// 300 ppp: calidad de imprenta sin disparar el peso del PDF.
const PIXELS_PER_MM = 300 / 25.4
const PETAL_OPACITY = 0.55
const BRUSH_OPACITY = 0.7
const PAPER_COLOR = "#fbf4ea"
const INK_COLOR = "#1c1712"
const SCRIPT_INK_COLOR = "#3a2a1f"
const TERRACOTTA_COLOR = "#d5764d"

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

interface MenuAssets {
  fonts: Fonts
  images: DecorImages
}

interface Box {
  x: number
  y: number
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
  ])

  return fonts
}

// La vista previa del editor repinta en cada tecla: acuarelas y fuentes se
// cargan una sola vez y se comparten con la exportación.
let assetsPromise: Promise<MenuAssets> | null = null

function loadAssets() {
  assetsPromise ??= Promise.all([
    loadFonts(),
    loadImage(mariaDanielaAssets.watercolorFrame),
    loadImage(mariaDanielaAssets.watercolorSides),
    loadImage(mariaDanielaAssets.watercolorBlobs),
    loadImage(mariaDanielaAssets.watercolorBlobsAlternative),
    loadImage(mariaDanielaAssets.terracottaBrush),
  ])
    .then(([fonts, frame, sideFlowers, blobs, blobsAlternative, brush]) => ({
      fonts,
      images: { frame, sideFlowers, blobs, blobsAlternative, brush },
    }))
    .catch((error: unknown) => {
      assetsPromise = null
      throw error
    })

  return assetsPromise
}

/**
 * Un pétalo es un recorte de una acuarela colocado para que asome desde un
 * borde. `x` y `width` van en fracción del ancho de página e `y` en fracción
 * del alto. A4 y A5 tienen la misma proporción, así que la composición es la
 * del seating.
 */
interface Petal {
  image: Exclude<keyof DecorImages, "brush">
  source?: Box
  x: number
  y: number
  width: number
  rotate?: number
}

const PETALS: Petal[] = [
  // Esquina superior izquierda: rosa con un toque naranja arriba.
  { image: "frame", source: { x: 0, y: 0, width: 560, height: 800 }, x: -0.13, y: -0.1, width: 0.36 },
  // Hoja, rosa y naranja asomando por arriba a la derecha.
  { image: "frame", source: { x: 780, y: 0, width: 1140, height: 700 }, x: 0.5, y: -0.09, width: 0.6 },
  // Margen izquierdo a media altura: naranja, verde y rosa en vertical.
  { image: "blobsAlternative", x: -0.134, y: 0.392, width: 0.35, rotate: -136.5 },
  // Naranja en la esquina inferior izquierda.
  { image: "sideFlowers", source: { x: 0, y: 150, width: 400, height: 850 }, x: -0.06, y: 0.78, width: 0.26 },
  // Junto al naranja: rosa asomando al pie.
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

function drawDecor(ctx: CanvasRenderingContext2D, images: DecorImages, brushBox: Box) {
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

// Estrecha el ancho mientras no aparezcan más líneas, para que el plato no
// deje una palabra suelta en la última línea.
function wrapBalanced(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines = wrapWords(ctx, text, maxWidth)

  if (lines.length < 2) {
    return lines
  }

  let low = 0
  let high = maxWidth

  while (high - low > 1) {
    const middle = (low + high) / 2

    if (wrapWords(ctx, text, middle).length > lines.length) {
      low = middle
    } else {
      high = middle
    }
  }

  return wrapWords(ctx, text, high)
}

// Dibuja segmentos de distinto color como una sola línea centrada.
function drawCenteredRuns(
  ctx: CanvasRenderingContext2D,
  runs: { text: string; color: string }[],
  y: number,
) {
  const widths = runs.map((run) => ctx.measureText(run.text).width)
  let cursor = ctx.canvas.width / 2 - widths.reduce((sum, width) => sum + width, 0) / 2

  ctx.textAlign = "left"
  runs.forEach((run, index) => {
    ctx.fillStyle = run.color
    ctx.fillText(run.text, cursor, y)
    cursor += widths[index]
  })
  ctx.textAlign = "center"
}

interface PrintableCourse {
  title: string
  dishes: string[]
}

function toPrintableCourses(courses: MenuCourse[]): PrintableCourse[] {
  return courses
    .map((course) => ({
      title: course.title.trim().replace(/\s+/g, " "),
      dishes: course.dishes
        .split("\n")
        .map((dish) => dish.trim().replace(/\s+/g, " "))
        .filter(Boolean),
    }))
    .filter((course) => course.title || course.dishes.length)
}

// Los títulos vienen escritos de serie: solo hay menú si hay algún plato.
export function hasPrintableMenu(courses: MenuCourse[]) {
  return toPrintableCourses(courses).some((course) => course.dishes.length > 0)
}

type MenuRow =
  | { kind: "title"; text: string; size: number; advance: number }
  | { kind: "dish"; text: string; size: number; advance: number }
  // `offset`: distancia de la línea base anterior al filete.
  | { kind: "rule"; offset: number; advance: number }

const MIN_MENU_SCALE = 0.45

// Cuánto sube y baja cada letra respecto a su línea base, en fracción del
// cuerpo. Parisienne tiene remates largos en mayúsculas y descendentes.
const SCRIPT_ASCENT = 0.78
const SCRIPT_DESCENT = 0.32
const SERIF_ASCENT = 0.7
const SERIF_DESCENT = 0.26

// La primera fila baja lo que sobresale su texto por encima de la base.
function firstRowAscent(rows: MenuRow[]) {
  const first = rows[0]

  if (first?.kind === "title") {
    return first.size * SCRIPT_ASCENT
  }

  return first?.kind === "dish" ? first.size * SERIF_ASCENT : 0
}

// Cada plato se parte en líneas equilibradas; si el menú no cabe entre la
// cabecera y el pie, todo baja de cuerpo a la vez para mantener la jerarquía.
function layoutMenu(
  ctx: CanvasRenderingContext2D,
  courses: PrintableCourse[],
  fonts: Fonts,
  area: { top: number; bottom: number; maxWidth: number },
) {
  const { height } = ctx.canvas
  const script = (size: number) => `400 ${size}px ${fonts.script}`
  const serif = (size: number) => `400 ${size}px ${fonts.serif}`
  let scale = 1
  let rows: MenuRow[] = []

  for (;;) {
    const titleSize = 0.044 * height * scale
    const dishSize = 0.025 * height * scale
    // Interlineado apretado: lo normal es una lista larga de entrantes.
    const dishLineHeight = dishSize * 1.15
    const dishGap = dishSize * 1.38
    // Aire a cada lado del filete, medido desde la tinta y no desde la base.
    const ruleGap = 0.02 * height * scale
    rows = []

    courses.forEach((course) => {
      const previous = rows.at(-1)

      if (previous) {
        const descent = previous.kind === "title" ? previous.size * SCRIPT_DESCENT : dishSize * SERIF_DESCENT
        const ascent = course.title ? titleSize * SCRIPT_ASCENT : dishSize * SERIF_ASCENT
        const offset = descent + ruleGap

        rows.push({ kind: "rule", offset, advance: offset + ruleGap + ascent })
      }

      if (course.title) {
        rows.push({
          kind: "title",
          text: course.title,
          size: fitFontSize(ctx, course.title, script, titleSize, area.maxWidth),
          advance: course.dishes.length ? titleSize * 0.98 : 0,
        })
      }

      course.dishes.forEach((dish, dishIndex) => {
        ctx.font = serif(dishSize)
        const lines = wrapBalanced(ctx, dish, area.maxWidth)

        lines.forEach((line, lineIndex) => {
          const isLastLine = lineIndex === lines.length - 1
          const isLastDish = dishIndex === course.dishes.length - 1

          rows.push({
            kind: "dish",
            text: line,
            size: fitFontSize(ctx, line, serif, dishSize, area.maxWidth),
            // Más aire entre platos que entre las líneas de un mismo plato.
            advance: isLastLine ? (isLastDish ? 0 : dishGap) : dishLineHeight,
          })
        })
      })
    })

    const total = firstRowAscent(rows) + rows.reduce((sum, row) => sum + row.advance, 0)

    if (total <= area.bottom - area.top || scale <= MIN_MENU_SCALE) {
      return rows
    }

    scale = Math.max(MIN_MENU_SCALE, scale * 0.94)
  }
}

function drawMenu(
  ctx: CanvasRenderingContext2D,
  courses: PrintableCourse[],
  fonts: Fonts,
) {
  const { width, height } = ctx.canvas
  const script = (size: number) => `400 ${size}px ${fonts.script}`
  const serif = (size: number) => `400 ${size}px ${fonts.serif}`
  // Franja libre entre la fecha y los pétalos del pie; los pétalos laterales
  // asoman hasta un 18 % del ancho por cada lado.
  const area = { top: 0.275 * height, bottom: 0.9 * height, maxWidth: 0.6 * width }
  const rows = layoutMenu(ctx, courses, fonts, area)

  // El menú arranca justo bajo la fecha, como en la plantilla; lo que sobre
  // queda abajo. El cursor es la línea base de cada fila.
  let cursor = area.top + firstRowAscent(rows)

  ctx.textAlign = "center"
  ctx.textBaseline = "alphabetic"

  rows.forEach((row) => {
    if (row.kind === "rule") {
      // Filete terracota corto entre platos, como en el mesario.
      ctx.fillStyle = TERRACOTTA_COLOR
      const ruleHeight = 0.0011 * height
      ctx.fillRect(width / 2 - 0.035 * width, cursor + row.offset - ruleHeight / 2, 0.07 * width, ruleHeight)
      cursor += row.advance
      return
    }

    ctx.font = row.kind === "title" ? script(row.size) : serif(row.size)
    ctx.fillStyle = row.kind === "title" ? SCRIPT_INK_COLOR : INK_COLOR
    ctx.fillText(row.text, width / 2, cursor)
    cursor += row.advance
  })
}

// Cabecera de la plantilla de Adobe Express: "Menú" sobre el brochazo
// terracota y, debajo, los novios y la fecha.
function drawMenuPage(
  ctx: CanvasRenderingContext2D,
  courses: PrintableCourse[] | null,
  theme: MariaDanielaMenuTheme,
  { fonts, images }: MenuAssets,
) {
  const { width, height } = ctx.canvas
  const script = (size: number) => `400 ${size}px ${fonts.script}`
  const serif = (size: number) => `400 ${size}px ${fonts.serif}`

  drawDecor(ctx, images, {
    x: 0.3 * width,
    y: 0.055 * height,
    width: 0.4 * width,
    height: 0.108 * height,
  })

  ctx.textAlign = "center"
  ctx.textBaseline = "alphabetic"
  setLetterSpacing(ctx, "0px")

  ctx.font = script(fitFontSize(ctx, "Menú", script, 0.112 * height, 0.42 * width))
  ctx.fillStyle = INK_COLOR
  ctx.fillText("Menú", width / 2, 0.137 * height)

  // Novios: "Nombre & Nombre" con el ampersand en terracota.
  const [first, second] = theme.partnerNames
  ctx.font = script(
    fitFontSize(ctx, `${first} & ${second}`, script, 0.036 * height, 0.62 * width),
  )
  drawCenteredRuns(
    ctx,
    [
      { text: `${first} `, color: INK_COLOR },
      { text: "&", color: TERRACOTTA_COLOR },
      { text: ` ${second}`, color: INK_COLOR },
    ],
    0.203 * height,
  )

  const dateLabel = theme.dateLabel.toLocaleUpperCase("es-ES")
  setLetterSpacing(ctx, `${Math.round(0.0008 * height)}px`)
  ctx.font = serif(fitFontSize(ctx, dateLabel, serif, 0.0175 * height, 0.62 * width))
  ctx.fillStyle = INK_COLOR
  ctx.fillText(dateLabel, width / 2, 0.229 * height)
  setLetterSpacing(ctx, "0px")

  if (courses?.length) {
    drawMenu(ctx, courses, fonts)
  }
}

/**
 * Pinta la minuta en un canvas de cualquier tamaño (todo va en fracciones de
 * página), para la vista previa del editor.
 */
export async function drawMariaDanielaMenuPreview(
  canvas: HTMLCanvasElement,
  courses: MenuCourse[],
  theme: MariaDanielaMenuTheme,
) {
  const assets = await loadAssets()
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    return
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  drawMenuPage(ctx, toPrintableCourses(courses), theme, assets)
}

/**
 * Sin `courses` sale la minuta en blanco, para que los novios escriban el
 * menú a mano.
 */
export async function exportMariaDanielaMenuPdf(
  courses: MenuCourse[] | null,
  theme: MariaDanielaMenuTheme,
  layoutId: MenuPdfLayout,
) {
  const printable = courses ? toPrintableCourses(courses) : null

  if (courses && !hasPrintableMenu(courses)) {
    throw new Error("Escribid al menos un plato del menú.")
  }

  const [{ jsPDF }, assets] = await Promise.all([import("jspdf"), loadAssets()])

  const layout = SHEET_LAYOUTS[layoutId]
  const card = CARD_SIZES_MM[layout.card]
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(card.width * PIXELS_PER_MM)
  canvas.height = Math.round(card.height * PIXELS_PER_MM)
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("El navegador no permite generar el PDF.")
  }

  drawMenuPage(ctx, printable, theme, assets)
  const image = canvas.toDataURL("image/jpeg", 0.92)

  const doc = new jsPDF({
    unit: "mm",
    format: layout.sheet.format,
    orientation: layout.sheet.orientation,
  })
  const sheetWidth = doc.internal.pageSize.getWidth()
  const sheetHeight = doc.internal.pageSize.getHeight()
  const offsetX = (sheetWidth - layout.copies * card.width) / 2
  const offsetY = (sheetHeight - card.height) / 2

  for (let copy = 0; copy < layout.copies; copy++) {
    doc.addImage(
      image,
      "JPEG",
      offsetX + copy * card.width,
      offsetY,
      card.width,
      card.height,
      // Mismo alias: jsPDF incrusta la imagen una sola vez.
      "minuta",
      "FAST",
    )
  }

  if (layout.copies > 1) {
    doc.setDrawColor(CUT_LINE_COLOR)
    doc.setLineWidth(0.15)

    for (let copy = 1; copy < layout.copies; copy++) {
      const x = offsetX + copy * card.width
      doc.line(x, 0, x, sheetHeight)
    }
  }

  doc.save(printable ? `minuta-${layoutId}.pdf` : `minuta-en-blanco-${layoutId}.pdf`)
}
