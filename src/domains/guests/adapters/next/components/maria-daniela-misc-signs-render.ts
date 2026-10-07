import { mariaDanielaAssets } from "@/domains/wedding-sites/adapters/next/components/maria-daniela-assets"

export type MiscSignArrow = "left" | "right" | "none"

export interface MiscSign {
  text: string
  arrow: MiscSignArrow
}

export interface MariaDanielaMiscSignsTheme {
  partnerNames: [string, string]
  dateLabel: string
}

export const A4_LANDSCAPE_MM = { width: 297, height: 210 }
const DECOR_OPACITY = 0.66
const PAPER_COLOR = "#fbf4ea"
export const INK_COLOR = "#1c1712"
const TERRACOTTA_COLOR = "#d5764d"
const MAX_TEXT_LINES = 2

interface Fonts {
  script: string
  serif: string
}

interface DecorImages {
  blobs: HTMLImageElement
  blobsAlternative: HTMLImageElement
  sageWash: HTMLImageElement
}

export interface Box {
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

function drawImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  box: { x: number; y: number; width: number; height?: number; rotate?: number },
) {
  const height = box.height ?? (box.width * image.naturalHeight) / image.naturalWidth

  ctx.save()
  ctx.translate(box.x + box.width / 2, box.y + height / 2)
  ctx.rotate(((box.rotate ?? 0) * Math.PI) / 180)
  ctx.drawImage(image, -box.width / 2, -height / 2, box.width, height)
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

// Estrecha el ancho mientras no aparezcan más líneas, para que la frase no
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

function drawDecor(ctx: CanvasRenderingContext2D, images: DecorImages, wash: Box) {
  const { width, height } = ctx.canvas

  ctx.fillStyle = PAPER_COLOR
  ctx.fillRect(0, 0, width, height)

  ctx.save()
  ctx.globalAlpha = DECOR_OPACITY

  // Pétalos recortados en las esquinas, como en el mesario, girados al formato
  // apaisado para dejar libre la franja central del texto y la flecha.
  drawImage(ctx, images.blobsAlternative, {
    x: -0.16 * width,
    y: -0.2 * height,
    width: 0.32 * width,
    rotate: -24,
  })
  drawImage(ctx, images.blobs, {
    x: 0.78 * width,
    y: -0.3 * height,
    width: 0.36 * width,
    rotate: 100,
  })
  drawImage(ctx, images.blobs, {
    x: -0.14 * width,
    y: 0.68 * height,
    width: 0.36 * width,
    rotate: 200,
  })
  drawImage(ctx, images.blobsAlternative, {
    x: 0.84 * width,
    y: 0.66 * height,
    width: 0.24 * width,
    rotate: 40,
  })

  ctx.restore()

  drawImage(ctx, images.sageWash, wash)
}

// Flecha a pulso en terracota: el trazo se comba un poco y la punta tiene dos
// barbas de distinta longitud para que no parezca un icono.
function drawArrow(
  ctx: CanvasRenderingContext2D,
  direction: "left" | "right",
  centerY: number,
) {
  const { width, height } = ctx.canvas
  const length = 0.56 * width
  const tail = -length / 2
  const tip = length / 2
  const headLength = 0.13 * height

  ctx.save()
  ctx.translate(width / 2, centerY)

  if (direction === "left") {
    ctx.scale(-1, 1)
  }

  ctx.strokeStyle = TERRACOTTA_COLOR
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  ctx.lineWidth = 0.022 * height

  ctx.beginPath()
  ctx.moveTo(tail, 0.006 * height)
  ctx.bezierCurveTo(
    tail + 0.3 * length,
    -0.022 * height,
    tip - 0.35 * length,
    0.018 * height,
    tip,
    0,
  )
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(tip - headLength * Math.cos(0.6), -headLength * Math.sin(0.6))
  ctx.quadraticCurveTo(tip - 0.02 * height, -0.012 * height, tip, 0)
  ctx.quadraticCurveTo(
    tip - 0.025 * height,
    0.016 * height,
    tip - headLength * 0.92 * Math.cos(0.56),
    headLength * 0.92 * Math.sin(0.56),
  )
  ctx.stroke()

  ctx.restore()
}

interface TextLayout {
  lines: string[]
  size: number
  baselines: number[]
  wash: Box
}

// La frase va arriba, partida en dos líneas como mucho; si lleva flecha, el
// bloque sube para dejarle sitio debajo. Sin frase, la aguada se queda donde
// iría una línea, como fondo para escribirla a mano.
function layoutText(
  ctx: CanvasRenderingContext2D,
  text: string,
  hasArrow: boolean,
  fonts: Fonts,
): TextLayout {
  const { width, height } = ctx.canvas
  const script = (size: number) => `400 ${size}px ${fonts.script}`

  const maxWidth = 0.88 * width
  const minSize = 0.12 * height
  let size = (hasArrow ? 0.32 : 0.38) * height
  let lines: string[] = []

  while (text) {
    ctx.font = script(size)
    lines = wrapBalanced(ctx, text, maxWidth)

    if (lines.length <= MAX_TEXT_LINES || size <= minSize) {
      break
    }

    size = Math.max(minSize, size * 0.92)
  }

  if (lines.length > MAX_TEXT_LINES) {
    lines = [lines[0], lines.slice(1).join(" ")]
  }

  if (lines.length === MAX_TEXT_LINES) {
    size = Math.min(size, (hasArrow ? 0.2 : 0.24) * height)
  }

  // Parisienne apenas baja de la línea base: se centra el bloque como si cada
  // línea midiera algo más de medio cuerpo.
  const lineHeight = size * 0.98
  const center = (hasArrow ? 0.37 : 0.47) * height
  const lineCount = Math.max(lines.length, 1)
  const firstBaseline = center - ((lineCount - 1) * lineHeight) / 2 + size * 0.3
  const baselines = lines.map((_, index) => firstBaseline + index * lineHeight)
  const lastBaseline = baselines.at(-1) ?? firstBaseline
  const washTop = firstBaseline - size * 0.95

  return {
    lines,
    size,
    baselines,
    wash: {
      x: 0.06 * width,
      y: washTop,
      width: 0.88 * width,
      height: lastBaseline - washTop + size * 0.45,
    },
  }
}

export interface MiscSignAssets {
  fonts: Fonts
  images: DecorImages
}

export async function loadMiscSignAssets(): Promise<MiscSignAssets> {
  const [fonts, blobs, blobsAlternative, sageWash] = await Promise.all([
    loadFonts(),
    loadImage(mariaDanielaAssets.watercolorBlobs),
    loadImage(mariaDanielaAssets.watercolorBlobsAlternative),
    loadImage(mariaDanielaAssets.sageWash),
  ])

  return { fonts, images: { blobs, blobsAlternative, sageWash } }
}

export function createMiscSignCanvas(pixelsPerMm: number) {
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(A4_LANDSCAPE_MM.width * pixelsPerMm)
  canvas.height = Math.round(A4_LANDSCAPE_MM.height * pixelsPerMm)
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("El navegador no permite generar el cartel.")
  }

  return ctx
}

