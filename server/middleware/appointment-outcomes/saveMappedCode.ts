import { Route } from '../../@types'
import {
  AppointmentEnforcementAction,
  AppointmentOutcomeType,
  AppointmentSessionOutcome,
} from '../../models/Appointments'
import {
  outcomeMap,
  enforcementActionMap,
  OutcomeCode,
  EnforcementActionCode,
} from '../../properties/appointment-outcomes'
import { setDataValue } from '../../utils'

export const saveMappedCode = (type: 'OUTCOME' | 'ACTION'): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { crn, id, appointmentSession, reqUrl } = res.locals.appointmentOutcome
    if (
      !['/add-note', '/next-appointment', '/check-your-answers', '/confirmation'].some(url => reqUrl?.includes(url))
    ) {
      const body = req.body as Record<string, any>
      let codeKey: keyof AppointmentSessionOutcome
      let code: OutcomeCode | EnforcementActionCode = null
      let value: string | string[] = null
      if (type === 'OUTCOME') {
        const selectedValue = body.appointments[crn][id].outcome.outcomeType as AppointmentOutcomeType
        code = outcomeMap?.[selectedValue]?.code
        codeKey = 'outcomeCode'
        if (code) {
          value = code
        }
      } else {
        const selectedValues = Object.values(body.appointments[crn][id].outcome).filter(val =>
          Object.keys(enforcementActionMap).includes(val as AppointmentEnforcementAction),
        ) as AppointmentEnforcementAction[]
        const codes: EnforcementActionCode[] = []
        selectedValues.forEach(selectedValue => {
          if (enforcementActionMap?.[selectedValue]?.code) {
            codes.push(enforcementActionMap[selectedValue].code)
          }
        })
        codeKey = 'enforcementActionCode'
        if (codes.length) {
          value = appointmentSession?.outcome?.[codeKey]
            ? [...appointmentSession.outcome[codeKey], ...codes]
            : [...codes]
        }
      }
      if (value) {
        const { data } = req.session
        setDataValue(data, ['appointments', crn, id, 'outcome', codeKey], value)
      }
    }
    return next()
  }
}
