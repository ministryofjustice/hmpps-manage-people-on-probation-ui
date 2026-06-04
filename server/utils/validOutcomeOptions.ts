import type {
  AppointmentEnforcementAction,
  EnforcementActionLetterType,
  AppointmentOutcomeType,
  AcceptableAbsenceOutcomeType,
} from '../models/Appointments'
import { outcomeMap, enforcementActionMap } from '../properties/appointment-outcomes'
import type { ContactOutcome } from '../data/model/schedule'
import type { Option } from '../models/Option'
import { getContactEnforcementActions } from './getContactEnforcementActions'

export const validOutcomeOptions = <T extends AppointmentOutcomeType | AcceptableAbsenceOutcomeType>(
  contactOutcomes: ContactOutcome[],
  options: Option<T>[],
): Option<T>[] => {
  const ignore: AppointmentOutcomeType[] = ['WILL_BE_RESCHEDULED']
  if (!contactOutcomes?.length) {
    return options
  }
  return options.filter(
    ({ value }) =>
      (outcomeMap?.[value]?.code &&
        contactOutcomes.some(contactOutcome => contactOutcome?.code === outcomeMap[value].code)) ||
      ignore.includes(value as AppointmentOutcomeType) ||
      !outcomeMap?.[value],
  )
}

export const validEnforcementActionOptions = <
  TOption extends AppointmentEnforcementAction | EnforcementActionLetterType,
>(
  contactOutcomes: ContactOutcome[],
  options: Option<TOption | ''>[],
): Option<TOption | ''>[] => {
  const ignore: AppointmentEnforcementAction[] = [
    'SEND_LETTER',
    'SEND_ANOTHER_LETTER',
    'NO_FURTHER_ACTION',
    'DIFFERENT_ACTION',
  ]

  if (!contactOutcomes?.length) {
    return options
  }

  const contactEnforcementActions = getContactEnforcementActions(contactOutcomes)

  return options.filter(
    ({ value, divider }) =>
      (value &&
        enforcementActionMap?.[value]?.code &&
        contactEnforcementActions.some(
          contactEnforcementAction => contactEnforcementAction.code === enforcementActionMap[value].code,
        )) ||
      !value ||
      divider ||
      (value && ignore.includes(value)) ||
      !enforcementActionMap?.[value],
  )
}
