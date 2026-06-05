import {
  acceptableAbsenceOutcomeTypes,
  type AcceptableAbsenceOutcomeType,
  type AppointmentEnforcementAction,
  type AppointmentOutcomeType,
  type AppointmentSessionOutcome,
  type OutcomePage,
  type EnforcementActionPage,
} from '../../models/Appointments'
import {
  attendedFailedToComplyOptions,
  failedToAttendOptions,
  enforcementActionOptions,
  letterTypeOptions,
  type EnforcementActionCode,
  type OutcomeCode,
  type AcceptableAbsenceOutcomeCode,
} from '../../properties/appointment-outcomes'
import { getMappedActions, getMappedOutcome } from '../../utils'
import { Option } from '../../models/Option'

type OutcomeType = Extract<
  AppointmentOutcomeType | AcceptableAbsenceOutcomeType,
  'ATTENDED_FAILED_TO_COMPLY' | 'UNACCEPTABLE_ABSENCE' | 'FAILED_TO_ATTEND'
>

type OptionsMap = {
  [K in OutcomeType]: {
    key: EnforcementActionPage
    options: Option<AppointmentEnforcementAction | AcceptableAbsenceOutcomeType>[]
  }
}

const optionsMap: OptionsMap = {
  ATTENDED_FAILED_TO_COMPLY: { key: 'attendedFailedToComply', options: attendedFailedToComplyOptions() },
  UNACCEPTABLE_ABSENCE: { key: 'unacceptableAbsence', options: attendedFailedToComplyOptions() },
  FAILED_TO_ATTEND: { key: 'failedToAttend', options: failedToAttendOptions() },
}

export const persistOutcomeAndAction = ({
  outcome = null,
  actionCode = null,
}: {
  outcome: string | null
  actionCode?: EnforcementActionCode | null
}): AppointmentSessionOutcome => {
  let outcomeType: AppointmentOutcomeType | AcceptableAbsenceOutcomeType
  let outcomeCode: OutcomeCode | AcceptableAbsenceOutcomeCode
  let outcomeSession: AppointmentSessionOutcome = null
  let pageKey: OutcomePage | EnforcementActionPage = null
  let pageValue: AcceptableAbsenceOutcomeType | AppointmentEnforcementAction

  if (outcome) {
    const contactOutcome = getMappedOutcome<AppointmentOutcomeType | AcceptableAbsenceOutcomeType>({
      description: outcome,
    })
    if (contactOutcome) {
      outcomeType = (contactOutcome?.[0] as AppointmentOutcomeType | AcceptableAbsenceOutcomeType) || null
      outcomeCode = (contactOutcome?.[1]?.code as OutcomeCode | AcceptableAbsenceOutcomeCode) || null
    }
    if (acceptableAbsenceOutcomeTypes.includes(outcomeType as AcceptableAbsenceOutcomeType)) {
      pageValue = outcomeType as AcceptableAbsenceOutcomeType
      outcomeType = 'ACCEPTABLE_ABSENCE'
      pageKey = 'acceptableAbsence'
    }
    if (outcomeType && outcomeCode) {
      outcomeSession = {
        outcomeType: outcomeType as AppointmentOutcomeType,
        outcomeCode,
      }
    }
    if (actionCode) {
      const match = optionsMap?.[outcomeType as OutcomeType]
      if (match) {
        const mappedActions = getMappedActions(actionCode)
        pageValue = mappedActions?.[0] ? mappedActions[0][0] : null
        if (pageValue) {
          if (match?.options?.find(option => option?.value === pageValue)) {
            pageKey = match.key
          } else if (letterTypeOptions.find(option => option.value === pageValue)) {
            pageKey = 'letterType'
          } else if (enforcementActionOptions().find(option => option.value === pageValue)) {
            pageKey = 'otherEnforcementAction'
          }
          outcomeSession = { ...outcomeSession, enforcementActionCode: [actionCode] }
        }
      }
    }
    if (pageKey && pageValue) {
      outcomeSession = { ...outcomeSession, [pageKey]: pageValue }
    }
  }
  return outcomeSession
}
