import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { deleteGuestbookSignatureUseCase } from "@/domains/wedding-sites/application/use-cases/delete-guestbook-signature.use-case"
import { listGuestbookModerationUseCase } from "@/domains/wedding-sites/application/use-cases/list-guestbook-moderation.use-case"
import { listGuestbookPageUseCase } from "@/domains/wedding-sites/application/use-cases/list-guestbook-page.use-case"
import { setGuestbookSignatureStatusUseCase } from "@/domains/wedding-sites/application/use-cases/set-guestbook-signature-status.use-case"
import { signGuestbookUseCase } from "@/domains/wedding-sites/application/use-cases/sign-guestbook.use-case"
import {
  clampGuestbookPage,
  GUESTBOOK_MESSAGE_MAX_LENGTH,
  guestbookPageCount,
  guestbookPaginationItems,
  normalizeGuestbookAuthorName,
  normalizeGuestbookMessage,
  type GuestbookModerationSignature,
  type GuestbookSignature,
} from "@/domains/wedding-sites/domain/guestbook"
import type {
  CreateGuestbookSignatureInput,
  GuestbookRepository,
} from "@/domains/wedding-sites/domain/ports/guestbook.repository"

const WEDDING_ID = "wedding-1"

/**
 * Repositorio en memoria de una sola boda: las firmas se guardan de la más
 * antigua a la más nueva y el tablón público solo ve las publicadas.
 */
function memoryRepository(initial: GuestbookSignature[] = []) {
  const signatures: GuestbookModerationSignature[] = initial.map((signature) => ({
    ...signature,
    status: "published",
    guestId: `guest-${signature.id}`,
    guestName: `Invitado de ${signature.id}`,
  }))
  const created: CreateGuestbookSignatureInput[] = []
  const toPublic = ({ id, authorName, message, createdAt }: GuestbookModerationSignature) => ({
    id,
    authorName,
    message,
    createdAt,
  })
  const find = (weddingId: string, signatureId: string) =>
    weddingId === WEDDING_ID
      ? signatures.find((signature) => signature.id === signatureId)
      : undefined

  const repository: GuestbookRepository = {
    async listPage(weddingId, range) {
      assert.equal(weddingId, WEDDING_ID)
      const published = [...signatures]
        .reverse()
        .filter((signature) => signature.status === "published")

      return {
        signatures: published.slice(range.offset, range.offset + range.limit).map(toPublic),
        total: published.length,
      }
    },
    async create(input) {
      created.push(input)
      const signature: GuestbookModerationSignature = {
        id: `signature-${signatures.length + 1}`,
        authorName: input.authorName,
        message: input.message,
        createdAt: new Date().toISOString(),
        status: "published",
        guestId: input.guestId,
        guestName: input.guestId,
      }
      signatures.push(signature)
      return toPublic(signature)
    },
    async listForModeration(weddingId) {
      return weddingId === WEDDING_ID ? [...signatures].reverse() : []
    },
    async setStatus(weddingId, signatureId, status) {
      const signature = find(weddingId, signatureId)

      if (!signature) {
        return false
      }

      signature.status = status
      return true
    },
    async delete(weddingId, signatureId) {
      const signature = find(weddingId, signatureId)

      if (!signature) {
        return false
      }

      signatures.splice(signatures.indexOf(signature), 1)
      return true
    },
  }

  return { repository, created }
}

function signaturesNamed(count: number): GuestbookSignature[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `s${index + 1}`,
    authorName: `Invitado ${index + 1}`,
    message: `Mensaje ${index + 1}`,
    createdAt: new Date(2026, 9, 16, 12, index).toISOString(),
  }))
}

describe("normalizeGuestbookMessage", () => {
  it("recorta espacios y deja como mucho una línea en blanco seguida", () => {
    assert.equal(
      normalizeGuestbookMessage("  ¡Vivan los novios!   \r\n\r\n\r\n\n  Os queremos  "),
      "¡Vivan los novios!\n\n  Os queremos",
    )
  })

  it("quita caracteres de control pero respeta los saltos de línea", () => {
    assert.equal(normalizeGuestbookMessage("Hola\u0007\nqué tal\u0000"), "Hola\nqué tal")
  })

  it("un mensaje solo de espacios queda vacío", () => {
    assert.equal(normalizeGuestbookMessage(" \n\t \n "), "")
  })
})

describe("normalizeGuestbookAuthorName", () => {
  it("deja el nombre en una línea sin espacios repetidos", () => {
    assert.equal(normalizeGuestbookAuthorName("  Marta \n y   Javi "), "Marta y Javi")
  })
})

