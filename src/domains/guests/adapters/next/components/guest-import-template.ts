const TEMPLATE_HEADERS = [
  "Grupo (opcional)",
  "Nombre *",
  "Apellidos",
  "Teléfono",
  "Email",
  "Destinatario (Sí/No)",
]

const INSTRUCTIONS: string[][] = [
  ["Cómo rellenar la plantilla"],
  [""],
  ["1. Cada fila es una persona."],
  [
    "2. Para invitar a 2 personas juntas (pareja, familia) en la misma invitación,",
    "repite el mismo texto en la columna Grupo en sus dos filas.",
  ],
  ["3. Una invitación admite como máximo 2 personas."],
  [
    "4. Marca con Sí, en la columna Destinatario, a la persona de cada grupo que",
    "recibirá el enlace por WhatsApp/email. Si no marcas a nadie, se elegirá",
    "automáticamente a quien tenga teléfono o email.",
  ],
  [
    "5. El destinatario necesita al menos un teléfono o un email. Si el grupo",
    "no tiene ninguno de los dos, la invitación no se podrá importar.",
  ],
  ["6. El nombre es obligatorio; los apellidos son opcionales."],
  [
    "7. Escribe el teléfono como texto (con prefijo si hace falta) para no",
    "perder ceros a la izquierda al abrir el archivo en Excel o Sheets.",
  ],
]

export async function downloadGuestImportTemplate() {
  const XLSX = await import("xlsx")

  const dataSheet = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS])
  dataSheet["!cols"] = TEMPLATE_HEADERS.map(() => ({ wch: 22 }))

  const instructionsSheet = XLSX.utils.aoa_to_sheet(
    INSTRUCTIONS.map((lines) => [lines.join(" ")]),
  )
  instructionsSheet["!cols"] = [{ wch: 90 }]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, dataSheet, "Invitados")
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instrucciones")

  XLSX.writeFile(workbook, "plantilla-invitados.xlsx")
}
