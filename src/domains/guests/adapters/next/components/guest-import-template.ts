const TEMPLATE_HEADERS = [
  "Grupo (opcional)",
  "Invitación conjunta (opcional)",
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
    "2. Grupo es solo una etiqueta interna para organizar el panel (Familia,",
    "Amigos, Trabajo...). No combina personas y nunca aparece en el mensaje.",
  ],
  [
    "3. Invitación conjunta combina personas: escribe el mismo nombre",
    "(por ejemplo Ana y Luis) en las filas que compartirán UNA invitación.",
    "Ese texto será también el nombre visible. Déjala vacía para individuales.",
  ],
  [
    "4. Una invitación conjunta admite como máximo 5 personas; la sexta fila",
    "con el mismo nombre se rechazará.",
  ],
  [
    "5. Marca con Sí, en la columna Destinatario, a la persona de cada",
    "invitación conjunta que recibirá el enlace por WhatsApp/email. Si no",
    "marcas a nadie, se elegirá automáticamente a quien tenga teléfono o email.",
  ],
  [
    "6. El destinatario necesita al menos un teléfono o un email. Si ninguna",
    "de las personas de la invitación lo tiene, no se podrá importar.",
  ],
  ["7. El nombre es obligatorio; los apellidos son opcionales."],
  [
    "8. Escribe el teléfono como texto (con prefijo si hace falta) para no",
    "perder ceros a la izquierda al abrir el archivo en Excel o Sheets.",
  ],
  [""],
  ["Ejemplo: Grupo \"Familia Novio\", dos invitaciones conjuntas y 1 soltero"],
  [""],
]

const EXAMPLE_ROWS = [
  ["Grupo", "Invitación conjunta", "Nombre", "Apellidos", "Teléfono", "Email", "Destinatario"],
  ["Familia Novio", "Ana y Luis", "Ana", "Ruiz", "600111222", "ana@correo.com", "Sí"],
  ["Familia Novio", "Ana y Luis", "Luis", "Gómez", "600333444", "", "No"],
  ["Familia Novio", "Eva y Mario", "Eva", "Ruiz", "600555666", "eva@correo.com", "Sí"],
  ["Familia Novio", "Eva y Mario", "Mario", "Díaz", "", "", "No"],
  ["Familia Novio", "", "Pedro", "Ruiz", "600777888", "", "Sí"],
]

export async function downloadGuestImportTemplate() {
  const XLSX = await import("xlsx")

  const dataSheet = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS])
  dataSheet["!cols"] = TEMPLATE_HEADERS.map((header) => ({
    wch: header.startsWith("Invitación") ? 30 : 22,
  }))

  const instructionsSheet = XLSX.utils.aoa_to_sheet([
    ...INSTRUCTIONS.map((lines) => [lines.join(" ")]),
    ...EXAMPLE_ROWS,
  ])
  instructionsSheet["!cols"] = [
    { wch: 90 },
    { wch: 30 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 20 },
    { wch: 14 },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, dataSheet, "Invitados")
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instrucciones")

  XLSX.writeFile(workbook, "plantilla-invitados.xlsx")
}
