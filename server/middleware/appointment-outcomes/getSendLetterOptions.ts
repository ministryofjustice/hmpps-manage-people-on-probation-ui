import { Route } from '../../@types'
import { EnforcementActionLetterTypeOption } from '../../models/Appointments'
import { letterSentByOptions, letterTypeOptions } from '../../properties/appointment-outcomes'

export const getSendLetterOptions: Route<void> = (_req, res, next) => {
  const {
    sentence: { type: sentenceType },
    appointmentSession: {
      outcome: { enforcementAction },
    },
  } = res.locals.appointmentOutcome

  let filteredLetterTypeOptions: EnforcementActionLetterTypeOption[]

  if (
    enforcementAction === 'INITIATE_BREACH_RECALL_AND_SEND_LETTER' ||
    (enforcementAction === 'SEND_LETTER' && sentenceType === 'CUSTODY')
  ) {
    filteredLetterTypeOptions = letterTypeOptions.filter(typeOption =>
      ['LICENCE_COMPLIANCE_LETTER', 'DIFFERENT_ENFORCEMENT_LETTER'].includes(typeOption.value),
    )
  }
  if (enforcementAction === 'SEND_LETTER' && sentenceType === 'COMMUNITY') {
    filteredLetterTypeOptions = letterTypeOptions.filter(typeOption =>
      ['FIRST_WARNING_LETTER', 'BREACH_WARNING_LETTER', 'DIFFERENT_ENFORCEMENT_LETTER'].includes(typeOption.value),
    )
  }
  if (enforcementAction === 'SEND_LETTER' && ['PSS', 'YOUTH_CUSTODY'].includes(sentenceType)) {
    filteredLetterTypeOptions = letterTypeOptions.filter(typeOption =>
      [
        'FIRST_WARNING_LETTER',
        'SECOND_WARNING_LETTER',
        'BREACH_WARNING_LETTER',
        'DIFFERENT_ENFORCEMENT_LETTER',
      ].includes(typeOption.value),
    )
  }
  res.locals.appointmentOutcome = {
    ...res.locals.appointmentOutcome,
    letterSentByOptions,
    letterTypeOptions: filteredLetterTypeOptions,
  }
  return next()
}
