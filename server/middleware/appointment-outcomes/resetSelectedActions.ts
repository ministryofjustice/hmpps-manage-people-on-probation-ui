import {
  type EnforcementActionPage,
  enforcementActionPageKeys,
  isEnforcementActionMapKey,
  isEnforcementActionPageKey,
} from '../../models/Appointments'
import { EnforcementActionCode, enforcementActionMap } from '../../properties/appointment-outcomes'
import { setDataValue } from '../../utils'
import { Route } from '../../@types'

export const resetSelectedActions = (actionKeys: EnforcementActionPage[] = null): Route<void> => {
  return (req, res, next) => {
    const actionKeysToReset = actionKeys || enforcementActionPageKeys
    const { appointmentSession, id, crn } = res.locals.appointmentOutcome
    const path = ['appointments', crn, id, 'outcome']
    const { data } = req.session
    const { enforcementActionCode } = appointmentSession.outcome
    const deleteCodes: EnforcementActionCode[] = []
    actionKeysToReset.forEach(actionKey => {
      if (isEnforcementActionMapKey(appointmentSession.outcome[actionKey])) {
        const action = appointmentSession.outcome[actionKey]
        if (action) {
          const code = enforcementActionMap?.[action]?.code
          if (enforcementActionCode?.includes(code)) {
            deleteCodes.push(code)
          }
        }
      }
      if (
        isEnforcementActionPageKey(actionKey) &&
        req?.session?.data?.appointments?.[crn]?.[id]?.outcome?.[actionKey]
      ) {
        delete req.session.data.appointments[crn][id].outcome[actionKey]
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
