import { Request, Response, NextFunction } from 'express'
import { setDataValue } from '../utils'

export const routeChangeAttendee = (req: Request, res: Response, next: NextFunction) => {
  const {
    body,
    params,
    query: { change },
    url,
  } = req
  const { crn, id } = params as Record<string, string>
  if (body?.['submit-btn'] === '') {
    return next()
  }
  if (req?.body?.appointments?.[crn]?.[id]?.type) {
    setDataValue(req.session.data, ['appointments', crn, id, 'type'], req.body.appointments[crn][id].type)
  }
  const redirectUrl = `/case/${crn}/arrange-appointment/${id}/attendance${change ? `?change=${encodeURIComponent(url)}` : ''}`
  return res.redirect(redirectUrl)
}
