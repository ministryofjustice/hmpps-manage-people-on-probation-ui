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
  return options.filter(
    ({ value }) =>
      outcomeMap?.[value]?.code &&
      contactOutcomes.some(contactOutcome => contactOutcome.code === outcomeMap[value].code),
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
  return options.filter(
    ({ value, divider }) =>
      (value &&
        enforcementActionMap?.[value as TOption]?.code &&
        contactEnforcementActions.some(
          contactEnforcementAction => contactEnforcementAction.code === enforcementActionMap[value as TOption].code,
        )) ||
      divider ||
      (value && ignore.includes(value)),
  )
}
