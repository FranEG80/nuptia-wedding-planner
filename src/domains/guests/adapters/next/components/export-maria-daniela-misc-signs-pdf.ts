import {
  A4_LANDSCAPE_MM,
  createMiscSignCanvas,
  loadMiscSignAssets,
  renderMiscSign,
  type MariaDanielaMiscSignsTheme,
  type MiscSign,
} from "@/domains/guests/adapters/next/components/maria-daniela-misc-signs-render"

// 300 ppp: calidad de imprenta sin disparar el peso del PDF.
const PIXELS_PER_MM = 300 / 25.4

export async function exportMariaDanielaMiscSignsPdf(
  signs: MiscSign[],
  theme: MariaDanielaMiscSignsTheme,
) {
  if (!signs.length) {
    throw new Error("No hay carteles para exportar.")
  }

  const [{ jsPDF }, assets] = await Promise.all([import("jspdf"), loadMiscSignAssets()])
  const ctx = createMiscSignCanvas(PIXELS_PER_MM)
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" })

  signs.forEach((sign, index) => {
    if (index > 0) {
      doc.addPage("a4", "landscape")
    }

    renderMiscSign(ctx, sign, assets, theme, { withText: true })

    doc.addImage(
      ctx.canvas.toDataURL("image/jpeg", 0.92),
      "JPEG",
      0,
      0,
      A4_LANDSCAPE_MM.width,
      A4_LANDSCAPE_MM.height,
      undefined,
      "FAST",
    )
  })

  doc.save("carteleria-varia-a4.pdf")
}
