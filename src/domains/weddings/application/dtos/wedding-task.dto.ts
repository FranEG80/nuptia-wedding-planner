export interface WeddingTask {
  label: string
  done: boolean
}

export const DEFAULT_WEDDING_TASKS: WeddingTask[] = [
  { label: "Subir fotografía de portada", done: true },
  { label: "Confirmar menú con el catering", done: true },
  { label: "Enviar invitaciones restantes", done: false },
  { label: "Cerrar distribución de mesas", done: false },
  { label: "Añadir lista de Spotify", done: false },
]
