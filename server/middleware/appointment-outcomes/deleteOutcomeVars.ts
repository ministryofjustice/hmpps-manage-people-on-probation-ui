import { Route } from '../../@types'

export const deleteOutcomeVars = (crn: string): Route<void> => {
  return async function deleteOutcomeVarsInner(req, _res) {
    const nextAppointmentId = req?.session?.data?.temp?.[crn]?.nextAppointmentId
    const linkedContactId = req?.session?.data?.temp?.[crn]?.linkedContactId
    if (nextAppointmentId) {
      delete req.session.data.temp[crn].nextAppointmentId
    }
    if (linkedContactId) {
      delete req.session.data.temp[crn].linkedContactId
    }
  }
}
