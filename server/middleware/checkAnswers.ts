import { NextFunction, Request } from 'express'
import { getDataValue, getPersonLevelTypes, setDataValue } from '../utils'
import { AppResponse } from '../models/Locals'
import { AppointmentSession } from '../models/Appointments'

export const checkAnswers = (req: Request, res: AppResponse, next: NextFunction) => {
  const { change } = req.query
  if (change) {
    const { data } = req.session
    const { crn, id } = req.params
    let { appointmentTypes } = res.locals
    const { userLocations, appointment } = res.locals
    const session: AppointmentSession = getDataValue(data, ['appointments', crn, id])
    // checkType valid
    if (session?.type) {
      if (session?.eventId === 'PERSON_LEVEL_CONTACT') appointmentTypes = getPersonLevelTypes(appointmentTypes)

      const validType = appointmentTypes.some(appointmentType => appointmentType.code === session.type)
      if (!validType) {
        session.type = null
        res.locals.appointment.type = null
        if (session.user?.locationCode) {
          session.user.locationCode = null
          res.locals.appointment.location = null
          res.locals.appointment.meta.hasLocation = false
        }
      }

      // checkLocation valid
      if (validType && session.user?.locationCode) {
        let validLocation = false
        if (!appointment.type.isLocationRequired && session.user.locationCode === 'NO_LOCATION_REQUIRED') {
          validLocation = true
        } else {
          validLocation = userLocations.some(location => location.code === session.user.locationCode)
        }
        if (!validLocation) {
          session.user.locationCode = null
          res.locals.appointment.location = null
          res.locals.appointment.meta.hasLocation = false
        }
      }
    }
    setDataValue(data, ['appointments', crn, id], session)
  }
  return next()
}
