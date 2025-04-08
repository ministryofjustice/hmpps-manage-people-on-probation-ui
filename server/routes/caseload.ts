import { type Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import type { Route } from '../@types'
import controllers from '../controllers'

export default function caseloadRoutes(router: Router, { hmppsAuthClient }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: Route<void>) => router.post(path, asyncMiddleware(handler))

  post('/case', controllers.caseload.postCase(hmppsAuthClient))

  get('/case', controllers.caseload.getCase(hmppsAuthClient))

  get('/caseload/appointments/*', controllers.caseload.userSchedule(hmppsAuthClient))

  get('/teams', controllers.caseload.getTeams(hmppsAuthClient))

  get('/change-team', controllers.caseload.getChangeTeam(hmppsAuthClient))

  get('/team/case', controllers.caseload.getTeamCase(hmppsAuthClient))

  post('/team/case', controllers.caseload.postTeamCase(hmppsAuthClient))

  get('/recent-cases', controllers.caseload.getRecentCases(hmppsAuthClient))

  post('/check-access', controllers.caseload.checkAccess(hmppsAuthClient))
}
