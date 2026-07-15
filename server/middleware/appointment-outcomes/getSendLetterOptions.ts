import { Route } from '../../@types'
import { EnforcementActionLetterType } from '../../models/Appointments'
import { Option } from '../../models/Option'
import { letterSentByOptions, letterTypeOptions as _letterTypeOptions } from '../../properties/appointment-outcomes'
import { validEnforcementActionOptions } from '../../utils'

export const getSendLetterOptions: Route<void> = (_req, res, next) => {
  const {
    sentence: { type: sentenceType, youth, pss },
    sendLetter,
    sendBreachOrRecallLetter,
    appointmentSession,
  } = res.locals.appointmentOutcome

  let filteredLetterTypeOptions: Option<EnforcementActionLetterType>[]

  const letterTypeOptions = validEnforcementActionOptions<EnforcementActionLetterType>(
    appointmentSession?.outcome?.contactOutcomes,
    _letterTypeOptions,
  )

  if (sendBreachOrRecallLetter || (sendLetter && sentenceType === 'CUSTODY')) {
    filteredLetterTypeOptions = (letterTypeOptions as Option<EnforcementActionLetterType>[]).filter(typeOption =>
      ['LICENCE_COMPLIANCE_LETTER_SENT', 'OTHER_ENFORCEMENT_LETTER_SENT'].includes(typeOption.value),
    )
  }
  if (sendLetter && sentenceType === 'COMMUNITY') {
    filteredLetterTypeOptions = (letterTypeOptions as Option<EnforcementActionLetterType>[]).filter(typeOption =>
      ['FIRST_WARNING_LETTER_SENT', 'BREACH_LETTER_SENT', 'OTHER_ENFORCEMENT_LETTER_SENT'].includes(typeOption.value),
    )
  }
  if (sendLetter && (pss || (sentenceType === 'CUSTODY' && youth))) {
    filteredLetterTypeOptions = (letterTypeOptions as Option<EnforcementActionLetterType>[]).filter(typeOption =>
      ['FIRST_WARNING_LETTER_SENT', 'SECOND_WARNING_LETTER_SENT', 'OTHER_ENFORCEMENT_LETTER_SENT'].includes(
        typeOption.value,
      ),
    )
  }
  if (sendBreachOrRecallLetter && (sentenceType === 'COMMUNITY' || pss || youth)) {
    filteredLetterTypeOptions = (letterTypeOptions as Option<EnforcementActionLetterType>[]).filter(typeOption =>
      ['BREACH_LETTER_SENT', 'OTHER_ENFORCEMENT_LETTER_SENT'].includes(typeOption.value),
    )
  }
  res.locals.appointmentOutcome = {
    ...res.locals.appointmentOutcome,
    letterSentByOptions,
    letterTypeOptions: filteredLetterTypeOptions,
  }
  return next()
}
