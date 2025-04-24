import { AppResponse, Route } from '../@types'

export type Host = 'development' | 'production'
type AllowedHosts = {
  [K in Host]: string[]
}

export const allowedHosts: AllowedHosts = {
  production: ['manage-people-on-probation.hmpps.service.justice.gov.uk'],
  development: ['localhost:3007', 'localhost:3000', 'manage-people-on-probation-dev.hmpps.service.justice.gov.uk'],
}

export default function validateHost(): Route<void> {
  return (req, res, next): AppResponse | void => {
    const host = req.get('host')
    const env = process.env.NODE_ENV as Host
    if (!allowedHosts[env].includes(host)) {
      return res.status(400).send('Invalid host')
    }
    return next()
  }
}
