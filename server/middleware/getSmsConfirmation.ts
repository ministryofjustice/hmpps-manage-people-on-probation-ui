import { Route } from '../@types'
import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { ErrorSummary, ErrorSummaryItem } from '../data/model/common'
import { SmsPreviewResponse } from '../data/model/OutlookEvent'
import { PersonalDetailsUpdatedResponse } from '../data/model/personalDetails'
import { LastSmsResponse } from '../models/LastSmsResponse'
import { convertToTitleCase, dateWithYear, responseIsErrorSummary } from '../utils'
import { getSmsConfirmationOptions } from './getSmsConfirmationOptions'
import { getSmsPreview } from './getSmsPreview'
import { Option } from '../models/Option'
import logger from '../../logger'

const getPersonalDetailsUpdatedText = (personalDetailsUpdated: PersonalDetailsUpdatedResponse): string =>
  `Personal details last updated: ${dateWithYear(personalDetailsUpdated.updatedDateTime)} by ${convertToTitleCase(personalDetailsUpdated.name.forename)} ${convertToTitleCase(personalDetailsUpdated.name.surname)}`

const getLastSmsText = (lastSms: LastSmsResponse): string | null => {
  const { dateSent: dateSentIso, dateDelivered, dateRetryUntil } = lastSms
  const dateSent = dateSentIso ? dateWithYear(dateSentIso) : null
  const prefix = 'Last text message:'
  if (!lastSms || !dateSent) {
    return `${prefix} none sent in the last 90 days`
  }
  if (dateSent && !dateDelivered && !dateRetryUntil) {
    return `${prefix} sent on ${dateSent} but could not be delivered`
  }
  if (dateSent && dateDelivered) {
    return `${prefix} delivered on ${dateWithYear(dateDelivered)}`
  }
  if (dateSent && dateRetryUntil) {
    return `${prefix} sent on ${dateSent} and attempting delivery until ${dateWithYear(dateRetryUntil)}`
  }
  return null
}

export const getSmsConfirmation = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async function getSmsConfirmationInner(req, res, next) {
    if (res.locals?.flags?.enableAllowSms) {
      const { crn } = req.params as Record<string, string>
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const { case: _case } = res.locals
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
      let lastSmsResponse: LastSmsResponse | ErrorSummary | null
      let lastSms: LastSmsResponse | null

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
          lastSmsResponse = await masClient.getLastSms(crn)
          lastSms = !responseIsErrorSummary<LastSmsResponse>(lastSmsResponse) ? lastSmsResponse : null
          if (lastSms) {
            const text = getLastSmsText(lastSms)
            if (text) overview.push(text)
          }
        } catch (err: any) {
          const error = err as Error
          logger.error(`get last SMS request error: ${error.message}`)
          lastSms = null
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
