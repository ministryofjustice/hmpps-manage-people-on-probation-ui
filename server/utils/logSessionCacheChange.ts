import logger from '../../logger'
import { getDataValue } from './getDataValue'

// Tracing helper for session.data reads/writes. Never logs actual values (names, emails,
// staff lists etc.) - only paths, booleans and identifiers (uuid/username/crn).

export type SessionCacheAction = 'added' | 'overwritten' | 'unchanged' | 'cleared' | 'unknown' | 'notEnabled'

export type SessionCacheLogContext = {
  uuid?: string
  username?: string
  crn?: string
  enabled?: boolean
}

// MoJ CRN format: one letter followed by 6 digits (e.g. X991651).
const CRN_PATTERN = /^[A-Za-z]\d{6}$/
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Shortens crn/uuid path segments to CRN/UUID placeholders so paths stay short and inline in
// bunyan-format logs, while the real values are still logged as separate fields.
const buildPathString = (path: (string | number)[], uuid?: string, crn?: string): string =>
  path
    .map(segment => {
      if (typeof segment !== 'string') return segment
      if (uuid && segment === uuid) return 'UUID'
      if (crn && segment === crn) return 'CRN'
      if (UUID_PATTERN.test(segment)) return 'UUID'
      if (CRN_PATTERN.test(segment)) return 'CRN'
      return segment
    })
    .join('.')

// Reference-equality first (cheap, correct for primitives); falls back to JSON.stringify.
// Never throws - returns COMPARISON_FAILED instead of guessing.
const COMPARISON_FAILED = Symbol('comparisonFailed')
const valuesDiffer = (previousValue: unknown, newValue: unknown): boolean | typeof COMPARISON_FAILED => {
  if (previousValue === newValue) return false
  try {
    return JSON.stringify(previousValue) !== JSON.stringify(newValue)
  } catch {
    return COMPARISON_FAILED
  }
}

// Logs whether a session.data write added, overwrote, left unchanged, or cleared a value.
// Only path/action/uuid/username/crn are logged - never the actual values.
// Gated by context.enabled (Flipt `enableSessionCacheLogging`) - missing/false means no-op.
export const logSessionCacheChange = (
  source: string,
  data: unknown,
  path: (string | number)[],
  newValue: unknown,
  context: SessionCacheLogContext = {},
): SessionCacheAction => {
  if (!context.enabled) return 'notEnabled'

  const previousValue = getDataValue(data, path)
  const hadPrevious = previousValue !== undefined && previousValue !== null
  const hasNew = newValue !== undefined && newValue !== null

  let action: SessionCacheAction
  if (!hadPrevious && hasNew) {
    action = 'added'
  } else if (hadPrevious && !hasNew) {
    action = 'cleared'
  } else if (hadPrevious && hasNew) {
    const differs = valuesDiffer(previousValue, newValue)
    if (differs === COMPARISON_FAILED) {
      action = 'unknown'
    } else {
      action = differs ? 'overwritten' : 'unchanged'
    }
  } else {
    action = 'unchanged'
  }

  // Infer uuid/crn from the path when not explicitly supplied.
  const uuid =
    context.uuid ?? path.find((segment): segment is string => typeof segment === 'string' && UUID_PATTERN.test(segment))
  const crn =
    context.crn ?? path.find((segment): segment is string => typeof segment === 'string' && CRN_PATTERN.test(segment))
  const { username } = context
  const pathString = buildPathString(path, uuid, crn)

  const fields = {
    event: 'sessionCache',
    source,
    path: pathString,
    action,
    ...(uuid ? { uuid } : {}),
    ...(crn ? { crn } : {}),
    ...(username ? { username } : {}),
  }
  // bunyan-format auto-appends the fields object, so the message is just a short tag.
  const message = `[sessionCache] ${action}`

  // "overwritten"/"cleared"/"unknown" are actionable - log at info; others are routine debug.
  if (action === 'overwritten' || action === 'cleared' || action === 'unknown') {
    logger.info(fields, message)
  } else {
    logger.debug(fields, message)
  }
  return action
}

// Logs which named fields are present/missing, as structured booleans plus a "missing=[...]" summary.
// Gated by context.enabled (Flipt `enableSessionCacheLogging`) - missing/false means no-op.
export const logFieldPresence = (
  source: string,
  fields: Record<string, unknown>,
  context: SessionCacheLogContext = {},
): Record<string, boolean> => {
  const presence: Record<string, boolean> = {}
  if (!context.enabled) return presence

  const missing: string[] = []
  Object.entries(fields).forEach(([name, value]) => {
    const present = value !== undefined && value !== null
    presence[`${name}Present`] = present
    if (!present) {
      missing.push(name)
    }
  })

  const { uuid, username } = context
  const structuredFields = {
    event: 'sessionCachePresence',
    source,
    ...(uuid ? { uuid } : {}),
    ...(username ? { username } : {}),
    ...presence,
    missing,
  }
  const summary = missing.length ? `missing=[${missing.join(',')}]` : 'missing=[]'
  const message = `[sessionCachePresence] ${summary}`

  // Missing fields are actionable - log at info; nothing missing is routine debug.
  if (missing.length) {
    logger.info(structuredFields, message)
  } else {
    logger.debug(structuredFields, message)
  }
  return presence
}
