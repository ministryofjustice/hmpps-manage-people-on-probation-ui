import { Request, Response, NextFunction } from 'express'

export const routeChangeAttendee = (req: Request, res: Response, next: NextFunction) => {
  const {
    body,
    params: { crn, id },
    query: { change },
    url,
  } = req
  if (body?.['submit-btn'] === '') {
    return next()
  }
  const redirectUrl = `/case/${crn}/arrange-appointment/${id}/attendance${change ? `?change=${encodeURIComponent(url)}` : ''}`
  return res.redirect(redirectUrl)
}
