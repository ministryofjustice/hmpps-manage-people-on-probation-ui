import express, { Express, Router } from 'express'
import request from 'supertest'
import type { Services } from '../services'
import config from '../config'
import eSuperVisionCheckInsRoutes from './eSupervisionCheckins'
import { FeatureFlags } from '../data/model/featureFlags'

jest.mock('../controllers', () => ({
  __esModule: true,
  default: {
    checkIns: new Proxy({}, { get: () => () => (_req: unknown, _res: unknown, next: () => void) => next() }),
  },
}))
jest.mock('../middleware', () => {
  const factory = () => (_req: unknown, _res: unknown, next: () => void) => next()
  return { autoStoreSessionData: factory, restrictPageAccess: factory, renderError: factory }
})
jest.mock('../middleware/validation', () => {
  const handler = (_req: unknown, _res: unknown, next: () => void) => next()
  return { __esModule: true, default: { eSuperVision: handler, checkInReview: handler } }
})
jest.mock('../middleware/getCheckIn', () => ({
  getCheckIn: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}))
jest.mock('../middleware/checkinCyaRedirect', () => ({
  postRedirectWizard: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}))
jest.mock('../middleware/getCheckInQuestionsRedirect', () => ({
  getCheckInQuestionsRedirect: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}))

const { link } = config.eSupervisionManageCheckins
const crn = 'X000001'
const id = 'f1654ea3-0abb-46eb-860b-654a96edbe20'

const appWith = (flags: Partial<FeatureFlags>): Express => {
  const app = express()
  app.use((_req, res, next) => {
    res.locals.flags = { enableESupervisionCheckins: true, ...flags } as FeatureFlags
    next()
  })
  const router = Router()
  eSuperVisionCheckInsRoutes(router, { hmppsAuthClient: {} } as unknown as Services)
  app.use(router)
  app.use((_req, res) => res.sendStatus(200))
  return app
}

const setupPaths = [
  `/case/${crn}/appointments/check-in/eligibility-check`,
  `/case/${crn}/appointments/${id}/check-in/eligibility-check`,
  `/case/${crn}/appointments/${id}/check-in/denied-eligibility`,
  `/case/${crn}/appointments/${id}/check-in/full-eligibility`,
  `/case/${crn}/appointments/${id}/check-in/supplementary-eligibility`,
  `/case/${crn}/appointments/${id}/check-in/spo-approval`,
  `/case/${crn}/appointments/${id}/check-in/rationale`,
  `/case/${crn}/appointments/${id}/check-in/date-frequency`,
  `/case/${crn}/appointments/${id}/check-in/contact-preference`,
  `/case/${crn}/appointments/${id}/check-in/edit-contact-preference`,
  `/case/${crn}/appointments/${id}/check-in/photo-options`,
  `/case/${crn}/appointments/${id}/check-in/take-a-photo`,
  `/case/${crn}/appointments/${id}/check-in/upload-a-photo`,
  `/case/${crn}/appointments/${id}/check-in/photo-rules`,
  `/case/${crn}/appointments/${id}/check-in/checkin-summary`,
  `/case/${crn}/appointments/${id}/check-in/confirm-start`,
  `/case/${crn}/appointments/${id}/check-in/confirm-end`,
]

const settingsPaths = [
  `/case/${crn}/appointments/check-in/manage/${id}`,
  `/case/${crn}/appointments/check-in/manage/${id}/settings`,
  `/case/${crn}/appointments/check-in/manage/${id}/contact`,
  `/case/${crn}/appointments/check-in/manage/${id}/edit-contact`,
]

describe('eSupervisionCheckInsRoutes redirect guards', () => {
  describe('enableESUPCheckinNewSetup', () => {
    it.each(setupPaths)('redirects %s to the manage check-ins service when the flag is on', async path => {
      const res = await request(appWith({ enableESUPCheckinNewSetup: true })).get(path)

      expect(res.status).toBe(302)
      expect(res.headers.location).toBe(`${link}${path}`)
    })

    it.each(setupPaths)('serves %s locally when the flag is off', async path => {
      const res = await request(appWith({ enableESUPCheckinNewSetup: false })).get(path)

      expect(res.status).toBe(200)
    })

    it('does not affect the manage settings routes', async () => {
      const res = await request(appWith({ enableESUPCheckinNewSetup: true })).get(
        `/case/${crn}/appointments/check-in/manage/${id}/settings`,
      )

      expect(res.status).toBe(200)
    })
  })

  describe('enableESUPCheckinNewSettings', () => {
    it.each(settingsPaths)('redirects %s to the manage check-ins service when the flag is on', async path => {
      const res = await request(appWith({ enableESUPCheckinNewSettings: true })).get(path)

      expect(res.status).toBe(302)
      expect(res.headers.location).toBe(`${link}${path}`)
    })

    it.each(settingsPaths)('serves %s locally when the flag is off', async path => {
      const res = await request(appWith({ enableESUPCheckinNewSettings: false })).get(path)

      expect(res.status).toBe(200)
    })

    it('does not redirect sibling manage routes owned by other flags', async () => {
      const app = appWith({ enableESUPCheckinNewSettings: true })

      await request(app).get(`/case/${crn}/appointments/check-in/manage/${id}/stop-checkin`).expect(200)
      await request(app).get(`/case/${crn}/appointments/check-in/manage/${id}/restart-checkin`).expect(200)
      await request(app).get(`/case/${crn}/appointments/check-in/manage/${id}/questions/start`).expect(200)
    })
  })
})
