import { apiErrorResponse } from "@/shared/http/api-errors"

function apiRootNotFound() {
  return apiErrorResponse({
    code: "API_ROUTE_NOT_FOUND",
    message: "Endpoint no encontrado",
    status: 404,
  })
}

export {
  apiRootNotFound as DELETE,
  apiRootNotFound as GET,
  apiRootNotFound as HEAD,
  apiRootNotFound as OPTIONS,
  apiRootNotFound as PATCH,
  apiRootNotFound as POST,
  apiRootNotFound as PUT,
}
