import * as Sentry from '@sentry/node'
import EMDIClient, { PersonExistsResponse } from '../data/emdiClient'
import logger from '../../logger'
import { standard5xxCodes } from '../data/restClient'

export const existsInEMDI = async (crn: string, token: string): Promise<PersonExistsResponse> => {
  const emdiClient = new EMDIClient(token)
  const result: any = await emdiClient.existsInEMDI(crn)
  if (standard5xxCodes.has(result?.status)) {
    const sentryError =
      result?.error ?? new Error(result?.errors?.[0]?.text ?? 'Electronic monitoring data is currently unavailable.')
    const eventId = Sentry.captureException(sentryError, {
      tags: {
        'http.status': `${result?.status}`,
        'error.type': 'internal_server_error',
        service: 'Electronic monitoring data',
        operation: 'existsInEMDI',
      },
    })
    logger.info(`Sentry eventId: ${eventId}`)
  }
  return { ...result, uri: safeEMDIUri(result?.uri) }
}

const safeEMDIUri = (value?: string): string | undefined => {
  if (!value) return undefined
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') {
      return undefined
    }

    return url.toString()
  } catch {
    return undefined
  }
}
