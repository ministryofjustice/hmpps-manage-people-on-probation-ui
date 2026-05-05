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
  return options.filter(
    ({ value }) =>
      value &&
      enforcementActionMap?.[value as TOption]?.code &&
      contactEnforcementActions.some(
        contactEnforcementAction => contactEnforcementAction.code === enforcementActionMap[value as TOption].code,
      ),
  )
}
