import { ContactEnforcementActions, ContactOutcomes } from '../data/model/schedule'
import { AppointmentEnforcementAction, AppointmentOutcomeType } from '../models/Appointments'
import { Option } from '../models/Option'
import { validOutcomeOptions, validEnforcementActionOptions } from './validOutcomeOptions'

describe('utils/validOutcomeOptions', () => {
  let contactOutcomes: Partial<ContactOutcomes[]> = [
    {
      code: 'ATTC',
      description: 'Attended - Complied',
    },
    {
      code: 'AFTC',
      description: 'Attended - Failed To Comply',
    },
    {
      code: 'ATSH',
      description: 'Attended - Sent Home (behaviour)',
    },
  ]
  const outcomeOptions: Option<AppointmentOutcomeType>[] = [
    {
      value: 'ATTENDED_COMPLIED',
      text: 'Attended - complied',
    },
    {
      value: 'ATTENDED_FAILED_TO_COMPLY',
      text: 'Attended - failed to comply',
      hint: {
        text: 'For example, their behaviour was disruptive or they did not follow instructions.',
      },
    },
    {
      value: 'ATTENDED_SENT_HOME_BEHAVIOUR',
      text: 'Attended - sent home (behaviour)',
    },
    {
      value: 'WILL_BE_RESCHEDULED',
      text: 'The appointment will be rescheduled',
    },
  ]
  it('should return all outcome options', () => {
    const validOptions = validOutcomeOptions(contactOutcomes, outcomeOptions)
    expect(validOptions).toStrictEqual(outcomeOptions)
  })
  it('should return only the valid outcome options', () => {
    contactOutcomes = [...contactOutcomes.filter(item => item.code !== 'AFTC')]
    const validOptions = validOutcomeOptions(contactOutcomes, outcomeOptions)
    expect(validOptions).toStrictEqual([outcomeOptions[0], outcomeOptions[2], outcomeOptions[3]])
  })
})

describe('utils/validEnforcementActionOptions', () => {
  let contactEnforcementActions: ContactEnforcementActions[] = [
    { code: 'IBR', description: 'Breach / Recall Initiated', defaultResponsePeriodDays: 7 },
    { code: 'ROM', description: 'Refer to Offender Manager', defaultResponsePeriodDays: 7 },
    { code: 'LCL', description: 'Licence Compliance Letter Sent', defaultResponsePeriodDays: 7 },
  ]

  const enforcementActionOptions: Option<AppointmentEnforcementAction | ''>[] = [
    {
      value: '',
      text: 'Select enforcement action',
    },
    {
      value: 'BREACH_RECALL_INITIATED',
      text: 'Breach/recall initiated',
    },
    {
      value: 'REFER_TO_OFFENDER_MANAGER',
      text: 'Refer to offender manager',
    },
    {
      value: 'LICENCE_COMPLIANCE_LETTER_SENT',
      text: 'Licence compliance letter sent',
    },
    {
      value: 'NO_FURTHER_ACTION',
      text: 'No further action',
    },
    {
      divider: 'or',
    },
    {
      value: 'DIFFERENT_ACTION',
      text: 'I want to add a different action',
    },
  ]

  it('should return all the enforcement action options', () => {
    const validOptions = validEnforcementActionOptions(contactEnforcementActions, enforcementActionOptions)
    expect(validOptions).toStrictEqual(enforcementActionOptions)
  })
  it('should return only the valid enforcement action options', () => {
    contactEnforcementActions = [...contactEnforcementActions.filter(item => item.code !== 'LCL')]
    const validOptions = validEnforcementActionOptions(contactEnforcementActions, enforcementActionOptions)
    expect(validOptions).toEqual([...enforcementActionOptions.slice(0, 3), ...enforcementActionOptions.slice(4)])
  })
})
