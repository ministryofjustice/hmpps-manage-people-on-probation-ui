import { Route } from '../../@types'
import { EnforcementActionLetterTypeOption } from '../../models/Appointments'
import { letterSentByOptions, letterTypeOptions } from '../../properties/appointment-outcomes'

export const getSendLetterOptions: Route<void> = (_req, res, next) => {
  const {
    sentence: { type: sentenceType },
    sendLetter,
    sendBreachOrRecallLetter,
  } = res.locals.appointmentOutcome

  let filteredLetterTypeOptions: EnforcementActionLetterTypeOption[]

  if (sendBreachOrRecallLetter || (sendLetter && sentenceType === 'CUSTODY')) {
    filteredLetterTypeOptions = letterTypeOptions.filter(typeOption =>
      ['LICENCE_COMPLIANCE_LETTER_SENT', 'OTHER_ENFORCEMENT_LETTER_SENT'].includes(typeOption.value),
    )
  }
  if (sendLetter && sentenceType === 'COMMUNITY') {
    filteredLetterTypeOptions = letterTypeOptions.filter(typeOption =>
      ['FIRST_WARNING_LETTER_SENT', 'BREACH_LETTER_SENT', 'OTHER_ENFORCEMENT_LETTER_SENT'].includes(typeOption.value),
    )
  }
  if (sendLetter && ['PSS', 'YOUTH_CUSTODY'].includes(sentenceType)) {
    filteredLetterTypeOptions = letterTypeOptions.filter(typeOption =>
      [
        'FIRST_WARNING_LETTER_SENT',
        'SECOND_WARNING_LETTER_SENT',
        'BREACH_LETTER_SENT',
        'OTHER_ENFORCEMENT_LETTER_SENT',
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
