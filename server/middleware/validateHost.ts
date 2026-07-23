import { Route } from '../@types'
import { AppResponse } from '../models/Locals'

export const allowedHosts = [
  'sign-in-dev.hmpps.service.justice.gov.uk',
  'sign-in.hmpps.service.justice.gov.uk',
  'manage-people-on-probation-dev.hmpps.service.justice.gov.uk',
  'manage-people-on-probation-preprod.hmpps.service.justice.gov.uk',
  'manage-people-on-probation.hmpps.service.justice.gov.uk',
]

if (process.env.ENVIRONMENT_NAME === 'local') allowedHosts.push('localhost', 'localhost:3000', 'localhost:3007')

export default function validateHost(): Route<void> {
  return function validateHostInner(req, res, next): AppResponse | void {
    const host = req.get('host')
    if (!allowedHosts.includes(host)) {
      return res.status(400).send('Invalid host')
    }
    return next()
  }
}
