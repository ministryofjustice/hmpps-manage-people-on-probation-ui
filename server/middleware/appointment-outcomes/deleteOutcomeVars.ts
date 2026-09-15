import { Request, Response } from 'express'

export const deleteOutcomeVars = (crn: string) => {
  return async function deleteOutcomeVarsInner(req: Request, _res: Response) {
    const nextAppointmentId = req?.session?.data?.temp?.[crn]?.nextAppointmentId
    const nextAppointment = req?.session?.data?.temp?.[crn]?.nextAppointment
    const linkedContactId = req?.session?.data?.temp?.[crn]?.linkedContactId
    if (nextAppointmentId) {
      delete req.session.data.temp[crn].nextAppointmentId
    }
    if (nextAppointment) {
      delete req.session.data.temp[crn].nextAppointment
    }
    if (linkedContactId) {
      delete req.session.data.temp[crn].linkedContactId
    }
  }
}
