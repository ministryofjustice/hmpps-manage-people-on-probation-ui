export interface FileUploadResponse {
  file: {
    id: string
    name: string
    size: number
  }
  success?: {
    messageText: string
    messageHtml: string
  }
  error?: {
    message: string
  }
}

export interface FileCache {
  id: string
  fileName: string
  originalName: string
  message?: {
    text?: string
    html?: string
  }
  deleteButton?: {
    text: string
  }
}
