/**
 * Sube un archivo a una URL firmada de R2 con PUT. Usa XMLHttpRequest porque
 * fetch todavía no informa del progreso de subida en todos los navegadores.
 */
export function putFileWithProgress(input: {
  url: string
  file: File
  contentType: string
  onProgress: (fraction: number) => void
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()

    request.open("PUT", input.url)
    // Debe coincidir con el Content-Type firmado en el servidor.
    request.setRequestHeader("Content-Type", input.contentType)
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        input.onProgress(event.loaded / event.total)
      }
    }
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve()
        return
      }

      reject(new Error(`R2 respondió HTTP ${request.status}`))
    }
    request.onerror = () => reject(new Error("Fallo de red al subir la foto"))
    request.onabort = () => reject(new Error("Subida cancelada"))
    request.send(input.file)
  })
}
