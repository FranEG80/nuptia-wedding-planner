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
    "2. Grupo es solo una etiqueta libre para organizar (Familia, Amigos,",
    "Trabajo...). No combina a nadie: puedes repetirla en tantas filas e",
    "invitaciones sueltas como quieras.",
  ],
  [
    "3. Invitación conjunta sí combina personas: si 2 personas van a recibir",
    "UNA misma invitación (pareja), pon el mismo texto o número en esa",
    "columna en sus dos filas. Déjala vacía para invitaciones individuales.",
  ],
  ["4. Una invitación conjunta admite como máximo 2 personas."],
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
  ["Ejemplo: grupo \"Familia Novio\" con 2 parejas y 1 soltero"],
  [""],
]

const EXAMPLE_ROWS = [
  ["Grupo", "Invitación conjunta", "Nombre", "Apellidos", "Teléfono", "Email", "Destinatario"],
  ["Familia Novio", "F1", "Ana", "Ruiz", "600111222", "ana@correo.com", "Sí"],
  ["Familia Novio", "F1", "Luis", "Gómez", "600333444", "", "No"],
  ["Familia Novio", "F2", "Eva", "Ruiz", "600555666", "eva@correo.com", "Sí"],
  ["Familia Novio", "F2", "Mario", "Díaz", "", "", "No"],
  ["Familia Novio", "", "Pedro", "Ruiz", "600777888", "", "Sí"],
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
