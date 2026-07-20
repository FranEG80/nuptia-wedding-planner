import type { InvitationPartyGuestDto } from "@/domains/guests/application/dtos/invitation-party.dto"
import type { TableDto } from "@/domains/guests/application/dtos/table.dto"

interface DocWithLastAutoTable {
  lastAutoTable?: { finalY: number }
}

export async function exportSeatingPdf(
  tables: TableDto[],
  guests: InvitationPartyGuestDto[],
) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ])

  const doc = new jsPDF()
  const pageHeight = doc.internal.pageSize.getHeight()
  let cursorY = 16

  doc.setFontSize(16)
  doc.text("Distribución de mesas", 14, cursorY)
  cursorY += 10

  function renderSection(title: string, rows: string[][]) {
    if (cursorY > pageHeight - 30) {
      doc.addPage()
      cursorY = 16
    }

    doc.setFontSize(12)
    doc.text(title, 14, cursorY)
    cursorY += 4

    autoTable(doc, {
      startY: cursorY,
      head: [["Invitado"]],
      body: rows,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 10 },
    })

    cursorY = ((doc as unknown as DocWithLastAutoTable).lastAutoTable?.finalY ?? cursorY) + 10
  }

  for (const table of tables) {
    const seated = guests.filter((guest) => guest.seat?.tableId === table.id)
    const capacityLabel =
      table.capacity != null ? `${seated.length}/${table.capacity}` : `${seated.length}`

    renderSection(
      `${table.name} (${capacityLabel})`,
      seated.length
        ? seated.map((guest) => [guest.name])
        : [["Sin invitados asignados"]],
    )
  }

  const unassigned = guests.filter((guest) => !guest.seat)

  renderSection(
    "Sin asignar",
    unassigned.length
      ? unassigned.map((guest) => [guest.name])
      : [["Todos los invitados tienen mesa"]],
  )

  doc.save("distribucion-mesas.pdf")
}
