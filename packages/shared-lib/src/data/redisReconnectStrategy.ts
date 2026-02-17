import logger from '../logger'

export const reconnectStrategy = (attempts?: number): number | false => {
  // Exponential back off: 20ms, 40ms, 80ms..., capped to retry every 30 seconds
  const nextDelay = Math.min(2 ** attempts * 20, 30000)
  logger.info(`Retry Redis connection attempt: ${attempts}, next attempt in: ${nextDelay}ms`)
  return nextDelay
}