describe("paginación del tablón", () => {
  it("siempre hay al menos una página", () => {
    assert.equal(guestbookPageCount(0, 12), 1)
    assert.equal(guestbookPageCount(12, 12), 1)
    assert.equal(guestbookPageCount(13, 12), 2)
  })

  it("lleva cualquier página fuera de rango a una válida", () => {
    assert.equal(clampGuestbookPage(0, 5), 1)
    assert.equal(clampGuestbookPage(9, 5), 5)
    assert.equal(clampGuestbookPage(Number.NaN, 5), 1)
    assert.equal(clampGuestbookPage(2.7, 5), 2)
  })

  it("enseña todas las páginas cuando caben", () => {
    assert.deepEqual(guestbookPaginationItems(1, 1), [1])
    assert.deepEqual(guestbookPaginationItems(2, 4), [1, 2, 3, 4])
  })

  it("resume con huecos y rellena el hueco de una sola página", () => {
    assert.deepEqual(guestbookPaginationItems(1, 9), [1, 2, "gap", 9])
    assert.deepEqual(guestbookPaginationItems(5, 9), [1, "gap", 4, 5, 6, "gap", 9])
    // Entre 1 y 3 solo falta el 2: mejor el número que "…".
    assert.deepEqual(guestbookPaginationItems(4, 9), [1, 2, 3, 4, 5, "gap", 9])
    assert.deepEqual(guestbookPaginationItems(9, 9), [1, "gap", 8, 9])
  })
})

describe("listGuestbookPageUseCase", () => {
  it("devuelve la página pedida, de la firma más nueva a la más antigua", async () => {
    const { repository } = memoryRepository(signaturesNamed(5))
    const result = await listGuestbookPageUseCase({
      guestbookRepository: repository,
      weddingId: WEDDING_ID,
      page: 2,
      pageSize: 2,
    })

    assert.deepEqual(
      result.signatures.map((signature) => signature.name),
      ["Invitado 3", "Invitado 2"],
    )
    assert.equal(result.page, 2)
    assert.equal(result.pageCount, 3)
    assert.equal(result.total, 5)
  })

  it("si la página ya no existe, devuelve la última", async () => {
    const { repository } = memoryRepository(signaturesNamed(5))
    const result = await listGuestbookPageUseCase({
      guestbookRepository: repository,
      weddingId: WEDDING_ID,
      page: 7,
      pageSize: 2,
    })

    assert.equal(result.page, 3)
    assert.deepEqual(
      result.signatures.map((signature) => signature.name),
      ["Invitado 1"],
    )
  })

  it("un tablón vacío es una única página sin firmas", async () => {
    const { repository } = memoryRepository()
    const result = await listGuestbookPageUseCase({
      guestbookRepository: repository,
      weddingId: WEDDING_ID,
      page: 1,
    })

    assert.deepEqual(result, { signatures: [], page: 1, pageCount: 1, total: 0 })
  })
})

describe("signGuestbookUseCase", () => {
  const ana = async (weddingId: string, guestId: string) =>
    weddingId === WEDDING_ID && guestId === "guest-ana" ? { firstName: "Ana" } : null

  it("cuelga la firma con el texto limpio y el nombre elegido", async () => {
    const { repository, created } = memoryRepository()
    const result = await signGuestbookUseCase({
      guestbookRepository: repository,
      findSigner: ana,
      weddingId: WEDDING_ID,
      guestId: "guest-ana",
      authorName: "  Ana  y Juan ",
      message: "  Que seáis muy felices  ",
    })

    assert.equal(result.status, "signed")
    assert.deepEqual(created, [
      {
        weddingId: WEDDING_ID,
        guestId: "guest-ana",
        authorName: "Ana y Juan",
        message: "Que seáis muy felices",
      },
    ])
  })

  it("sin nombre de firma, firma con el nombre del invitado", async () => {
    const { repository, created } = memoryRepository()

    await signGuestbookUseCase({
      guestbookRepository: repository,
      findSigner: ana,
      weddingId: WEDDING_ID,
      guestId: "guest-ana",
      authorName: "   ",
      message: "¡Enhorabuena!",
    })

    assert.equal(created[0]?.authorName, "Ana")
  })

  it("rechaza un guestId que no es de la boda", async () => {
    const { repository, created } = memoryRepository()
    const result = await signGuestbookUseCase({
      guestbookRepository: repository,
      findSigner: ana,
      weddingId: WEDDING_ID,
      guestId: "guest-de-otra-boda",
      authorName: "",
      message: "Hola",
    })

    assert.deepEqual(result, { status: "unknown_guest" })
    assert.equal(created.length, 0)
  })

  it("rechaza mensajes vacíos o demasiado largos sin buscar al invitado", async () => {
    const { repository } = memoryRepository()
    const findSigner = async () => assert.fail("no debería buscar al invitado")

    assert.deepEqual(
      await signGuestbookUseCase({
        guestbookRepository: repository,
        findSigner,
        weddingId: WEDDING_ID,
        guestId: "guest-ana",
        authorName: "",
        message: " \n ",
      }),
      { status: "empty_message" },
    )
    assert.deepEqual(
      await signGuestbookUseCase({
        guestbookRepository: repository,
        findSigner,
        weddingId: WEDDING_ID,
        guestId: "guest-ana",
        authorName: "",
        message: "a".repeat(GUESTBOOK_MESSAGE_MAX_LENGTH + 1),
      }),
      { status: "message_too_long" },
    )
  })
})

