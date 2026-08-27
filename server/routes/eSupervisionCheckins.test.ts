import express, { Express, Router } from 'express'
import request from 'supertest'
import type { Services } from '../services'
import config from '../config'
import eSuperVisionCheckInsRoutes from './eSupervisionCheckins'
import { FeatureFlags } from '../data/model/featureFlags'

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
  eSuperVisionCheckInsRoutes(router, {} as Services)
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

const stopPaths = [`/case/${crn}/appointments/check-in/manage/${id}/stop-checkin`]

const restartPaths = [
  `/case/${crn}/appointments/check-in/manage/${id}/restart-checkin`,
  `/case/${crn}/appointments/check-in/manage/${id}/restart-contact`,
  `/case/${crn}/appointments/check-in/manage/${id}/restart-edit-contact`,
  `/case/${crn}/appointments/check-in/manage/${id}/restart-summary`,
  `/case/${crn}/appointments/check-in/manage/${id}/restart-confirmation`,
]

const reviewPaths = [
  `/case/${crn}/appointments/${id}/check-in/update`,
  `/case/${crn}/appointments/${id}/check-in/view`,
  `/case/${crn}/appointments/${id}/check-in/view-expired`,
  `/case/${crn}/appointments/${id}/check-in/review/expired`,
  `/case/${crn}/appointments/${id}/check-in/review/identity`,
  `/case/${crn}/appointments/${id}/check-in/review/notes`,
]

const questionsPaths = [
  `/case/${crn}/appointments/check-in/manage/${id}/questions/start`,
  `/case/${crn}/appointments/check-in/manage/${id}/questions/add`,
  `/case/${crn}/appointments/check-in/manage/${id}/questions/list`,
  `/case/${crn}/appointments/check-in/manage/${id}/questions/1-uuid/edit`,
  `/case/${crn}/appointments/check-in/manage/${id}/questions/1/select`,
  `/case/${crn}/appointments/check-in/manage/${id}/questions/1-uuid/delete`,
  `/case/${crn}/appointments/check-in/manage/${id}/questions/preview/feeling`,
  `/case/${crn}/appointments/check-in/manage/${id}/questions/preview/support`,
]

describe('eSupervisionCheckInsRoutes', () => {
  it('returns 403 when enableESupervisionCheckins is not enabled', async () => {
    const res = await request(appWith({ enableESupervisionCheckins: false })).get(setupPaths[0])

    expect(res.status).toBe(403)
  })

  describe.each([
    ['enableESUPCheckinNewSetup', setupPaths],
    ['enableESUPCheckinNewSettings', settingsPaths],
    ['enableESUPCheckinNewStop', stopPaths],
    ['enableESUPCheckinNewRestart', restartPaths],
    ['enableESUPCheckinNewReview', reviewPaths],
    ['enableESUPCheckinNewQuestions', questionsPaths],
  ])('%s', (flag, paths) => {
    it.each(paths)('redirects %s to the manage check-ins service when the flag is on', async path => {
      const res = await request(appWith({ [flag]: true })).get(path)

      expect(res.status).toBe(302)
      expect(res.headers.location).toBe(`${link}${path}`)
    })

    it.each(paths)('does not redirect %s when the flag is off', async path => {
      const res = await request(appWith({ [flag]: false })).get(path)

      expect(res.status).not.toBe(302)
    })
  })
})
