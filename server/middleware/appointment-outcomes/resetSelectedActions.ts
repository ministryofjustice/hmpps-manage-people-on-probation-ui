import {
  AppointmentSessionOutcome,
  AppointmentEnforcementAction,
  appointmentEnforcementActions,
} from '../../models/Appointments'
import { EnforcementActionCode, enforcementActionMap } from '../../properties/appointment-outcomes'
import { setDataValue } from '../../utils'
import { Route } from '../../@types'

const allActionKeys = [
  'attendedFailedToComply',
  'acceptableAbsence',
  'unacceptableAbsence',
  'failedToAttend',
  'otherEnforcementAction',
  'breachNSICreatedBy',
  'letterSentBy',
  'letterType',
] as const satisfies readonly (keyof AppointmentSessionOutcome)[]

type ResettableActionKey = (typeof allActionKeys)[number]

const isEnforcementActionKey = (value: string): value is AppointmentEnforcementAction => {
  return appointmentEnforcementActions.includes(value as AppointmentEnforcementAction)
}

export const resetSelectedActions = (actionKeys: ResettableActionKey[] = null): Route<void> => {
  return (req, res, next) => {
    const ak = []
    const actionKeysToReset = actionKeys || allActionKeys
    const { appointmentSession, id, crn } = res.locals.appointmentOutcome
    const path = ['appointments', crn, id, 'outcome']
    const { data } = req.session
    const { enforcementActionCode } = appointmentSession.outcome
    const deleteCodes: EnforcementActionCode[] = []
    actionKeysToReset.forEach(actionKey => {
      if (isEnforcementActionKey(actionKey)) {
        const action = appointmentSession.outcome[actionKey]
        if (action) {
          const { code } = enforcementActionMap[action]
          if (enforcementActionCode.includes(code)) {
            deleteCodes.push(code)
          }
          setDataValue(data, [...path, actionKey], null)
        }
      }
    })
    if (deleteCodes.length) {
      setDataValue(
        data,
        [...path, 'enforcementActionCode'],
        enforcementActionCode.filter(code => !deleteCodes.includes(code)),
      )
    }
    return next()
  }
}
