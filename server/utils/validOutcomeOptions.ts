import {
  AppointmentEnforcementAction,
  EnforcementActionLetterType,
  AppointmentOutcomeType,
} from '../models/Appointments'
import { outcomeMap, enforcementActionMap } from '../properties/appointment-outcomes'
import { ContactEnforcementActions, ContactOutcomes } from '../data/model/schedule'
import { Option } from '../models/Option'

export const validOutcomeOptions = (
  contactOutcomes: ContactOutcomes[],
  options: Option<AppointmentOutcomeType>[],
): Option<AppointmentOutcomeType>[] => {
  const ignore: AppointmentOutcomeType[] = ['WILL_BE_RESCHEDULED']
  if (!contactOutcomes) {
    return options
  }
  return options.filter(
    ({ value }) =>
      (outcomeMap?.[value]?.code &&
        contactOutcomes.some(contactOutcome => contactOutcome?.code === outcomeMap[value].code)) ||
      ignore.includes(value),
  )
}

export const validEnforcementActionOptions = <
  TOption extends AppointmentEnforcementAction | EnforcementActionLetterType,
>(
  contactEnforcementActions: ContactEnforcementActions[],
  options: Option<TOption | ''>[],
): Option<TOption | ''>[] => {
  const ignore: AppointmentEnforcementAction[] = [
    'SEND_LETTER',
    'SEND_ANOTHER_LETTER',
    'NO_FURTHER_ACTION',
    'DIFFERENT_ACTION',
  ]

  if (!contactEnforcementActions) {
    return options
  }
  return options.filter(
    ({ value, divider }) =>
      (value &&
        enforcementActionMap?.[value as TOption]?.code &&
        contactEnforcementActions.some(
          contactEnforcementAction => contactEnforcementAction.code === enforcementActionMap[value as TOption].code,
        )) ||
      !value ||
      divider ||
      (value && ignore.includes(value)),
  )
}
