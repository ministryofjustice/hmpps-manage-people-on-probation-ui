import { Route } from '../../@types'
import { HmppsAuthClient } from '../../data'
import MasApiClient from '../../data/masApiClient'
import { EnforcementActionsRequest, PutContactRequest } from '../../data/model/schedule'
import { AppointmentOutcomeType } from '../../models/Appointments'
import { handleQuotes } from '../../utils'
import { renderError } from '../renderError'

export const handlePutOutcome = (hmppsAuthClient: HmppsAuthClient, addNotes = false): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { appointmentSession, notePrepend, contactId, isValidParams, baseOutcomeUrl, responseContactId, isInPast } =
      res.locals.appointmentOutcome

    /*
     only send request if putting outcome for arranged/rescheduled appt in the past or 
     managed appointment in past or future 👇
     */

    const { put } = req.query
    const validRequest =
      (contactId && responseContactId && isInPast && !addNotes) ||
      (contactId && !responseContactId && !addNotes) ||
      (contactId && addNotes && put)
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
      const alert = enforcementActionCode?.includes('ROM') || false
      let notes = ''
      if (!responseContactId) {
        notes = appointmentSession?.notes || ''
      }
      if (notePrepend) {
        notes = `${notePrepend}${notes ? `\n${notes}` : ''}`
      } else {
        notes = appointmentSession?.notes || ''
      }

      if (notes) notes = handleQuotes(notes)

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
        !put &&
        (!sensitivity ||
          !outcomeCode ||
          (outcomeCode && !enforcementActionCode && outcomeType && !outcomeOnly.includes(outcomeType)))
      ) {
        return res.redirect(`${baseOutcomeUrl}?validation=true`)
      }

      const request: PutContactRequest = {
        date,
        time,
        sensitive,
        alert,
        notes,
      }
      if (outcomeCode) request.outcomeCode = outcomeCode
      await masClient.putContact(contactId, request)
      if (enforcementActionCode?.length) {
        const enforcementActionsRequest: EnforcementActionsRequest = {
          enforcementActions: enforcementActionCode.map(code => ({ code })),
        }
        await masClient.postEnforcementActions(contactId, enforcementActionsRequest)
      }
    }
    return next()
  }
}
