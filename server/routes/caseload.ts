import { type Router, Request } from 'express'
import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 } from 'uuid'
import { Response, HTTPError } from 'superagent'
import getPaginationLinks, { Pagination } from '@ministryofjustice/probation-search-frontend/utils/pagination'
import { addParameters } from '@ministryofjustice/probation-search-frontend/utils/url'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import MasApiClient from '../data/masApiClient'
import logger from '../../logger'
import { CaseSearchFilter, ErrorMessages, UserCaseload } from '../data/model/caseload'
import config from '../config'
import { RecentlyViewedCase } from '../data/model/caseAccess'
import { checkRecentlyViewedAccess } from '../utils/utils'
import type { AppResponse, Route } from '../@types'
import { UserSchedule } from '../data/model/userSchedule'
import renders from '../controllers/renders'

export default function caseloadRoutes(router: Router, { hmppsAuthClient }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: Route<void>) => router.post(path, asyncMiddleware(handler))

  post('/case', async (req, res, _next) => {
    req.session.caseFilter = {
      nameOrCrn: req.body.nameOrCrn,
      sentenceCode: req.body.sentenceCode,
      nextContactCode: req.body.nextContactCode,
    }
    req.session.page = '1'

    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const pageNum: number = req.session.page
      ? Number.parseInt(req.session.page as string, config.apis.masApi.pageSize)
      : 1

    const caseload = await masClient.searchUserCaseload(
      res.locals.user.username,
      (pageNum - 1).toString(),
      req.session.sortBy,
      req.session.caseFilter,
    )
    await showCaseload(req, res, caseload, req.session.caseFilter)
  })

  get('/case', async (req, res, _next) => {
    req.session.backLink = '/case'
    if (req.query.clear === 'true') {
      req.session.caseFilter = {
        nameOrCrn: null,
        sentenceCode: null,
        nextContactCode: null,
      }
    }

    if (req.session?.sortBy) {
      if (req.query.sortBy && req.query.sortBy !== req.session?.sortBy) {
        req.session.sortBy = req.query.sortBy as string
      }
    } else {
      req.session.sortBy = req.query.sortBy ? (req.query.sortBy as string) : 'nextContact.asc'
    }

    if (req.session?.page) {
      if (req.query.page && req.query.page !== req.session.page) {
        req.session.page = req.query.page as string
      }
    } else {
      req.session.page = req.query.page as string
    }

    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)

    const pageNum: number = req.session.page
      ? Number.parseInt(req.session.page as string, config.apis.masApi.pageSize)
      : 1

    const caseload = await masClient.searchUserCaseload(
      res.locals.user.username,
      (pageNum - 1).toString(),
      req.session.sortBy,
      req.session.caseFilter,
    )
    await showCaseload(req, res, caseload, req.session.caseFilter)
  })

  const showCaseload = async (req: Request, res: AppResponse, caseload: UserCaseload, filter: CaseSearchFilter) => {
    const currentNavSection = 'yourCases'
    await auditService.sendAuditMessage({
      action: 'VIEW_MAS_CASELOAD',
      who: res.locals.user.username,
      subjectId: res.locals.user.username,
      subjectType: 'USER',
      correlationId: v4(),
      service: 'hmpps-manage-people-on-probation-ui',
    })
    const pagination: Pagination = getPaginationLinks(
      req.session.page ? Number.parseInt(req.session.page as string, config.apis.masApi.pageSize) : 1,
      caseload?.totalPages || 0,
      caseload?.totalElements || 0,
      page => addParameters(req, { page: page.toString() }),
      caseload?.pageSize || config.apis.masApi.pageSize,
    )

    res.render('pages/caseload/minimal-cases', {
      pagination,
      caseload,
      currentNavSection,
      filter,
    })
  }

  const isErrorResponse = <TResponse>(response: HTTPError | TResponse): response is HTTPError => {
    return (response as HTTPError)?.status !== undefined
  }

  const isUserScheduleResponse = (response: HTTPError | UserSchedule): response is UserSchedule => {
    return (response as UserSchedule)?.appointments !== undefined
  }

  get('/upcoming-appointments', renders.upcomingAppointments(hmppsAuthClient))

  get('/teams', async (req, res, _next) => {
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)

    if (req.session.mas === undefined || req.session.mas.team === undefined) {
      const userTeams = await masClient.getUserTeams(res.locals.user.username)

      req.session.mas = { hasStaffRecord: userTeams !== null, teamCount: userTeams?.teams?.length || 0 }
      switch (req.session.mas.teamCount) {
        case 1: {
          req.session.mas.team = userTeams.teams[0].code
          res.redirect(`/team/case`)
          break
        }
        case 0: {
          res.redirect(`/team/case`)
          break
        }
        default: {
          await auditService.sendAuditMessage({
            action: 'VIEW_MAS_TEAMS',
            who: res.locals.user.username,
            subjectId: res.locals.user.username,
            subjectType: 'USER',
            correlationId: v4(),
            service: 'hmpps-manage-people-on-probation-ui',
          })
          res.render('pages/caseload/select-team', {
            userTeams,
          })
        }
      }
    } else {
      res.redirect(`/team/case`)
    }
  })

  get('/change-team', async (req, res, _next) => {
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const currentTeam = req.session?.mas?.team ? req.session?.mas?.team : undefined

    await auditService.sendAuditMessage({
      action: 'VIEW_MAS_TEAMS',
      who: res.locals.user.username,
      subjectId: res.locals.user.username,
      subjectType: 'USER',
      correlationId: v4(),
      service: 'hmpps-manage-people-on-probation-ui',
    })
    const userTeams = await masClient.getUserTeams(res.locals.user.username)
    res.render('pages/caseload/select-team', {
      userTeams,
      currentTeam,
    })
  })

  get('/team/case', async (req, res, _next) => {
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    if (req.session.mas === undefined || (req.session.mas.teamCount > 0 && req.session.mas.team === undefined)) {
      res.redirect('/teams')
    } else {
      const teamCode = req.session.mas.team
      const { teamCount, hasStaffRecord } = req.session.mas
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_CASELOAD_TEAM',
        who: res.locals.user.username,
        subjectId: teamCode,
        subjectType: 'TEAM',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const pageNum: number = req.query.page
        ? Number.parseInt(req.query.page as string, config.apis.masApi.pageSize)
        : 1
      const currentNavSection = 'teamCases'
      const caseload =
        teamCount > 0
          ? await masClient.getTeamCaseload(teamCode, (pageNum - 1).toString())
          : { totalPages: 0, totalElements: 0, pageSize: 0 }

      const pagination: Pagination = getPaginationLinks(
        req.query.page ? Number.parseInt(req.query.page as string, config.apis.masApi.pageSize) : 1,
        caseload?.totalPages || 0,
        caseload?.totalElements || 0,
        page => addParameters(req, { page: page.toString() }),
        caseload?.pageSize || config.apis.masApi.pageSize,
      )
      res.render('pages/caseload/minimal-cases', {
        pagination,
        caseload,
        currentNavSection,
        teamCount,
        hasStaffRecord,
      })
    }
  })

  post('/team/case', async (req, res, _next) => {
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const errorMessages: ErrorMessages = {}
    if (req.body['team-code'] == null) {
      logger.info('Team not selected')
      errorMessages.team = { text: 'Please select a team' }
      const userTeams = await masClient.getUserTeams(res.locals.user.username)
      res.render('pages/caseload/select-team', {
        errorMessages,
        userTeams,
      })
    } else {
      req.session.mas.team = req.body['team-code']
      res.redirect(`/teams`)
    }
  })

  get('/recent-cases', async (req, res, _next) => {
    const currentNavSection = 'recentCases'
    req.session.backLink = '/recent-cases'
    await auditService.sendAuditMessage({
      action: 'VIEW_MAS_RECENT_CASES',
      who: res.locals.user.username,
      subjectId: res.locals.user.username,
      subjectType: 'USER',
      correlationId: v4(),
      service: 'hmpps-manage-people-on-probation-ui',
    })

    res.render('pages/caseload/recent-cases', {
      currentNavSection,
    })
  })

  post('/check-access', async (req, res, _next) => {
    const recentlyViewed: RecentlyViewedCase[] = req.body
    const crns = recentlyViewed.map(c => c.crn)
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const userAccess = await masClient.checkUserAccess(res.locals.user.username, crns)
    const updated = checkRecentlyViewedAccess(recentlyViewed, userAccess)
    res.send(updated)
  })
}
