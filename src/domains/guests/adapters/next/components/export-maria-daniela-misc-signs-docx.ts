import {
  A4_LANDSCAPE_MM,
  createMiscSignCanvas,
  INK_COLOR,
  loadMiscSignAssets,
  renderMiscSign,
  type Box,
  type MariaDanielaMiscSignsTheme,
  type MiscSign,
} from "@/domains/guests/adapters/next/components/maria-daniela-misc-signs-render"

// El fondo va como imagen: 200 ppp bastan para imprimir y el Word no pesa
// tanto como el PDF.
const PIXELS_PER_MM = 200 / 25.4
// docx mide imágenes y formas en píxeles CSS (96 ppp).
const CSS_PIXELS_PER_MM = 96 / 25.4
const A4_PORTRAIT_TWIPS = { width: 11906, height: 16838 }
const A4_LANDSCAPE_HEIGHT_PT = (A4_LANDSCAPE_MM.height / 25.4) * 72
// Word y el canvas no miden igual al céntimo: un pelo más pequeño para que
// la línea no salte en Word.
const WORD_FONT_SAFETY = 0.95
// Altura de línea de Parisienne en Word (ascendente + descendente de la
// fuente, 1875 + 915 sobre 2048), con un pelo de margen.
const SCRIPT_LINE_HEIGHT = 1.4
const SCRIPT_FONT_NAME = "Parisienne"
const SCRIPT_FONT_URL = "/fonts/Parisienne-Regular.ttf"

// Sin `embedTrueTypeFonts`, Word descarta la fuente incrustada al guardar y
// el cartel cambia de letra en cuanto los novios lo editan.
const SETTINGS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:embedTrueTypeFonts/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>`

async function loadScriptFont() {
  const response = await fetch(SCRIPT_FONT_URL)

  if (!response.ok) {
    throw new Error("No se pudo cargar la tipografía del cartel.")
  }

  return new Uint8Array(await response.arrayBuffer())
}

function canvasToJpeg(canvas: HTMLCanvasElement) {
  return new Promise<Uint8Array>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("El navegador no permite generar el cartel."))
          return
        }

        blob.arrayBuffer().then((buffer) => resolve(new Uint8Array(buffer)), reject)
      },
      "image/jpeg",
      0.9,
    )
  })
}

function toPercent(value: number, total: number) {
  return `${Number(((value / total) * 100).toFixed(2))}%` as const
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  link.click()
  // Safari cancela la descarga si la URL se revoca en el mismo tick.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function exportMariaDanielaMiscSignsDocx(
  signs: MiscSign[],
  theme: MariaDanielaMiscSignsTheme,
) {
  if (!signs.length) {
    throw new Error("No hay carteles para exportar.")
  }

  const [docx, { ShapeRun }, assets, scriptFont] = await Promise.all([
    import("docx"),
    import("docx/shapes"),
    loadMiscSignAssets(),
    loadScriptFont(),
  ])
  const {
    AlignmentType,
    Document,
    HorizontalPositionRelativeFrom,
    ImageRun,
    Packer,
    PageOrientation,
    Paragraph,
    TextRun,
    TextWrappingType,
    VerticalPositionRelativeFrom,
  } = docx

  const ctx = createMiscSignCanvas(PIXELS_PER_MM)
  const { width: canvasWidth, height: canvasHeight } = ctx.canvas
  const pageCss = {
    width: Math.round(A4_LANDSCAPE_MM.width * CSS_PIXELS_PER_MM),
    height: Math.round(A4_LANDSCAPE_MM.height * CSS_PIXELS_PER_MM),
  }

  // Cuadro de texto sin borde ni relleno sobre la aguada: la frase queda
  // centrada en ella aunque cambie de longitud al editarla.
  function textBox(wash: Box, lines: string[], fontSizePx: number) {
    const wordFontSizePx = fontSizePx * WORD_FONT_SAFETY
    const halfPoints = Math.round((wordFontSizePx / canvasHeight) * A4_LANDSCAPE_HEIGHT_PT * 2)
    // Word recorta lo que no cabe en el cuadro: si las líneas piden más alto
    // que la aguada, el cuadro crece manteniéndose centrado en ella.
    const textHeight = Math.max(lines.length, 1) * wordFontSizePx * SCRIPT_LINE_HEIGHT
    const boxHeight = Math.max(wash.height, textHeight)
    const boxTop = wash.y + (wash.height - boxHeight) / 2
    const runStyle = {
      font: SCRIPT_FONT_NAME,
      size: halfPoints,
      color: INK_COLOR.slice(1).toUpperCase(),
    }

    return new ShapeRun({
      type: "rectangle",
      fill: "none",
      line: "none",
      transformation: {
        width: toPercent(wash.width, canvasWidth),
        height: toPercent(boxHeight, canvasHeight),
      },
      floating: {
        horizontalPosition: {
          relative: HorizontalPositionRelativeFrom.PAGE,
          offset: toPercent(wash.x, canvasWidth),
        },
        verticalPosition: {
          relative: VerticalPositionRelativeFrom.PAGE,
          offset: toPercent(boxTop, canvasHeight),
        },
        sizeRelativeTo: { width: "page", height: "page" },
        allowOverlap: true,
        wrap: { type: TextWrappingType.NONE },
      },
      textOptions: {
        verticalAlignment: "center",
        margins: { top: 0, right: 0, bottom: 0, left: 0 },
        wrap: true,
      },
      // Sin frase, el párrafo vacío ya lleva la letra y el cuerpo: lo que se
      // escriba en Word sale con el estilo del cartel.
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 0 },
          run: runStyle,
          children: lines.map(
            (line, index) => new TextRun({ ...runStyle, text: line, break: index > 0 ? 1 : 0 }),
          ),
        }),
      ],
    })
  }

  const sections = []

  for (const sign of signs) {
    const rendered = renderMiscSign(ctx, sign, assets, theme, { withText: false })
    const background = await canvasToJpeg(ctx.canvas)

    sections.push({
      properties: {
        page: {
          size: {
            ...A4_PORTRAIT_TWIPS,
            orientation: PageOrientation.LANDSCAPE,
          },
          margin: { top: 0, right: 0, bottom: 0, left: 0, header: 0, footer: 0 },
        },
      },
      children: [
        new Paragraph({
          spacing: { before: 0, after: 0 },
          children: [
            new ImageRun({
              type: "jpg",
              data: background,
              transformation: pageCss,
              floating: {
                horizontalPosition: {
                  relative: HorizontalPositionRelativeFrom.PAGE,
                  offset: 0,
                },
                verticalPosition: {
                  relative: VerticalPositionRelativeFrom.PAGE,
                  offset: 0,
                },
                behindDocument: true,
                allowOverlap: true,
                wrap: { type: TextWrappingType.NONE },
              },
              altText: {
                name: "Fondo del cartel",
                description: "Decoración de la plantilla, flecha y nombres de los novios",
                title: "Fondo del cartel",
              },
            }),
            textBox(rendered.wash, rendered.lines, rendered.fontSize),
          ],
        }),
      ],
    })
  }

  const doc = new Document({
    // docx tipa los datos como Buffer de Node, pero en el navegador solo
    // los trata como bytes.
    fonts: [{ name: SCRIPT_FONT_NAME, data: scriptFont as unknown as Buffer }],
    sections,
  })

  const blob = await Packer.toBlob(doc, false, [
    { path: "word/settings.xml", data: SETTINGS_XML },
  ])

  downloadBlob(blob, "carteleria-varia-a4.docx")
}
