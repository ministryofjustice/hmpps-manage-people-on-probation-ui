import { Route } from '../../@types'
import {
  AcceptableAbsenceOutcomeType,
  AppointmentEnforcementAction,
  AppointmentOutcomeType,
  AppointmentSessionOutcome,
} from '../../models/Appointments'
import {
  outcomeMap,
  enforcementActionMap,
  OutcomeCode,
  EnforcementActionCode,
  AcceptableAbsenceOutcomeCode,
} from '../../properties/appointment-outcomes'
import { getDataValue, setDataValue } from '../../utils'

export const saveMappedCode = (type: 'OUTCOME' | 'ACCEPTABLE_ABSENCE_OUTCOME' | 'ACTION'): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { crn, id, appointmentSession, reqUrl } = res.locals.appointmentOutcome
    if (!['/add-note', '/next-appointment', '/check-your-answers'].some(url => reqUrl?.includes(url))) {
      const body = req.body as Record<string, any>
      let codeKey: keyof AppointmentSessionOutcome
      let code: OutcomeCode | AcceptableAbsenceOutcomeCode | EnforcementActionCode = null
      let value: string | string[] = null
      if (['OUTCOME', 'ACCEPTABLE_ABSENCE_OUTCOME'].includes(type)) {
        const selectedValue =
          type === 'OUTCOME'
            ? (body.appointments[crn][id].outcome.outcomeType as AppointmentOutcomeType)
            : (body.appointments[crn][id].outcome.acceptableAbsence as AcceptableAbsenceOutcomeType)
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
        // console.log(`SAVE ${type} CODE:`, value)
        setDataValue(data, ['appointments', crn, id, 'outcome', codeKey], value)
      }
    }
    return next()
  }
}
