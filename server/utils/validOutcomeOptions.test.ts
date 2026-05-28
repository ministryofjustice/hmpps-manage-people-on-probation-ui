import { ContactOutcome } from '../data/model/schedule'
import {
  AcceptableAbsenceOutcomeType,
  AppointmentEnforcementAction,
  AppointmentOutcomeType,
} from '../models/Appointments'
import { Option } from '../models/Option'
import { validOutcomeOptions, validEnforcementActionOptions } from './validOutcomeOptions'

describe('utils/validOutcomeOptions', () => {
  let contactOutcomes: ContactOutcome[] = [
    {
      code: 'ATTC',
      description: 'Attended - Complied',
      enforcementActions: [],
    },
    {
      code: 'AFTC',
      description: 'Attended - Failed To Comply',
      enforcementActions: [],
    },
    {
      code: 'ATSH',
      description: 'Attended - Sent Home (behaviour)',
      enforcementActions: [],
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

/*
describe('utils/validAcceptableAbsenceOutcomeOptions', () => {
  let contactOutcomes: ContactOutcome[] = [
    {
      code: 'AACL',
      description: 'Acceptable Absence - Court/Legal',
      enforcementActions: [],
    },
    {
      code: 'AAEM',
      description: 'Acceptable Absence - Employment',
      enforcementActions: [],
    },
    {
      code: 'AAFC',
      description: 'Acceptable Absence - Family/ Childcare',
      enforcementActions: [],
    },
    {
      code: 'AAHO',
      description: 'Acceptable Absence - Holiday',
      enforcementActions: [],
    },
    {
      code: 'AAME',
      description: 'Acceptable Absence - Medical',
      enforcementActions: [],
    },
  ]

  const acceptableAbsenceOutcomeOptions: Option<AcceptableAbsenceOutcomeType>[] = [
    {
      value: 'ACCEPTABLE_ABSENCE_COURT_LEGAL',
      text: 'Court / legal',
    },
    {
      value: 'ACCEPTABLE_ABSENCE_EMPLOYMENT',
      text: 'Employment',
    },
    {
      value: 'ACCEPTABLE_ABSENCE_FAMILY_CHILDCARE',
      text: 'Family / childcare',
    },
    {
      value: 'ACCEPTABLE_ABSENCE_HOLIDAY',
      text: 'Holiday',
    },
    {
      value: 'ACCEPTABLE_ABSENCE_MEDICAL',
      text: 'Medical',
    },
  ]
  it('should return all the acceptable absence outcome options', () => {
    const validOptions = validAcceptableAbsenceOutcomeOptions(contactOutcomes, acceptableAbsenceOutcomeOptions)
    expect(validOptions).toStrictEqual(acceptableAbsenceOutcomeOptions)
  })
  it('should return only the valid acceptable absence outcome options', () => {
    contactOutcomes = [...contactOutcomes.filter(item => item.code !== 'AAFC')]
    const validOptions = validAcceptableAbsenceOutcomeOptions(contactOutcomes, acceptableAbsenceOutcomeOptions)
    expect(validOptions).toEqual([
      ...acceptableAbsenceOutcomeOptions.slice(0, 2),
      ...acceptableAbsenceOutcomeOptions.slice(3),
    ])
  })
})
  */

describe('utils/validEnforcementActionOptions', () => {
  let contactOutcomes: ContactOutcome[] = [
    {
      code: 'AACL',
      description: 'Acceptable Absence - Court/Legal',
      enforcementActions: [
        { code: 'IBR', description: 'Breach / Recall Initiated', defaultResponsePeriodDays: 7 },
        { code: 'ROM', description: 'Refer to Offender Manager', defaultResponsePeriodDays: 7 },
      ],
    },
    {
      code: 'AAEM',
      description: 'Acceptable Absence - Employment',
      enforcementActions: [
        { code: 'LCL', description: 'Licence Compliance Letter Sent', defaultResponsePeriodDays: 7 },
      ],
    },
    {
      code: 'AAFC',
      description: 'Acceptable Absence - Family/ Childcare',
      enforcementActions: [],
    },
    {
      code: 'AAHO',
      description: 'Acceptable Absence - Holiday',
      enforcementActions: [],
    },
    {
      code: 'AAME',
      description: 'Acceptable Absence - Medical',
      enforcementActions: [],
    },
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
    const validOptions = validEnforcementActionOptions(contactOutcomes, enforcementActionOptions)
    expect(validOptions).toStrictEqual(enforcementActionOptions)
  })
  it('should return only the valid enforcement action options', () => {
    contactOutcomes = contactOutcomes.reduce((acc, outcome, i) => {
      return [
        ...acc,
        { ...outcome, enforcementActions: outcome.enforcementActions.filter(action => action.code !== 'LCL') },
      ]
    }, [])
    const validOptions = validEnforcementActionOptions(contactOutcomes, enforcementActionOptions)
    expect(validOptions).toEqual([...enforcementActionOptions.slice(0, 3), ...enforcementActionOptions.slice(4)])
  })
})
