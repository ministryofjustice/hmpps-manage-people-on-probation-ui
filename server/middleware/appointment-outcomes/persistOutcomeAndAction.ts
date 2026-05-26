import {
  AppointmentEnforcementAction,
  AppointmentOutcomeType,
  AppointmentSessionOutcome,
  type EnforcementActionPage,
} from '../../models/Appointments'
import {
  attendedFailedToComplyOptions,
  acceptableAbsenceOptions,
  failedToAttendOptions,
  type EnforcementActionCode,
  enforcementActionMap,
  enforcementActionOptions,
  letterTypeOptions,
  OutcomeCode,
  outcomeMap,
} from '../../properties/appointment-outcomes'
import { getDataValue } from '../../utils'
import { Route } from '../../@types'
import { Option } from '../../models/Option'

type OptionsMap = {
  [K in AppointmentOutcomeType]?: { key: EnforcementActionPage; options: Option<AppointmentEnforcementAction>[] }
}
const optionsMap: OptionsMap = {
  ATTENDED_FAILED_TO_COMPLY: { key: 'attendedFailedToComply', options: attendedFailedToComplyOptions() },
  UNACCEPTABLE_ABSENCE: { key: 'unacceptableAbsence', options: attendedFailedToComplyOptions() },
  ACCEPTABLE_ABSENCE: { key: 'acceptableAbsence', options: acceptableAbsenceOptions },
  FAILED_TO_ATTEND: { key: 'failedToAttend', options: failedToAttendOptions() },
}

export const persistOutcomeAndAction = (
  outcome: string,
  actionCode?: EnforcementActionCode,
): Route<AppointmentSessionOutcome> => {
  return (req, _res) => {
    let outcomeType: AppointmentOutcomeType
    let outcomeCode: OutcomeCode
    let outcomeSession: AppointmentSessionOutcome = null
    const { crn, id: uuid, contactId } = req.params as Record<string, string>
    const id = uuid || contactId
    const { data } = req.session
    const path = ['appointments', crn, id, 'outcome']
    const currentOutcome = getDataValue(data, path) || {}
    if (outcome) {
      const contactOutcome = Object.entries(outcomeMap).find(
        ([_key, { description }]) => description.toLowerCase() === outcome.toLowerCase(),
      )
      outcomeType = (contactOutcome?.[0] as AppointmentOutcomeType) || null
      outcomeCode = contactOutcome?.[1]?.code || null
    }
    if (outcomeType && outcomeCode) {
      outcomeSession = {
        ...currentOutcome,
        outcomeType,
        outcomeCode,
      }
      if (actionCode) {
        const match = optionsMap?.[outcomeType]
        if (match) {
          const actionKey = Object.entries(enforcementActionMap).find(([key, { code }]) => code === actionCode)?.[0]
          let actionPageKey: EnforcementActionPage = null
          if (actionKey) {
            if (match.options.find(option => option?.value === actionKey)) {
              actionPageKey = match.key
            } else if (enforcementActionOptions().find(option => option.value === actionKey)) {
              actionPageKey = 'otherEnforcementAction'
            } else if (letterTypeOptions.find(option => option.value === actionKey)) {
              actionPageKey = 'letterType'
            }
            if (actionPageKey) {
              outcomeSession = { ...outcomeSession, [actionPageKey]: actionKey }
            }
          }
        }
      }
    }
    return outcomeSession
  }
}
