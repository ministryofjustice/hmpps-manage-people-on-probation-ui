export default function isTimeoutError(error: { message?: string; code?: string }): boolean {
  const message = String(error?.message ?? '').toLowerCase()

  return (
    error?.code === 'ERR_SOCKET_TIMEOUT' ||
    error?.code === 'ECONNABORTED' ||
    error?.code === 'ETIMEDOUT' ||
    /timeout of \d+ms exceeded/i.test(message)
  )
}