describe("moderación del tablón", () => {
  async function publicNames(repository: GuestbookRepository) {
    const page = await listGuestbookPageUseCase({
      guestbookRepository: repository,
      weddingId: WEDDING_ID,
      page: 1,
    })

    return page.signatures.map((signature) => signature.name)
  }

  it("los novios ven todas las firmas con quién firmó y su estado", async () => {
    const { repository } = memoryRepository(signaturesNamed(2))

    await setGuestbookSignatureStatusUseCase({
      guestbookRepository: repository,
      weddingId: WEDDING_ID,
      signatureId: "s1",
      status: "hidden",
    })

    const signatures = await listGuestbookModerationUseCase({
      guestbookRepository: repository,
      weddingId: WEDDING_ID,
    })

    assert.deepEqual(
      signatures.map(({ id, authorName, guestName, status }) => ({
        id,
        authorName,
        guestName,
        status,
      })),
      [
        { id: "s2", authorName: "Invitado 2", guestName: "Invitado de s2", status: "published" },
        { id: "s1", authorName: "Invitado 1", guestName: "Invitado de s1", status: "hidden" },
      ],
    )
  })

  it("una firma oculta desaparece del tablón y vuelve al mostrarla", async () => {
    const { repository } = memoryRepository(signaturesNamed(3))

    assert.equal(
      await setGuestbookSignatureStatusUseCase({
        guestbookRepository: repository,
        weddingId: WEDDING_ID,
        signatureId: "s2",
        status: "hidden",
      }),
      true,
    )
    assert.deepEqual(await publicNames(repository), ["Invitado 3", "Invitado 1"])

    await setGuestbookSignatureStatusUseCase({
      guestbookRepository: repository,
      weddingId: WEDDING_ID,
      signatureId: "s2",
      status: "published",
    })
    assert.deepEqual(await publicNames(repository), ["Invitado 3", "Invitado 2", "Invitado 1"])
  })

  it("borrar una firma la quita del tablón y del panel", async () => {
    const { repository } = memoryRepository(signaturesNamed(2))

    assert.equal(
      await deleteGuestbookSignatureUseCase({
        guestbookRepository: repository,
        weddingId: WEDDING_ID,
        signatureId: "s1",
      }),
      true,
    )
    assert.deepEqual(await publicNames(repository), ["Invitado 2"])
    assert.deepEqual(
      (
        await listGuestbookModerationUseCase({
          guestbookRepository: repository,
          weddingId: WEDDING_ID,
        })
      ).map((signature) => signature.id),
      ["s2"],
    )
  })

  it("no toca firmas de otra boda ni firmas que no existen", async () => {
    const { repository } = memoryRepository(signaturesNamed(1))

    assert.equal(
      await setGuestbookSignatureStatusUseCase({
        guestbookRepository: repository,
        weddingId: "otra-boda",
        signatureId: "s1",
        status: "hidden",
      }),
      false,
    )
    assert.equal(
      await deleteGuestbookSignatureUseCase({
        guestbookRepository: repository,
        weddingId: "otra-boda",
        signatureId: "s1",
      }),
      false,
    )
    assert.equal(
      await deleteGuestbookSignatureUseCase({
        guestbookRepository: repository,
        weddingId: WEDDING_ID,
        signatureId: "no-existe",
      }),
      false,
    )
    assert.deepEqual(await publicNames(repository), ["Invitado 1"])
  })
})
