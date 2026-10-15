import {
  createMiscSignCanvas,
  loadMiscSignAssets,
  MISC_SIGN_PAGE_MM,
  renderMiscSign,
  type MariaDanielaMiscSignsTheme,
  type MiscSign,
  type MiscSignPaper,
} from "@/domains/guests/adapters/next/components/maria-daniela-misc-signs-render"

// 300 ppp: calidad de imprenta sin disparar el peso del PDF.
const PIXELS_PER_MM = 300 / 25.4

export async function exportMariaDanielaMiscSignsPdf(
  signs: MiscSign[],
  theme: MariaDanielaMiscSignsTheme,
  paper: MiscSignPaper,
) {
  if (!signs.length) {
    throw new Error("No hay carteles para exportar.")
  }

  const [{ jsPDF }, assets] = await Promise.all([import("jspdf"), loadMiscSignAssets()])
  const page = MISC_SIGN_PAGE_MM[paper]
  const ctx = createMiscSignCanvas(paper, PIXELS_PER_MM)
  const doc = new jsPDF({ unit: "mm", format: paper, orientation: "landscape" })

  signs.forEach((sign, index) => {
    if (index > 0) {
      doc.addPage(paper, "landscape")
    }

    renderMiscSign(ctx, sign, assets, theme, { withText: true })

    doc.addImage(
      ctx.canvas.toDataURL("image/jpeg", 0.92),
      "JPEG",
      0,
      0,
      page.width,
      page.height,
      undefined,
      "FAST",
    )
  })

  doc.save(`carteleria-varia-${paper}.pdf`)
}
