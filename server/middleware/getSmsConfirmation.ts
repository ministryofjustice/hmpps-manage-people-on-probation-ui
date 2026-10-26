import { DateTime } from 'luxon'
import { Route } from '../@types'
import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { ErrorSummary, ErrorSummaryItem } from '../data/model/common'
import { LastSmsStatusResponse, SmsPreviewResponse } from '../data/model/OutlookEvent'
import { PersonalDetailsUpdatedResponse } from '../data/model/personalDetails'
import { convertToTitleCase, dateWithYear, responseIsErrorSummary } from '../utils'
import { getSmsConfirmationOptions } from './getSmsConfirmationOptions'
import { getSmsPreview } from './getSmsPreview'
import { Option } from '../models/Option'
import logger from '../../logger'
import SupervisionAppointmentClient from '../data/SupervisionAppointmentClient'

const getPersonalDetailsUpdatedText = (personalDetailsUpdated: PersonalDetailsUpdatedResponse): string =>
  `Personal details last updated: ${dateWithYear(personalDetailsUpdated.updatedDateTime)} by ${convertToTitleCase(personalDetailsUpdated.name.forename)} ${convertToTitleCase(personalDetailsUpdated.name.surname)}`

const getLastSmsText = (lastSmsStatus: LastSmsStatusResponse | null): string | null => {
  const prefix = 'Last text message:'
  if (!lastSmsStatus?.sentAt) {
    return `${prefix} none sent in the last 90 days`
  }
  const sentAt = dateWithYear(lastSmsStatus.sentAt)
  if (lastSmsStatus.status === 'delivered') {
    const deliveredAt = lastSmsStatus.statusUpdatedAt ?? lastSmsStatus.sentAt
    return `${prefix} delivered on ${dateWithYear(deliveredAt)}`
  }
  if (['permanent-failure', 'temporary-failure', 'technical-failure'].includes(lastSmsStatus.status ?? '')) {
    return `${prefix} sent on ${sentAt} but could not be delivered`
  }
  if (['created', 'sending', 'pending'].includes(lastSmsStatus.status ?? '')) {
    const retryUntil = DateTime.fromISO(lastSmsStatus.sentAt).plus({ hours: 72 }).toISO()
    if (retryUntil) {
      return `${prefix} sent on ${sentAt} and attempting delivery until ${dateWithYear(retryUntil)}`
    }
  }

  return `${prefix} sent on ${sentAt} — delivery status unavailable`
}

export const getSmsConfirmation = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async function getSmsConfirmationInner(req, res, next) {
    if (res.locals?.flags?.enableAllowSms) {
      const { crn } = req.params as Record<string, string>
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const supervisionAppointmentClient = new SupervisionAppointmentClient(token)
      let errors: ErrorSummaryItem[] = null

      const inline = false
      const options = getSmsConfirmationOptions(inline)(req, res) as Option[]
      const previewResponse = await getSmsPreview(hmppsAuthClient, inline)(req, res)
      let preview: SmsPreviewResponse | null
      const overview: string[] = []
      if (responseIsErrorSummary<SmsPreviewResponse>(previewResponse as SmsPreviewResponse | ErrorSummary)) {
        preview = null
        errors = (previewResponse as ErrorSummary).errors
      } else {
        preview = previewResponse as SmsPreviewResponse
      }
      let personalDetailsUpdatedResponse: PersonalDetailsUpdatedResponse | ErrorSummary | null
      let personalDetailsUpdated: PersonalDetailsUpdatedResponse | null
      let lastSmsStatusResponse: LastSmsStatusResponse | ErrorSummary | null
      let lastSmsStatus: LastSmsStatusResponse | null

      try {
        personalDetailsUpdatedResponse = await masClient.getPersonalDetailsUpdated(crn)
        personalDetailsUpdated = !responseIsErrorSummary<PersonalDetailsUpdatedResponse>(personalDetailsUpdatedResponse)
          ? (personalDetailsUpdatedResponse as PersonalDetailsUpdatedResponse)
          : null
        if (personalDetailsUpdated) {
          overview.push(getPersonalDetailsUpdatedText(personalDetailsUpdated))
        }
      } catch (err: any) {
        const error = err as Error
        logger.error(`get personal details updated request error: ${error.message}`)
        personalDetailsUpdated = null
      }

      if (res.locals?.flags?.enableLastTextMessage) {
        try {
          lastSmsStatusResponse = await supervisionAppointmentClient.getLatestSmsStatusByCrn(crn)
          lastSmsStatus = !responseIsErrorSummary<LastSmsStatusResponse>(lastSmsStatusResponse)
            ? lastSmsStatusResponse
            : null

          if (lastSmsStatus) {
            const text = getLastSmsText(lastSmsStatus)
            if (text) overview.push(text)
          } else if (lastSmsStatusResponse === null) {
            const text = getLastSmsText(null)
            if (text) overview.push(text)
          }
        } catch (err: any) {
          const error = err as Error
          logger.error(`get last SMS request error: ${error.message}`)
          lastSmsStatus = null
        }
      }
      res.locals.smsConfirmation = {
        overview,
        options,
        preview,
        errors,
      }
    }
    return next()
  }
}
