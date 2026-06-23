import { Route } from '../../@types'
import { HmppsAuthClient } from '../../data'
import MasApiClient from '../../data/masApiClient'
import { PutContactRequest } from '../../data/model/schedule'
import { AppointmentOutcomeType } from '../../models/Appointments'
import { handleQuotes } from '../../utils'
import { findUncompleted } from '../findUncompleted'
import { renderError } from '../renderError'

type PutContactPromise = ReturnType<MasApiClient['putContact']>

export const handlePutOutcome = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const {
      appointmentSession,
      notePrepend,
      contactId,
      uuid,
      isValidParams,
      baseOutcomeUrl,
      responseContactId,
      isInPast,
    } = res.locals.appointmentOutcome

    /*
     only send request if putting outcome for arranged/rescheduled appt in the past or 
     managed appointment in past or future 👇
     */

    const validRequest = (contactId && responseContactId && isInPast) || (contactId && !responseContactId)

    if (res.locals.flags.enableNonCompliance && validRequest) {
      if (!isValidParams) {
        return renderError(404)(req, res)
      }
      const date = appointmentSession?.date
      const time = appointmentSession?.start
      const outcomeType = appointmentSession?.outcome?.outcomeType
      const outcomeCode = appointmentSession?.outcome?.outcomeCode
      const sensitivity = appointmentSession?.sensitivity
      const enforcementActionCode = appointmentSession?.outcome?.enforcementActionCode
      let notes = appointmentSession?.notes || ''
      if (notes && notePrepend) {
        notes = `${notePrepend}\n${notes}`
      }
      const sensitive = appointmentSession?.sensitivity === 'Yes'
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const outcomeOnly: AppointmentOutcomeType[] = [
        'ATTENDED_COMPLIED',
        'ACCEPTABLE_ABSENCE',
        'ATTENDED_SENT_HOME_SERVICE_ISSUES',
      ]

      // if outcome but no action, check the outcome type does not require an associated action 👇
      if (
        !sensitivity ||
        !outcomeCode ||
        (outcomeCode && !enforcementActionCode && outcomeType && !outcomeOnly.includes(outcomeType))
      ) {
        return res.redirect(`${baseOutcomeUrl}?validation=true`)
      }

      const request: PutContactRequest = {
        date,
        time,
        outcomeCode,
        notes: handleQuotes(notes),
        sensitive,
        alert: false,
      }

      const putRequests: PutContactPromise[] = []
      if (enforcementActionCode?.length) {
        enforcementActionCode.forEach(code => {
          const requestWithAction = { ...request, enforcementActionCode: code }
          putRequests.push(masClient.putContact(contactId, requestWithAction))
        })
      } else {
        putRequests.push(masClient.putContact(contactId, request))
      }
      await Promise.all(putRequests)
    }
    return next()
  }
}
