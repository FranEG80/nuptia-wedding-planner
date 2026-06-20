import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"

type Field = {
  name: string
  type: string
  baseType: string
  isArray: boolean
  isOptional: boolean
  attributes: string
}

type Model = {
  name: string
  fields: Field[]
  blockAttributes: string[]
}

type Relation = {
  sourceModel: string
  targetModel: string
  fieldName: string
  relationFields: string[]
  isOptional: boolean
}

const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma")
const diagramPath = path.join(process.cwd(), "diagram.md")

const scalarTypes = new Set([
  "String",
  "Boolean",
  "Int",
  "BigInt",
  "Float",
  "Decimal",
  "DateTime",
  "Json",
  "Bytes",
])

const mermaidTypes: Record<string, string> = {
  String: "string",
  Boolean: "boolean",
  Int: "int",
  BigInt: "bigint",
  Float: "float",
  Decimal: "decimal",
  DateTime: "datetime",
  Json: "json",
  Bytes: "bytes",
}

function parseModels(schema: string): Model[] {
  const models: Model[] = []
  const modelRegex = /^model\s+(\w+)\s+\{([\s\S]*?)^}/gm
  let match: RegExpExecArray | null

  while ((match = modelRegex.exec(schema)) !== null) {
    const [, name, body] = match
    const fields: Field[] = []
    const blockAttributes: string[] = []

    for (const rawLine of body.split("\n")) {
      const line = rawLine.trim()

      if (!line || line.startsWith("//")) {
        continue
      }

      if (line.startsWith("@@")) {
        blockAttributes.push(line)
        continue
      }

      const fieldMatch = /^(\w+)\s+([^\s]+)(?:\s+(.*))?$/.exec(line)

      if (!fieldMatch) {
        continue
      }

      const [, fieldName, fieldType, attributes = ""] = fieldMatch
      const isArray = fieldType.endsWith("[]")
      const isOptional = fieldType.endsWith("?")
      const baseType = fieldType.replace(/\[\]$/, "").replace(/\?$/, "")

      fields.push({
        name: fieldName,
        type: fieldType,
        baseType,
        isArray,
        isOptional,
        attributes,
      })
    }

    models.push({ name, fields, blockAttributes })
  }

  return models
}

function relationFieldNames(field: Field): string[] {
  const relationMatch = /@relation\(([^)]*)\)/.exec(field.attributes)

  if (!relationMatch) {
    return []
  }

  const fieldsMatch = /fields:\s*\[([^\]]+)\]/.exec(relationMatch[1])

  if (!fieldsMatch) {
    return []
  }

  return fieldsMatch[1]
    .split(",")
    .map((fieldName) => fieldName.trim())
    .filter(Boolean)
}

function compositeUniqueFields(model: Model): string[][] {
  return model.blockAttributes
    .map((attribute) => /@@unique\(\[([^\]]+)\]/.exec(attribute)?.[1])
    .filter((fields): fields is string => fields !== undefined)
    .map((fields) =>
      fields
        .split(",")
        .map((fieldName) => fieldName.trim())
        .filter(Boolean),
    )
}

function hasUniqueRelationFields(model: Model, relationFields: string[]) {
  if (relationFields.length === 0) {
    return false
  }

  if (relationFields.length === 1) {
    const field = model.fields.find(({ name }) => name === relationFields[0])

    if (field?.attributes.includes("@unique")) {
      return true
    }
  }

  return compositeUniqueFields(model).some(
    (uniqueFields) =>
      uniqueFields.length === relationFields.length &&
      uniqueFields.every((fieldName, index) => fieldName === relationFields[index]),
  )
}

function collectRelations(models: Model[]) {
  const modelNames = new Set(models.map(({ name }) => name))
  const relations: Relation[] = []

  for (const model of models) {
    for (const field of model.fields) {
      if (scalarTypes.has(field.baseType) || field.isArray || !modelNames.has(field.baseType)) {
        continue
      }

      const fields = relationFieldNames(field)

      if (fields.length === 0) {
        continue
      }

      relations.push({
        sourceModel: model.name,
        targetModel: field.baseType,
        fieldName: field.name,
        relationFields: fields,
        isOptional: field.isOptional,
      })
    }
  }

  return relations
}

function keyForField(model: Model, field: Field, relations: Relation[]) {
  const keys: string[] = []

  if (field.attributes.includes("@id")) {
    keys.push("PK")
  }

  if (field.attributes.includes("@unique")) {
    keys.push("UK")
  }

  if (
    relations.some(
      (relation) =>
        relation.sourceModel === model.name && relation.relationFields.includes(field.name),
    )
  ) {
    keys.push("FK")
  }

  return keys.join(",")
}

function renderModel(model: Model, relations: Relation[]) {
  const scalarFields = model.fields.filter((field) => scalarTypes.has(field.baseType))
  const lines = [`    ${model.name} {`]

  for (const field of scalarFields) {
    const key = keyForField(model, field, relations)
    const type = mermaidTypes[field.baseType] ?? field.baseType.toLowerCase()

    lines.push(`        ${type} ${field.name}${key ? ` ${key}` : ""}`)
  }

  lines.push("    }")

  return lines.join("\n")
}

function renderRelation(modelByName: Map<string, Model>, relation: Relation) {
  const sourceModel = modelByName.get(relation.sourceModel)
  const isUnique = sourceModel
    ? hasUniqueRelationFields(sourceModel, relation.relationFields)
    : false
  const parentCardinality = relation.isOptional ? "|o" : "||"
  const childCardinality = isUnique ? "o|" : "o{"

  return `    ${relation.targetModel} ${parentCardinality}--${childCardinality} ${relation.sourceModel} : "${relation.fieldName}"`
}

function renderDiagram(models: Model[]) {
  const relations = collectRelations(models)
  const modelByName = new Map(models.map((model) => [model.name, model]))
  const body = [
    "erDiagram",
    ...models.map((model) => renderModel(model, relations)),
    ...relations.map((relation) => renderRelation(modelByName, relation)),
  ].join("\n\n")

  return [
    "<!-- Generated by `pnpm db:diagram`. Do not edit manually. -->",
    "",
    "```mermaid",
    body,
    "```",
    "",
  ].join("\n")
}

async function main() {
  const schema = await readFile(schemaPath, "utf8")
  const diagram = renderDiagram(parseModels(schema))

  await writeFile(diagramPath, diagram)

  console.log(`Generated ${path.relative(process.cwd(), diagramPath)}`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
