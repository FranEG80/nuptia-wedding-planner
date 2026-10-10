import type { InvitationPartyGuestDto } from "@/domains/guests/application/dtos/invitation-party.dto"
import type { TableDto } from "@/domains/guests/application/dtos/table.dto"
import { mariaDanielaAssets } from "@/domains/wedding-sites/adapters/next/components/maria-daniela-assets"

export interface MariaDanielaTableSignsTheme {
  partnerNames: [string, string]
  dateLabel: string
}

// Frase para las mesas a las que los novios no han puesto una propia.
const DEFAULT_TABLE_SIGN_PHRASE = "Gracias por ser parte de nuestra historia."

const A4_MM = { width: 210, height: 297 }
// 300 ppp: calidad de imprenta sin disparar el peso del PDF.
const PIXELS_PER_MM = 300 / 25.4
const DECOR_OPACITY = 0.66
const PAPER_COLOR = "#fbf4ea"
const INK_COLOR = "#1c1712"
const TERRACOTTA_COLOR = "#d5764d"

interface Fonts {
  script: string
  serif: string
}

interface DecorImages {
  blobs: HTMLImageElement
  blobsAlternative: HTMLImageElement
  sageWash: HTMLImageElement
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
    document.fonts.load(`500 64px ${fonts.serif}`),
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

// Dibuja segmentos de distinto color (y tipo) como una sola línea centrada.
function drawCenteredRuns(
  ctx: CanvasRenderingContext2D,
  runs: { text: string; color: string; font?: string }[],
  y: number,
) {
  const baseFont = ctx.font
  const widths = runs.map((run) => {
    ctx.font = run.font ?? baseFont
    return ctx.measureText(run.text).width
  })
  let cursor = ctx.canvas.width / 2 - widths.reduce((sum, width) => sum + width, 0) / 2

  ctx.textAlign = "left"
  runs.forEach((run, index) => {
    ctx.font = run.font ?? baseFont
    ctx.fillStyle = run.color
    ctx.fillText(run.text, cursor, y)
    cursor += widths[index]
  })
  ctx.font = baseFont
  ctx.textAlign = "center"
}

interface Box {
  x: number
  y: number
  width: number
  height: number
}

function drawDecor(ctx: CanvasRenderingContext2D, images: DecorImages, wash: Box) {
  const { width, height } = ctx.canvas

  ctx.fillStyle = PAPER_COLOR
  ctx.fillRect(0, 0, width, height)

  ctx.save()
  ctx.globalAlpha = DECOR_OPACITY

  // Pétalos recortados por los bordes, la misma familia que los carteles de
  // mesa con invitados, pero algo más contenidos para dejar aire al número.
  drawImage(ctx, images.blobsAlternative, {
    x: -0.28 * width,
    y: -0.08 * height,
    width: 0.46 * width,
    rotate: -24,
  })
  drawImage(ctx, images.blobs, {
    x: 0.6 * width,
    y: -0.17 * height,
    width: 0.54 * width,
    rotate: 100,
  })
  drawImage(ctx, images.blobsAlternative, {
    x: -0.17 * width,
    y: 0.5 * height,
    width: 0.28 * width,
    rotate: 160,
  })
  drawImage(ctx, images.blobs, {
    x: -0.24 * width,
    y: 0.8 * height,
    width: 0.6 * width,
    rotate: 200,
  })
  drawImage(ctx, images.blobsAlternative, {
    x: 0.8 * width,
    y: 0.79 * height,
    width: 0.34 * width,
    rotate: 40,
  })

  ctx.restore()

  // Aguada salvia detrás del bloque principal: lleva texto en terracota y sobre
  // el brochazo terracota de la web se perdería.
  drawImage(ctx, images.sageWash, wash)
}

function isDefaultTableName(name: string) {
  return /^mesa\s*\d+$/i.test(name.trim())
}

// Los nombres de mesa suelen guardarse en mayúsculas y en Parisienne quedan
// ilegibles: solo la primera letra va en mayúscula.
function toSentenceCase(text: string) {
  const lower = text.toLocaleLowerCase("es-ES")

  return lower.charAt(0).toLocaleUpperCase("es-ES") + lower.slice(1)
}

interface SignLayout {
  titleSize: number
  titleBaseline: number
  nameLines: string[]
  nameSize: number
  nameBaselines: number[]
  wash: Box
  contentBottom: number
}

const MAX_TABLE_NAME_LINES = 2
// Las cifras de Parisienne son bajas: el número va algo más grande que "Mesa".
const NUMBER_SCALE = 1.25

// "Mesa N" arriba y el nombre de la mesa debajo, partido en dos líneas como
// mucho. Sin nombre propio, "Mesa N" crece y ocupa el centro.
function layoutSign(
  ctx: CanvasRenderingContext2D,
  page: { number: number; name: string },
  fonts: Fonts,
): SignLayout {
  const { width, height } = ctx.canvas
  const script = (size: number) => `400 ${size}px ${fonts.script}`
  // const name = toSentenceCase(page.name.trim().replace(/\s+/g, " "))
  const name = page.name.trim().replace(/\s+/g, " ")
  const title = `Mesa ${page.number}`

  if (!name || isDefaultTableName(name)) {
    const titleSize = fitFontSize(ctx, title, script, 0.15 * height, 0.72 * width / NUMBER_SCALE)
    const titleBaseline = 0.43 * height

    return {
      titleSize,
      titleBaseline,
      nameLines: [],
      nameSize: 0,
      nameBaselines: [],
      wash: { x: 0.08 * width, y: titleBaseline - 0.16 * height, width: 0.84 * width, height: 0.21 * height },
      contentBottom: titleBaseline,
    }
  }

  const titleSize = fitFontSize(ctx, title, script, 0.085 * height, 0.55 * width / NUMBER_SCALE)
  const titleBaseline = 0.245 * height
  const maxWidth = 0.84 * width
  const minSize = 0.07 * height
  let nameSize = 0.135 * height
  let nameLines: string[] = []

  for (;;) {
    ctx.font = script(nameSize)
    nameLines = wrapBalanced(ctx, name, maxWidth)

    if (nameLines.length <= MAX_TABLE_NAME_LINES || nameSize <= minSize) {
      break
    }

    nameSize = Math.max(minSize, nameSize * 0.92)
  }

  if (nameLines.length > MAX_TABLE_NAME_LINES) {
    nameLines = [nameLines[0], nameLines.slice(1).join(" ")]
  }

  if (nameLines.length === MAX_TABLE_NAME_LINES) {
    nameSize = Math.min(nameSize, 0.112 * height)
  }

  // Cualquier línea que siga sin caber se encoge por su cuenta al dibujarla.
  const lineHeight = nameSize * 0.98
  const firstBaseline = 0.41 * height
  const nameBaselines = nameLines.map((_, index) => firstBaseline + index * lineHeight)
  const lastBaseline = nameBaselines.at(-1) ?? firstBaseline
  const washTop = firstBaseline - nameSize * 0.95

  return {
    titleSize,
    titleBaseline,
    nameLines,
    nameSize,
    nameBaselines,
    wash: {
      x: 0.06 * width,
      y: washTop,
      width: 0.88 * width,
      height: Math.max(0.16 * height, lastBaseline - washTop + nameSize * 0.45),
    },
    contentBottom: lastBaseline,
  }
}

function drawSignPage(
  ctx: CanvasRenderingContext2D,
  page: { number: number; name: string; phrase: string },
  images: DecorImages,
  theme: MariaDanielaTableSignsTheme,
  fonts: Fonts,
) {
  const { width, height } = ctx.canvas
  const script = (size: number) => `400 ${size}px ${fonts.script}`
  const serifMedium = (size: number) => `500 ${size}px ${fonts.serif}`
  const serif = (size: number) => `400 ${size}px ${fonts.serif}`

  const layout = layoutSign(ctx, page, fonts)
  drawDecor(ctx, images, layout.wash)

  ctx.textAlign = "center"
  ctx.textBaseline = "alphabetic"
  setLetterSpacing(ctx, "0px")

  ctx.font = script(layout.titleSize)
  drawCenteredRuns(
    ctx,
    [
      { text: "Mesa ", color: INK_COLOR },
      {
        text: String(page.number),
        color: INK_COLOR,
        font: script(layout.titleSize * NUMBER_SCALE),
      },
    ],
    layout.titleBaseline,
  )

  // El nombre es el acento terracota del cartel, como el "&" de la portada web.
  layout.nameLines.forEach((line, index) => {
    ctx.font = script(fitFontSize(ctx, line, script, layout.nameSize, 0.88 * width))
    ctx.fillStyle = TERRACOTTA_COLOR
    ctx.fillText(line, width / 2, layout.nameBaselines[index])
  })

  // if (page.phrase) {
  //   // Filete terracota corto entre la cabecera y la frase.
  //   const ruleY = layout.contentBottom + 0.07 * height
  //   ctx.fillStyle = TERRACOTTA_COLOR
  //   ctx.fillRect(width / 2 - 0.045 * width, ruleY, 0.09 * width, 0.0012 * height)

  //   // La frase es libre: si no cabe en la franja hasta el pie, baja el cuerpo.
  //   const phraseTop = ruleY + 0.065 * height
  //   const phraseBottom = 0.82 * height
  //   const minPhraseSize = 0.02 * height
  //   let phraseSize = 0.034 * height
  //   let phraseLines: string[] = []

  //   for (;;) {
  //     ctx.font = serifMedium(phraseSize)
  //     phraseLines = wrapBalanced(ctx, page.phrase, 0.64 * width)

  //     if (
  //       phraseTop + (phraseLines.length - 1) * phraseSize * 1.3 <= phraseBottom ||
  //       phraseSize <= minPhraseSize
  //     ) {
  //       break
  //     }

  //     phraseSize = Math.max(minPhraseSize, phraseSize * 0.92)
  //   }

  //   ctx.fillStyle = INK_COLOR
  //   phraseLines.forEach((line, index) => {
  //     ctx.fillText(line, width / 2, phraseTop + index * phraseSize * 1.3)
  //   })
  // }

  // Novios: "Nombre & Nombre" con el ampersand en terracota.
  const [first, second] = theme.partnerNames
  const coupleSize = fitFontSize(
    ctx,
    `${first} & ${second}`,
    script,
    0.046 * height,
    0.7 * width,
  )
  ctx.font = script(coupleSize)
  drawCenteredRuns(
    ctx,
    [
      { text: `${first} `, color: INK_COLOR },
      { text: "&", color: TERRACOTTA_COLOR },
      { text: ` ${second}`, color: INK_COLOR },
    ],
    0.89 * height,
  )

  const dateLabel = theme.dateLabel.toLocaleUpperCase("es-ES")
  setLetterSpacing(ctx, `${Math.round(0.0012 * height)}px`)
  ctx.font = serif(fitFontSize(ctx, dateLabel, serif, 0.019 * height, 0.7 * width))
  ctx.fillStyle = INK_COLOR
  ctx.fillText(dateLabel, width / 2, 0.925 * height)
  setLetterSpacing(ctx, "0px")
}

export async function buildMariaDanielaTableSignsPdf(
  tables: TableDto[],
  guests: InvitationPartyGuestDto[],
  theme: MariaDanielaTableSignsTheme,
) {
  // Misma numeración que los carteles con invitados: posición de la mesa en la
  // lista; solo se imprimen las mesas que tienen a alguien sentado.
  const pages = tables
    .map((table, index) => ({
      tableId: table.id,
      number: index + 1,
      name: table.name,
      phrase:
        table.phrase?.trim() || DEFAULT_TABLE_SIGN_PHRASE,
    }))
    .filter((page) => guests.some((guest) => guest.seat?.tableId === page.tableId))

  if (!pages.length) {
    throw new Error("No hay mesas con invitados para exportar.")
  }

  const [{ jsPDF }, fonts, blobs, blobsAlternative, sageWash] = await Promise.all([
    import("jspdf"),
    loadFonts(),
    loadImage(mariaDanielaAssets.watercolorBlobs),
    loadImage(mariaDanielaAssets.watercolorBlobsAlternative),
    loadImage(mariaDanielaAssets.sageWash),
  ])

  const canvas = document.createElement("canvas")
  canvas.width = Math.round(A4_MM.width * PIXELS_PER_MM)
  canvas.height = Math.round(A4_MM.height * PIXELS_PER_MM)
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("El navegador no permite generar el PDF.")
  }

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" })

  pages.forEach((page, index) => {
    if (index > 0) {
      doc.addPage("a4", "portrait")
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawSignPage(ctx, page, { blobs, blobsAlternative, sageWash }, theme, fonts)

    doc.addImage(
      canvas.toDataURL("image/jpeg", 0.92),
      "JPEG",
      0,
      0,
      A4_MM.width,
      A4_MM.height,
      undefined,
      "FAST",
    )
  })

  return doc
}

export async function exportMariaDanielaTableSignsPdf(
  tables: TableDto[],
  guests: InvitationPartyGuestDto[],
  theme: MariaDanielaTableSignsTheme,
) {
  const doc = await buildMariaDanielaTableSignsPdf(tables, guests, theme)
  doc.save("mesario-a4.pdf")
}
