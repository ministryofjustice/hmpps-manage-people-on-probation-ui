import { auditService } from '@ministryofjustice/hmpps-audit-client'
import getPaginationLinks, { Pagination } from '@ministryofjustice/probation-search-frontend/utils/pagination'
import { addParameters } from '@ministryofjustice/probation-search-frontend/utils/url'
import { v4 } from 'uuid'
import config from '../config'
import MasApiClient from '../data/masApiClient'
import type { UserActivity } from '../data/model/userSchedule'
import { getSearchParamsString, checkRecentlyViewedAccess } from '../utils'
import { Controller } from '../@types'
import { UserCaseload, CaseSearchFilter, ErrorMessages } from '../data/model/caseload'
import logger from '../../logger'
import { RecentlyViewedCase } from '../data/model/caseAccess'

const colNames = ['name', 'dob', 'sentence', 'appointment', 'date']

const directions = {
  asc: 'ascending',
  desc: 'descending',
}

type ColName = (typeof colNames)[number]
type SortDir = 'asc' | 'desc'

const routes = [
  'showCaseload',
  'postCase',
  'getCase',
  'userSchedule',
  'getTeams',
  'getChangeTeam',
  'getTeamCase',
  'postTeamCase',
  'getRecentCases',
  'checkAccess',
] as const

interface Args {
  caseload: UserCaseload
  filter: CaseSearchFilter
}

const caseloadController: Controller<typeof routes, Args> = {
  showCaseload: () => {
    return async (req, res, _next, args) => {
      const { caseload, filter } = args
      let newCaseload = caseload
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
      if (req?.query?.sortBy) {
        newCaseload = {
          ...caseload,
          sortedBy: req.query.sortBy as string,
        }
      }
      res.render('pages/caseload/minimal-cases', {
        pagination,
        caseload: newCaseload,
        currentNavSection,
        filter,
      })
    }
  },
  postCase: hmppsAuthClient => {
    return async (req, res, next) => {
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
      await caseloadController.showCaseload(hmppsAuthClient)(req, res, next, {
        caseload,
        filter: req.session.caseFilter,
      })
    }
  },
  getCase: hmppsAuthClient => {
    return async (req, res, next) => {
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
      await caseloadController.showCaseload(hmppsAuthClient)(req, res, next, {
        caseload,
        filter: req.session.caseFilter,
      })
    }
  },
  userSchedule: hmppsAuthClient => {
    return async (req, res) => {
      const { query, url } = req
      const type = url.split('/').pop().split('?')[0]
      const { page = '', sortBy: sortByQuery = '' } = query as Record<string, string>
      const [name, dir] = sortByQuery.split('.') as [ColName, SortDir]
      let cols = colNames
      if (type === 'no-outcome') {
        cols = cols.filter(col => col !== 'appointment')
      }
      const sortBy = cols.reduce((acc, colName) => {
        const defaultSort = !dir && colName === 'date' ? 'ascending' : 'none'
        return { ...acc, [colName]: name === colName ? directions?.[dir] || defaultSort : defaultSort }
      }, {})
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const ascending = dir ? (dir === 'asc').toString() : ''
      let userSchedule = await masClient.getUserSchedule({
        username: res.locals.user.username,
        type,
        page,
        sortBy: name,
        ascending,
        size: '',
      })
      const appointments: UserActivity[] = userSchedule.appointments.map((appointment: UserActivity) => {
        const [year, month, day] = appointment.dob.split('-')
        return { ...appointment, birthdate: { day, month, year } }
      })
      const baseUrl = req.url.split('?')[0]
      const sortUrl = `${baseUrl}${getSearchParamsString({ req, ignore: ['sortBy'] })}`
      const paginationUrl = `${baseUrl}${getSearchParamsString({ req, ignore: ['page'], suffix: '&', showPrefixIfNoQuery: true })}`
      userSchedule = {
        ...userSchedule,
        appointments,
      }
      return res.render(`pages/caseload/appointments`, { userSchedule, page, type, sortBy, paginationUrl, sortUrl })
    }
  },
  getTeams: hmppsAuthClient => {
    return async (req, res) => {
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      if (req.session.mas === undefined || req.session.mas.team === undefined) {
        const userTeams = await masClient.getUserTeams(res.locals.user.username)
        req.session.mas = { hasStaffRecord: userTeams !== null, teamCount: userTeams?.teams?.length || 0 }
        switch (req.session.mas.teamCount) {
          case 1: {
            req.session.mas.team = userTeams.teams[0].code
            return res.redirect(`/team/case`)
          }
          case 0: {
            return res.redirect(`/team/case`)
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
            return res.render('pages/caseload/select-team', {
              userTeams,
            })
          }
        }
      } else {
        return res.redirect(`/team/case`)
      }
    }
  },
  getChangeTeam: hmppsAuthClient => {
    return async (req, res) => {
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
      return res.render('pages/caseload/select-team', {
        userTeams,
        currentTeam,
      })
    }
  },
  getTeamCase: hmppsAuthClient => {
    return async (req, res) => {
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
    }
  },
  postTeamCase: hmppsAuthClient => {
    return async (req, res) => {
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
    }
  },
  getRecentCases: () => {
    return async (req, res) => {
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
      return res.render('pages/caseload/recent-cases', {
        currentNavSection,
      })
    }
  },
  checkAccess: hmppsAuthClient => {
    return async (req, res) => {
      const recentlyViewed: RecentlyViewedCase[] = req.body
      const crns = recentlyViewed.map(c => c.crn)
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const userAccess = await masClient.checkUserAccess(res.locals.user.username, crns)
      const updated = checkRecentlyViewedAccess(recentlyViewed, userAccess)
      res.send(updated)
    }
  },
}

export default caseloadController
