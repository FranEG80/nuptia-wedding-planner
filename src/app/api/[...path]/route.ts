import { apiErrorResponse } from "@/shared/http/api-errors"

function routeNotFound() {
  return apiErrorResponse({
    code: "API_ROUTE_NOT_FOUND",
    message: "Endpoint no encontrado",
    status: 404,
  })
}

export {
  routeNotFound as DELETE,
  routeNotFound as GET,
  routeNotFound as HEAD,
  routeNotFound as OPTIONS,
  routeNotFound as PATCH,
  routeNotFound as POST,
  routeNotFound as PUT,
}
