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

  const letterTypeOptions = validEnforcementActionOptions<EnforcementActionLetterType>(
    appointmentSession?.outcome?.contactOutcomes,
    _letterTypeOptions,
  )

  const letterSentOption: EnforcementActionLetterType =
    sentenceType === 'COMMUNITY' ? 'BREACH_LETTER_SENT' : 'LICENCE_COMPLIANCE_LETTER_SENT'

  const options: EnforcementActionLetterType[] = []

  // Initiate a breach and send a letter 👇

  if (sendBreachOrRecallLetter) {
    options.push(letterSentOption)
  }

  // send letter 👇

  if (sendLetter) {
    if (sentenceType === 'COMMUNITY' || pss || youth) {
      options.push('FIRST_WARNING_LETTER_SENT')
    }
    if (pss || youth) {
      options.push('SECOND_WARNING_LETTER_SENT')
    }
    options.push(letterSentOption)
  }

  options.push('OTHER_ENFORCEMENT_LETTER_SENT')

  const filteredLetterTypeOptions: Option<EnforcementActionLetterType>[] = (
    letterTypeOptions as Option<EnforcementActionLetterType>[]
  ).filter(typeOption => options.includes(typeOption.value))

  res.locals.appointmentOutcome = {
    ...res.locals.appointmentOutcome,
    letterSentByOptions: letterSentByOptions.map(({ text, value, hint }) => ({ text, value, hint })),
    letterTypeOptions: filteredLetterTypeOptions.map(({ text, value }) => ({ text, value })),
  }
  return next()
}
