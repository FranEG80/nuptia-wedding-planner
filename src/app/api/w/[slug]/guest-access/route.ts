import { createGuestAccessPostHandler } from "@/domains/wedding-sites/adapters/next/guest-access-route"

export const POST = createGuestAccessPostHandler(async (input) => {
  const { verifyGuestPhoneAction } = await import("@/domains/wedding-sites/adapters/next/guest-access-actions")
  return verifyGuestPhoneAction(input)
})
