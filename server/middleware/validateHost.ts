import { AppResponse, Route } from '../@types'

export const allowedHosts = [
  'localhost:3007',
  'localhost:3000',
  'sign-in-dev.hmpps.service.justice.gov.uk',
  'sign-in.hmpps.service.justice.gov.uk',
  'manage-people-on-probation-dev.hmpps.service.justice.gov.uk',
  'manage-people-on-probation-preprod.hmpps.service.justice.gov.uk',
  'manage-people-on-probation.hmpps.service.justice.gov.uk',
]

export default function validateHost(): Route<void> {
  return (req, res, next): AppResponse | void => {
    const host = req.get('host')
    if (!allowedHosts.includes(host)) {
      return res.status(400).send('Invalid host')
    }
    return next()
  }
}
