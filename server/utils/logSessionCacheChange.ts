import logger from '../../logger'
import { getDataValue } from './getDataValue'

// Convention for tracing session.data reads/writes across the codebase (permanent, not
// diagnostic-only). Never log actual session values (names, emails, staff lists etc.) - only
// paths, booleans and identifiers (uuid/username/crn). Every entry is logged with both a
// structured field object (so it can be queried in App Insights via customDimensions, e.g.
// `customDimensions.action == "overwritten"`) and a short human-readable message (so it's easy
// to scan when reading raw logs). `action=unchanged` and "nothing missing" are logged at debug
// level since they're the expected/common case; anything actionable (overwritten, cleared, or a
// missing field) is logged at info level so it stands out by default.

export type SessionCacheAction = 'added' | 'overwritten' | 'unchanged' | 'cleared'

export type SessionCacheLogContext = {
  uuid?: string
  username?: string
  crn?: string
}

// MoJ CRN format: one letter followed by 6 digits (e.g. X991651).
const CRN_PATTERN = /^[A-Za-z]\d{6}$/
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Builds a short, consistent path string for logging: keeps the real shape/depth of the
// session.data path (e.g. `appointments.CRN.UUID.user.providerCode`) so it still accurately
// reflects the structure being traversed, but replaces the actual crn/uuid values with fixed
// placeholders. This keeps every path well under bunyan-format's 50-character threshold for
// staying inline (see comment below), and avoids repeating the same crn/uuid values that are
// already logged as their own structured fields.
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

// Logs whether a session.data write is adding a brand new value, overwriting a different
// existing value, leaving an unchanged value, or clearing a previously-set value.
// Only the source, path, uuid/username/crn context and resulting action are logged - never the
// actual values - to avoid logging any PII while still giving visibility into session cache
// read/write behaviour (e.g. searching App Insights for action=overwritten).
export const logSessionCacheChange = (
  source: string,
  data: unknown,
  path: (string | number)[],
  newValue: unknown,
  context: SessionCacheLogContext = {},
): SessionCacheAction => {
  const previousValue = getDataValue(data, path)
  const hadPrevious = previousValue !== undefined && previousValue !== null
  const hasNew = newValue !== undefined && newValue !== null

  let action: SessionCacheAction
  if (!hadPrevious && hasNew) {
    action = 'added'
  } else if (hadPrevious && !hasNew) {
    action = 'cleared'
  } else if (hadPrevious && hasNew && JSON.stringify(previousValue) !== JSON.stringify(newValue)) {
    action = 'overwritten'
  } else {
    action = 'unchanged'
  }

  // Pull the uuid/crn out of the path automatically when not explicitly supplied, so call sites
  // don't need to repeat values that are already part of the path (e.g. ['appointments', crn, uuid, ...]).
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
  // bunyan-format's "short" mode auto-appends any extra structured fields (source/path/action/
  // uuid/crn/username above) in parentheses at the end of the line, so the message itself only
  // needs to be a short tag - repeating the fields here would just duplicate the same
  // information twice within a single log line.
  const message = `[sessionCache] ${action}`

  // Only "overwritten"/"cleared" are actionable/unexpected enough to warrant info level by
  // default - "added" (first write) and "unchanged" are routine and logged at debug.
  if (action === 'overwritten' || action === 'cleared') {
    logger.info(fields, message)
  } else {
    logger.debug(fields, message)
  }
  return action
}

// Logs which of a set of named fields are present/missing, both as structured booleans (for
// querying, e.g. `customDimensions.teamCodePresent == false`) and as a concise "missing=[...]"
// summary in the message, so a single glance shows exactly what's absent instead of having to
// scan a long line of `xPresent=true` flags to spot the one that's false.
export const logFieldPresence = (
  source: string,
  fields: Record<string, unknown>,
  context: SessionCacheLogContext = {},
): Record<string, boolean> => {
  const presence: Record<string, boolean> = {}
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
  // Same reasoning as logSessionCacheChange - bunyan-format auto-appends the structured fields
  // (including `missing`) at the end of the line, so the message just needs a short tag plus
  // the summary isn't required for filtering, only for a fast human glance while scrolling logs.
  const message = `[sessionCachePresence] ${summary}`

  // Missing fields are the actionable/interesting case - log at info so they stand out.
  // Nothing missing is the routine/expected case - log at debug.
  if (missing.length) {
    logger.info(structuredFields, message)
  } else {
    logger.debug(structuredFields, message)
  }
  return presence
}
