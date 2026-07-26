export function joinSpanishNames(names: string[]): string {
  const cleanNames = names.map((name) => name.trim()).filter(Boolean)

  if (cleanNames.length <= 1) {
    return cleanNames[0] ?? ""
  }

  const lastName = cleanNames.at(-1)!
  return `${cleanNames.slice(0, -1).join(", ")} y ${lastName}`
}
