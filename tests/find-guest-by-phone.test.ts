import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { findGuestByPhoneUseCase } from "@/domains/guests/application/use-cases/find-guest-by-phone.use-case"
import { parsePhoneList } from "@/domains/guests/domain/phone-key"
import type {
  GuestPhoneCandidate,
  GuestRepository,
} from "@/domains/guests/domain/ports/guest.repository"

const WEDDING_ID = "wedding-1"

function repositoryWith(candidates: GuestPhoneCandidate[]) {
  return {
    async listPhoneCandidatesByWeddingId(weddingId: string) {
      assert.equal(weddingId, WEDDING_ID)
      return candidates
    },
  } as unknown as GuestRepository
}

const candidates: GuestPhoneCandidate[] = [
  { id: "guest-ana", firstName: "Ana", role: "primary", phone: "+34 600 11 22 33" },
  { id: "guest-luis", firstName: "Luis", role: "primary", phone: "34611223344" },
  { id: "guest-mario", firstName: "Mario", role: "companion", phone: "600112233" },
  { id: "guest-nuria", firstName: "Nuria", role: "companion", phone: "" },
]

function lookup(phone: string) {
  return findGuestByPhoneUseCase({
    guestRepository: repositoryWith(candidates),
    weddingId: WEDDING_ID,
    phone,
  })
}

describe("findGuestByPhoneUseCase", () => {
  it("encuentra al invitado aunque el número se escriba con otro formato", async () => {
    assert.deepEqual(await lookup("600112233"), {
      status: "found",
      guest: { id: "guest-ana", firstName: "Ana" },
    })
    assert.deepEqual(await lookup("0034 600-11-22-33"), {
      status: "found",
      guest: { id: "guest-ana", firstName: "Ana" },
    })
  })

  it("acepta el número guardado con prefijo internacional sin el signo +", async () => {
    assert.deepEqual(await lookup("+34611223344"), {
      status: "found",
      guest: { id: "guest-luis", firstName: "Luis" },
    })
  })

  it("prefiere al titular cuando varios invitados comparten teléfono", async () => {
    // Mario es acompañante con el mismo número que Ana, pero el titular gana.
    const result = await lookup("600112233")

    assert.equal(result.status, "found")
    assert.equal(result.status === "found" && result.guest.id, "guest-ana")
  })

  it("devuelve not_found cuando el número no está en la lista", async () => {
    assert.deepEqual(await lookup("699999999"), { status: "not_found" })
  })

  it("reconoce a un fotógrafo por su número sin consultar a los invitados", async () => {
    const guestRepository = {
      async listPhoneCandidatesByWeddingId() {
        assert.fail("un fotógrafo no debería buscarse entre los invitados")
      },
    } as unknown as GuestRepository

    assert.deepEqual(
      await findGuestByPhoneUseCase({
        guestRepository,
        weddingId: WEDDING_ID,
        phone: "+34 677 88 99 00",
        photographerPhoneKeys: parsePhoneList("677889900, +34 655 44 33 22"),
      }),
      { status: "photographer" },
    )
  })

  it("rechaza números con menos de 9 cifras sin consultar la lista", async () => {
    const guestRepository = {
      async listPhoneCandidatesByWeddingId() {
        assert.fail("no debería consultar invitados con un teléfono inválido")
      },
    } as unknown as GuestRepository

    assert.deepEqual(
      await findGuestByPhoneUseCase({
        guestRepository,
        weddingId: WEDDING_ID,
        phone: "6001",
      }),
      { status: "invalid_phone" },
    )
  })
})
