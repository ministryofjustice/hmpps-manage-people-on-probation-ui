/* eslint-disable no-await-in-loop */
import { Route } from '../../@types'
import { HmppsAuthClient } from '../../data'
import MasApiClient from '../../data/masApiClient'
import { Activity, EnforcementActionsRequest, PutContactRequest } from '../../data/model/schedule'
import { AppointmentOutcomeType, AppointmentSession, EnforcementActionCreatedBy } from '../../models/Appointments'
import { getDataValue, handleQuotes } from '../../utils'
import { renderError } from '../renderError'
import { EnforcementActionCode } from '../../properties/appointment-outcomes'
import { AppointmentOutcomeProps } from '../../models/Locals'

const ENFORCEMENT_LETTER_REQUEST_CODES: EnforcementActionCode[] = ['EA05', 'EA02', 'EA03', 'EA08', 'LCL']

interface PutAppointment {
  id: string
  appointment: AppointmentSession
  notePrepend: string
}

export const handlePutOutcome = (hmppsAuthClient: HmppsAuthClient, addNotes = false): Route<Promise<void>> => {
  return async function handlePutOutcomeInner(req, res, next) {
    const { crn, appointmentSession, notePrepend, contactId, uuid, isValidParams, baseOutcomeUrl, isInPast } =
      res.locals.appointmentOutcome

    let nextAppointmentIsInPast = false
    const { data } = req.session
    const nextAppointment = getDataValue<AppointmentOutcomeProps<Activity>>(data, ['temp', crn, 'nextAppointment'])
    const responseContactId = getDataValue<string>(data, ['temp', crn, 'responseContactId'])
    const isInvalidRequest = Boolean(uuid && !isInPast)
    if (nextAppointment) {
      ;({ isInPast: nextAppointmentIsInPast } = nextAppointment)
    }
    const { put } = req.query
    if (!isInvalidRequest && (!addNotes || Boolean(contactId && put))) {
      if (!isValidParams) {
        return renderError(404)(req, res)
      }
      const appointmentsToPut: PutAppointment[] = [
        { id: contactId || responseContactId, appointment: appointmentSession, notePrepend },
      ]
      if (nextAppointmentIsInPast) {
        appointmentsToPut.push({
          id: responseContactId,
          appointment: nextAppointment.appointmentSession,
          notePrepend: nextAppointment.notePrepend,
        })
      }
      for (const putAppointment of appointmentsToPut) {
        const { id, appointment, notePrepend: putAppointmentNotePrepend } = putAppointment
        const date = appointment?.date
        const time = appointment?.start
        const outcomeType = appointment?.outcome?.outcomeType
        const outcomeCode = appointment?.outcome?.outcomeCode
        const sensitivity = appointment?.sensitivity

        const enforcementActionCode = getMappedEnforcementActionCodes(
          appointment?.outcome?.enforcementActionCode,
          appointment?.outcome?.letterSentBy,
        )
        const alert = enforcementActionCode?.includes('ROM') || false
        let notes = appointment?.notes || ''
        if (putAppointmentNotePrepend) {
          notes = `${putAppointmentNotePrepend}${notes ? `\n${notes}` : ''}`
        } else {
          notes = appointment?.notes || ''
        }

        if (notes) notes = handleQuotes(notes)

        const sensitive = appointment?.sensitivity === 'Yes'
        const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
        const masClient = new MasApiClient(token)
        const outcomeOnly: AppointmentOutcomeType[] = [
          'ATTENDED_COMPLIED',
          'ACCEPTABLE_ABSENCE',
          'ATTENDED_SENT_HOME_SERVICE_ISSUES',
        ]

        // if outcome but no action, check the outcome type does not require an associated action 👇
        const hasEnforcementActions = (enforcementActionCode?.length ?? 0) > 0
        const isOutcomeAppointment = id === contactId
        if (
          !put &&
          isOutcomeAppointment &&
          (!sensitivity ||
            !outcomeCode ||
            (outcomeCode && !hasEnforcementActions && outcomeType && !outcomeOnly.includes(outcomeType)))
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
        await masClient.putContact(id, request)
        if (enforcementActionCode?.length && !put) {
          const enforcementActionsRequest: EnforcementActionsRequest = {
            enforcementActions: enforcementActionCode.map(code => ({ code })),
          }
          await masClient.postEnforcementActions(id, enforcementActionsRequest)
        }
      }
    }
    return next()
  }
}

export function getMappedEnforcementActionCodes(
  enforcementActionCodes: EnforcementActionCode[] = [],
  letterSentBy?: EnforcementActionCreatedBy,
): EnforcementActionCode[] {
  return enforcementActionCodes.map(code =>
    letterSentBy === 'CASE_ADMIN' && ENFORCEMENT_LETTER_REQUEST_CODES.includes(code) ? 'WLS' : code,
  )
}
