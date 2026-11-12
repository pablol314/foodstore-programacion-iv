import axios from 'axios'

export function messageFrom(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail: unknown = error.response?.data?.detail
    return typeof detail === 'string' ? detail : error.message
  }
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.'
}