export interface RenderedMiscSign {
  // Zona de la aguada, donde va (o se escribe) la frase.
  wash: Box
  lines: string[]
  // Cuerpo común a todas las líneas una vez encajadas, en píxeles del canvas.
  fontSize: number
}

// Dibuja el cartel completo. Con `withText: false` deja la frase fuera, para
// que el Word la lleve como texto editable encima del fondo.
export function renderMiscSign(
  ctx: CanvasRenderingContext2D,
  sign: MiscSign,
  { fonts, images }: MiscSignAssets,
  theme: MariaDanielaMiscSignsTheme,
  { withText }: { withText: boolean },
): RenderedMiscSign {
  const { width, height } = ctx.canvas
  const script = (size: number) => `400 ${size}px ${fonts.script}`
  const serif = (size: number) => `400 ${size}px ${fonts.serif}`
  const text = sign.text.trim().replace(/\s+/g, " ")
  const hasArrow = sign.arrow !== "none"

  ctx.clearRect(0, 0, width, height)
  const layout = layoutText(ctx, text, hasArrow, fonts)
  drawDecor(ctx, images, layout.wash)

  ctx.textAlign = "center"
  ctx.textBaseline = "alphabetic"
  setLetterSpacing(ctx, "0px")

  // Cualquier línea que siga sin caber se encoge por su cuenta al dibujarla.
  const lineSizes = layout.lines.map((line) =>
    fitFontSize(ctx, line, script, layout.size, 0.9 * width),
  )

  if (withText) {
    ctx.fillStyle = INK_COLOR
    layout.lines.forEach((line, index) => {
      ctx.font = script(lineSizes[index])
      ctx.fillText(line, width / 2, layout.baselines[index])
    })
  }

  // Sin texto, la flecha no sube: el hueco de arriba queda libre para
  // escribirlo a mano.
  if (sign.arrow !== "none") {
    drawArrow(ctx, sign.arrow, 0.68 * height)
  }

  // Novios: "Nombre & Nombre" con el ampersand en terracota.
  const [first, second] = theme.partnerNames
  ctx.font = script(
    fitFontSize(ctx, `${first} & ${second}`, script, 0.055 * height, 0.5 * width),
  )
  drawCenteredRuns(
    ctx,
    [
      { text: `${first} `, color: INK_COLOR },
      { text: "&", color: TERRACOTTA_COLOR },
      { text: ` ${second}`, color: INK_COLOR },
    ],
    0.875 * height,
  )

  const dateLabel = theme.dateLabel.toLocaleUpperCase("es-ES")
  setLetterSpacing(ctx, `${Math.round(0.0016 * height)}px`)
  ctx.font = serif(fitFontSize(ctx, dateLabel, serif, 0.025 * height, 0.5 * width))
  ctx.fillStyle = INK_COLOR
  ctx.fillText(dateLabel, width / 2, 0.925 * height)
  setLetterSpacing(ctx, "0px")

  return {
    wash: layout.wash,
    lines: layout.lines,
    fontSize: Math.min(layout.size, ...lineSizes),
  }
}
