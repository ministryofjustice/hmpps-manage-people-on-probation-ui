import { Request, Response, NextFunction } from 'express'
import { appointmentsValidation, appointmentOutcomesValidation, AppointmentsValidationArgs } from '../properties'
import { getDataValue } from '../utils'

export const forceValidation = (req: Request, res: Response, next: NextFunction): void => {
  const errorKey = (key: string) => key.split('][').join('-').split('[').join('').split(']').join('')

  const { validation } = req.query
  const {
    url,
    session: { data },
  } = req
  const reqUrl = url.split('?')[0]
  const { crn, id: uuid, contactId } = req.params as Record<string, string>
  const id = uuid || contactId
  let errorMessages: Record<string, string> = {}
  if (validation) {
    const args: AppointmentsValidationArgs = { crn, id }
    if (reqUrl.includes('/sentence')) {
      const key = `[appointments][${crn}][${id}][eventId]`
      const { msg } = appointmentsValidation(args)[key].checks[0]
      errorMessages = {
        [errorKey(key)]: msg,
      }
    }
    if (reqUrl.includes('/type-attendance')) {
      const key = `[appointments][${crn}][${id}][type]`
      const { msg } = appointmentsValidation(args)[key].checks[0]
      errorMessages = {
        [errorKey(key)]: msg,
      }
    }
    if (reqUrl.includes('/location-date-time')) {
      const keys = ['date', 'start', 'end']
      keys.forEach(key => {
        const validationKey = `[appointments][${crn}][${id}][${key}]`
        const { msg } = appointmentsValidation(args)[validationKey].checks[0]
        errorMessages[errorKey(validationKey)] = msg
      })
      if (!getDataValue(data, ['appointments', crn, id, 'user', 'locationCode'])) {
        const locationKey = `[appointments][${crn}][${id}][user][locationCode]`
        const { msg } = appointmentsValidation(args)[locationKey].checks[0]
        errorMessages = { ...errorMessages, [errorKey(locationKey)]: msg }
      }
    }

    if (reqUrl.includes('/outcome')) {
      const key = `[appointments][${crn}][${id}][outcome][outcomeType]`
      const { msg } = appointmentOutcomesValidation(args)[key].checks[0]
      errorMessages = {
        [errorKey(key)]: msg,
      }
    }
    if (['/supporting-information', '/add-note'].some(pageUrl => reqUrl.includes(pageUrl))) {
      const key = `[appointments][${crn}][${id}][sensitivity]`
      const { msg } = appointmentsValidation(args)[key].checks[0]
      errorMessages = {
        [errorKey(key)]: msg,
      }
    }
    res.locals.errorMessages = errorMessages
  }
  return next()
}
