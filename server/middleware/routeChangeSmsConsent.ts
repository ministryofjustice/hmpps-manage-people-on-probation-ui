import { Request, Response, NextFunction } from 'express'
import { setDataValue } from '../utils'

export const routeChangeSmsConsent = (req: Request, res: Response, next: NextFunction) => {
  const { body, url } = req
  const { crn, id } = req.params as Record<string, string>
  if (body?.['submit-btn'] === '') {
    return next()
  }
  if (req?.body?.appointments?.[crn]?.[id]?.date) {
    setDataValue(req.session.data, ['appointments', crn, id, 'date'], req.body.appointments[crn][id].date)
  }
  if (req?.body?.appointments?.[crn]?.[id]?.start) {
    setDataValue(req.session.data, ['appointments', crn, id, 'start'], req.body.appointments[crn][id].start)
  }
  if (req?.body?.appointments?.[crn]?.[id]?.end) {
    setDataValue(req.session.data, ['appointments', crn, id, 'end'], req.body.appointments[crn][id].end)
  }
  if (req?.body?.appointments?.[crn]?.[id]?.user.locationCode) {
    setDataValue(
      req.session.data,
      ['appointments', crn, id, 'user', 'locationCode'],
      req.body.appointments[crn][id].user.locationCode,
    )
  }
  const redirectUrl = `/case/${crn}/personal-details/${id}/edit-contact-details?origin=allowSms&back=${url}`
  return res.redirect(redirectUrl)
}
