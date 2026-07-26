const TEMPLATE_HEADERS = [
  "Grupo (opcional)",
  "Clave invitación conjunta (opcional)",
  "Nombre invitación conjunta (opcional)",
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
    "3. Clave invitación conjunta combina personas: escribe la misma clave",
    "(por ejemplo F1) en las filas que compartirán UNA invitación. Déjala",
    "vacía para invitaciones individuales. Admite como máximo 5 personas.",
  ],
  [
    "4. Nombre invitación conjunta es opcional y sí aparece en el mensaje",
    "enviado y en la invitación pública. Si lo dejas vacío, se mostrarán los",
    "nombres de las personas. Repite el mismo nombre en todas sus filas.",
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
  ["Grupo", "Clave invitación conjunta", "Nombre invitación conjunta", "Nombre", "Apellidos", "Teléfono", "Email", "Destinatario"],
  ["Familia Novio", "F1", "Ana y Luis", "Ana", "Ruiz", "600111222", "ana@correo.com", "Sí"],
  ["Familia Novio", "F1", "Ana y Luis", "Luis", "Gómez", "600333444", "", "No"],
  ["Familia Novio", "F2", "", "Eva", "Ruiz", "600555666", "eva@correo.com", "Sí"],
  ["Familia Novio", "F2", "", "Mario", "Díaz", "", "", "No"],
  ["Familia Novio", "", "", "Pedro", "Ruiz", "600777888", "", "Sí"],
]

export async function downloadGuestImportTemplate() {
  const XLSX = await import("xlsx")

  const dataSheet = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS])
  dataSheet["!cols"] = TEMPLATE_HEADERS.map(() => ({ wch: 24 }))

  const instructionsSheet = XLSX.utils.aoa_to_sheet([
    ...INSTRUCTIONS.map((lines) => [lines.join(" ")]),
    ...EXAMPLE_ROWS,
  ])
  instructionsSheet["!cols"] = [
    { wch: 90 },
    { wch: 20 },
    { wch: 28 },
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
