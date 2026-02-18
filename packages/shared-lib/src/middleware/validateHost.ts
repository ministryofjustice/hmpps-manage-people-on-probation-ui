import { Route } from '../types/Route'
import { AppResponse } from '../models/Locals'

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
  return (req, res, next): AppResponse | void | null => {
    const host = req.get('host')
    if (!allowedHosts.includes(host as string)) {
      return res.status(400).send('Invalid host')
    }
    if (next) {
      return next()
    }
    return null
  }
}
