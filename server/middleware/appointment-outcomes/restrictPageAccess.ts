import { NextFunction, Request, Response } from 'express'
import { AppointmentOutcomeType, AppointmentEnforcementAction } from '../../models/Appointments'
import { getDataValue } from '../../utils'

interface RestrictionRule {
  url: string
  required?: RestrictionRuleOption
  options?: RestrictionRuleOption[]
}

type Any = '*'

interface RestrictionRuleOption {
  'outcome.outcomeType'?: AppointmentOutcomeType
  'outcome.attendedFailedToComply'?: AppointmentEnforcementAction | Any
  'outcome.acceptableAbsence'?: AppointmentEnforcementAction | Any
  'outcome.unacceptableAbsence'?: AppointmentEnforcementAction | Any
  'outcome.failedToAttend'?: AppointmentEnforcementAction | Any
  'outcome.otherEnforcementAction'?: AppointmentEnforcementAction | Any
  'outcome.breachNSICreatedBy'?: Any
  'outcome.letterType'?: Any
  'outcome.nextAppointment'?: Any
  notes?: Any
  nextAppointment?: Any
}

const any: Any = '*'

export const restrictPageAccess = (req: Request, res: Response, next: NextFunction) => {
  const { url, session, params } = req
  const { crn, id: uuid, contactId } = params
  const id = uuid || contactId
  const { data } = session
  const path = ['appointments', crn, id]
  const appointmentSession = getDataValue(data, path)
  const baseUrl = uuid
    ? `/case/${crn}/arrange-appointment/${uuid}`
    : `/case/${crn}/appointments/appointment/${contactId}`
  const originUrl = uuid ? `${baseUrl}/sentence` : `${baseUrl}/manage`
  const outcomeUrl = `${baseUrl}/outcome`

  if (!appointmentSession?.type || !appointmentSession?.eventId || !appointmentSession?.date) {
    return res.redirect(originUrl)
  }

  if (url.includes('/confirmation') && !appointmentSession) {
    return res.redirect(originUrl)
  }

  const allOptions: RestrictionRuleOption[] = [
    { 'outcome.outcomeType': 'ATTENDED_COMPLIED' },
    { 'outcome.outcomeType': 'ATTENDED_SENT_HOME_SERVICE_ISSUES' },
    {
      'outcome.outcomeType': 'ATTENDED_SENT_HOME_BEHAVIOUR',
      'outcome.attendedFailedToComply': 'SEND_LETTER',
      'outcome.letterType': any,
    },
    {
      'outcome.outcomeType': 'ATTENDED_SENT_HOME_BEHAVIOUR',
      'outcome.attendedFailedToComply': 'BREACH_RECALL_INITIATED',
      'outcome.breachNSICreatedBy': any,
    },
    {
      'outcome.outcomeType': 'ATTENDED_SENT_HOME_BEHAVIOUR',
      'outcome.attendedFailedToComply': 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
      'outcome.letterType': any,
    },
    {
      'outcome.outcomeType': 'ATTENDED_FAILED_TO_COMPLY',
      'outcome.attendedFailedToComply': 'SEND_LETTER',
      'outcome.letterType': any,
    },
    {
      'outcome.outcomeType': 'ATTENDED_FAILED_TO_COMPLY',
      'outcome.attendedFailedToComply': 'BREACH_RECALL_INITIATED',
      'outcome.breachNSICreatedBy': any,
    },
    {
      'outcome.outcomeType': 'ATTENDED_FAILED_TO_COMPLY',
      'outcome.attendedFailedToComply': 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
      'outcome.letterType': any,
    },
    {
      'outcome.outcomeType': 'ATTENDED_FAILED_TO_COMPLY',
      'outcome.attendedFailedToComply': 'REFER_TO_OFFENDER_MANAGER',
    },
    { 'outcome.outcomeType': 'ATTENDED_FAILED_TO_COMPLY', 'outcome.attendedFailedToComply': 'NO_FURTHER_ACTION' },
    {
      'outcome.outcomeType': 'ATTENDED_FAILED_TO_COMPLY',
      'outcome.attendedFailedToComply': 'DIFFERENT_ACTION',
      'outcome.otherEnforcementAction': any,
    },
    { 'outcome.outcomeType': 'ACCEPTABLE_ABSENCE', 'outcome.acceptableAbsence': any },
    {
      'outcome.outcomeType': 'UNACCEPTABLE_ABSENCE',
      'outcome.unacceptableAbsence': 'SEND_LETTER',
      'outcome.letterType': any,
    },
    {
      'outcome.outcomeType': 'UNACCEPTABLE_ABSENCE',
      'outcome.unacceptableAbsence': 'BREACH_RECALL_INITIATED',
      'outcome.breachNSICreatedBy': any,
    },
    {
      'outcome.outcomeType': 'UNACCEPTABLE_ABSENCE',
      'outcome.unacceptableAbsence': 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
      'outcome.letterType': any,
    },
    { 'outcome.outcomeType': 'UNACCEPTABLE_ABSENCE', 'outcome.unacceptableAbsence': 'REFER_TO_OFFENDER_MANAGER' },
    { 'outcome.outcomeType': 'UNACCEPTABLE_ABSENCE', 'outcome.unacceptableAbsence': 'NO_FURTHER_ACTION' },
    {
      'outcome.outcomeType': 'UNACCEPTABLE_ABSENCE',
      'outcome.unacceptableAbsence': 'DIFFERENT_ACTION',
      'outcome.otherEnforcementAction': any,
    },
    { 'outcome.outcomeType': 'FAILED_TO_ATTEND', 'outcome.failedToAttend': 'SEND_LETTER', 'outcome.letterType': any },
    { 'outcome.outcomeType': 'FAILED_TO_ATTEND', 'outcome.failedToAttend': 'DECISION_PENDING_RESPONSE' },
    {
      'outcome.outcomeType': 'FAILED_TO_ATTEND',
      'outcome.failedToAttend': 'DIFFERENT_ACTION',
      'outcome.otherEnforcementAction': any,
    },
    { 'outcome.outcomeType': 'FAILED_TO_ATTEND', 'outcome.failedToAttend': 'REFER_TO_OFFENDER_MANAGER' },
  ]

  const rules: RestrictionRule[] = [
    {
      url: 'attended-failed-to-comply',
      required: { 'outcome.outcomeType': 'ATTENDED_FAILED_TO_COMPLY' },
    },
    {
      url: 'acceptable-absence',
      required: { 'outcome.outcomeType': 'ACCEPTABLE_ABSENCE' },
    },
    {
      url: 'unacceptable-absence',
      required: { 'outcome.outcomeType': 'UNACCEPTABLE_ABSENCE' },
    },
    {
      url: 'failed-to-attend',
      required: { 'outcome.outcomeType': 'FAILED_TO_ATTEND' },
    },
    {
      url: 'enforcement-action',
      options: [
        { 'outcome.outcomeType': 'ATTENDED_FAILED_TO_COMPLY', 'outcome.attendedFailedToComply': 'DIFFERENT_ACTION' },
        { 'outcome.outcomeType': 'UNACCEPTABLE_ABSENCE', 'outcome.unacceptableAbsence': 'DIFFERENT_ACTION' },
        { 'outcome.outcomeType': 'FAILED_TO_ATTEND', 'outcome.failedToAttend': 'DIFFERENT_ACTION' },
      ],
    },
    {
      url: 'initiate-breach-or-recall',
      options: [
        {
          'outcome.outcomeType': 'ATTENDED_FAILED_TO_COMPLY',
          'outcome.attendedFailedToComply': 'BREACH_RECALL_INITIATED',
        },
        { 'outcome.outcomeType': 'UNACCEPTABLE_ABSENCE', 'outcome.unacceptableAbsence': 'BREACH_RECALL_INITIATED' },
      ],
    },
    {
      url: 'send-letter',
      options: [
        {
          'outcome.outcomeType': 'ATTENDED_FAILED_TO_COMPLY',
          'outcome.attendedFailedToComply': 'SEND_LETTER',
        },
        {
          'outcome.outcomeType': 'UNACCEPTABLE_ABSENCE',
          'outcome.unacceptableAbsence': 'SEND_LETTER',
        },
        {
          'outcome.outcomeType': 'FAILED_TO_ATTEND',
          'outcome.failedToAttend': 'SEND_LETTER',
        },
      ],
    },
    {
      url: 'add-note',
      options: allOptions,
    },
    {
      url: 'update-enforcement-action',
      options: [
        { 'outcome.outcomeType': 'ATTENDED_FAILED_TO_COMPLY', 'outcome.attendedFailedToComply': any },
        { 'outcome.outcomeType': 'ATTENDED_FAILED_TO_COMPLY', 'outcome.letterType': any },
        { 'outcome.outcomeType': 'UNACCEPTABLE_ABSENCE', 'outcome.unacceptableAbsence': any },
        { 'outcome.outcomeType': 'UNACCEPTABLE_ABSENCE', 'outcome.letterType': any },
        { 'outcome.outcomeType': 'FAILED_TO_ATTEND', 'outcome.failedToAttend': any },
        { 'outcome.outcomeType': 'FAILED_TO_ATTEND', 'outcome.letterType': any },
      ],
    },
    {
      url: 'next-appointment',
      required: { notes: any },
      options: allOptions,
    },
    {
      url: 'check-your-answers',
      required: { notes: any, 'outcome.nextAppointment': any },
      options: allOptions,
    },
  ]

  let restricted = false

  const checkRequiredValue = (key: keyof RestrictionRuleOption, value: string): boolean => {
    const keys = key.split('.')
    const sessionValue = getDataValue(data, [...path, ...keys])
    let isInvalid = sessionValue === undefined
    if (value !== any) {
      isInvalid = sessionValue !== value
    }
    return isInvalid
  }

  const checkOptions = (options: RestrictionRuleOption[]): boolean => {
    for (const option of options) {
      let isInvalidOption = false
      for (const [key, value] of Object.entries(option) as [keyof RestrictionRuleOption, string][]) {
        isInvalidOption = checkRequiredValue(key, value)
      }
      if (!isInvalidOption) {
        return false
      }
    }
    return true
  }

  for (const rule of rules) {
    if (url.includes(`outcome/${rule.url}`)) {
      if (rule?.required) {
        for (const [key, value] of Object.entries(rule.required) as [keyof RestrictionRuleOption, string][]) {
          restricted = checkRequiredValue(key, value)
        }
      }
      if (rule?.options && !restricted) {
        restricted = checkOptions(rule.options)
      }
    }
  }

  if (restricted) {
    return res.redirect(outcomeUrl)
  }
  return next()
}
