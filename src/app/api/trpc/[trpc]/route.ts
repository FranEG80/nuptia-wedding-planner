import { fetchRequestHandler } from "@trpc/server/adapters/fetch"

import { appRouter } from "@/composition/trpc/app-router"
import { createTRPCContext } from "@/core/trpc/context"

const handler = (request: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: createTRPCContext,
  })

export { handler as GET, handler as POST }
