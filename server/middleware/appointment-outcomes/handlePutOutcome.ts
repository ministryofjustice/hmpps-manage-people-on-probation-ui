import { Route } from '../../@types'
import { HmppsAuthClient } from '../../data'
import MasApiClient from '../../data/masApiClient'
import { PutContactRequest } from '../../data/model/schedule'
import { AppointmentOutcomeType } from '../../models/Appointments'
import { handleQuotes, setDataValue } from '../../utils'
import { findUncompleted } from '../findUncompleted'
import { renderError } from '../renderError'

type PutContactPromise = ReturnType<MasApiClient['putContact']>

export const handlePutOutcome = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const {
      appointmentSession,
      crn,
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
     managed appointment in past or future
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
      const enforcementActionCode = appointmentSession?.outcome?.enforcementActionCode
      let notes = appointmentSession?.notes || null
      const alert = true
      const sensitive = appointmentSession?.sensitivity === 'Yes'
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const outcomeOnly: AppointmentOutcomeType[] = [
        'ATTENDED_COMPLIED',
        'ACCEPTABLE_ABSENCE',
        'ATTENDED_SENT_HOME_SERVICE_ISSUES',
      ]

      const request: PutContactRequest = {
        date,
        time,
        outcomeCode,
        alert,
        sensitive,
      }
      // if outcome but no action, check the outcome type does not require an associated action 👇
      if (outcomeCode && !enforcementActionCode && outcomeType && !outcomeOnly.includes(outcomeType)) {
        return res.redirect(`${baseOutcomeUrl}?validation=true`)
      }

      // do a required value check only if in manage journey (as not posting the appointment first) 👇

      if (!uuid) {
        const redirect = findUncompleted({ forceValidation: true })(req, res)
        if (redirect) {
          return res.redirect(`${redirect}?validation=true`)
        }
      }

      // if notes and prepend value exists, add it to the notes value 👇

      if (notes) {
        if (notePrepend) {
          notes = `${notePrepend}\n${notes}`
        }
        request.notes = handleQuotes(notes)
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
