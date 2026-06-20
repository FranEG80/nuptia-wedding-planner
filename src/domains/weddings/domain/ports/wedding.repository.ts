import type {
  Wedding,
  WeddingMenuDetails,
} from "@/domains/weddings/domain/wedding"

export interface CreateWeddingInput {
  ownerId: string
  partnerNames: [string, string]
  date: string
}

export interface UpdateWeddingInput {
  partnerNames?: [string, string]
  date?: string
  status?: Wedding["status"]
  restaurantId?: string | null
  menuId?: string | null
}

export interface WeddingRepository {
  findCurrentByAppUserId(appUserId: string): Promise<Wedding | null>
  findById(id: string): Promise<Wedding | null>
  findBySlug(slug: string): Promise<Wedding | null>
  findMenuDetailsByWeddingId(weddingId: string): Promise<WeddingMenuDetails | null>
  create(input: CreateWeddingInput): Promise<Wedding>
  update(id: string, input: UpdateWeddingInput): Promise<Wedding | null>
}
