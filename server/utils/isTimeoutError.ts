export default function isTimeoutError(error: any): boolean {
  const message = String(error?.message ?? '').toLowerCase()

  return error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT' || /timeout of \d+ms exceeded/i.test(message)
}
