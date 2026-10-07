import { Request, Response, NextFunction } from 'express'
import { setDataValue, toIsoDateFromPicker } from '../utils'

export const routeChangeSmsConsent = (req: Request, res: Response, next: NextFunction) => {
  const { body, url } = req
  const { crn, id } = req.params as Record<string, string>
  if (body?.['submit-btn'] === '') {
    return next()
  }

  const date = req?.body?.appointments?.[crn]?.[id]?.date
    ? toIsoDateFromPicker(req.body.appointments[crn][id].date)
    : ''
  const start = req?.body?.appointments?.[crn]?.[id]?.start || ''
  const end = req?.body?.appointments?.[crn]?.[id]?.end || ''
  const path = ['appointments', crn, id]
  setDataValue(req.session.data, [...path, 'temp', 'changeSmsConsentLinkClicked'], true)
  setDataValue(req.session.data, [...path, 'date'], date)
  setDataValue(req.session.data, [...path, 'start'], start)
  setDataValue(req.session.data, [...path, 'end'], end)
  if (req?.body?.appointments?.[crn]?.[id]?.user?.locationCode) {
    setDataValue(req.session.data, [...path, 'user', 'locationCode'], req.body.appointments[crn][id].user.locationCode)
  }
  const redirectUrl = `/case/${crn}/personal-details/${id}/edit-contact-details?origin=allowSms&back=${encodeURIComponent(url)}`
  return res.redirect(redirectUrl)
}
