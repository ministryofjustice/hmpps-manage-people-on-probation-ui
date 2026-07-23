import { auditService } from '@ministryofjustice/hmpps-audit-client'
import getPaginationLinks, { Pagination } from '@ministryofjustice/probation-search-frontend/utils/pagination'
import { addParameters } from '@ministryofjustice/probation-search-frontend/utils/url'
import { v4 } from 'uuid'
import { DateTime } from 'luxon'
import config from '../config'
import MasApiClient from '../data/masApiClient'
import type { UserActivity, UserSchedule } from '../data/model/userSchedule'
import { checkRecentlyViewedAccess } from '../utils'
import { Controller } from '../@types'
import { CaseSearchFilter, ErrorMessages } from '../data/model/caseload'
import logger from '../../logger'
import { RecentlyViewedCase } from '../data/model/caseAccess'
import { getDateRange, RangeType } from '../utils/getDateRange'
import TierApiClient, { TierCalculations } from '../data/tierApiClient'

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
  'postOutcomesAppointmentsFilter',
] as const

interface Args {
  filter: CaseSearchFilter
}

const caseloadController: Controller<typeof routes, void, Args> = {
  showCaseload: hmppsAuthClient => {
    return async (req, res, _next, args) => {
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)

      const { sortBy: sortByQuery = res.locals?.flags?.enableCaseloadV2 ? 'nameOrCrn.asc' : 'nextContact.asc' } =
        req.query as Record<string, string>
      const pageNum: number = req.query.page
        ? Number.parseInt(req.query.page as string, config.apis.masApi.pageSize)
        : 1

      const caseload = await masClient.searchUserCaseload(
        res.locals.user.username,
        (pageNum - 1).toString(),
        sortByQuery,
        req.session.caseFilter,
      )
      let tiers: TierCalculations
      if (res.locals?.flags?.enableCaseloadV2) {
        const uniqueCrns = [...new Set(caseload?.caseload?.map(item => item.crn))].filter(Boolean)
        const tierClient = new TierApiClient(token)
        tiers = await tierClient.getTiers(uniqueCrns)
      }
      const { filter } = args

      const url = encodeURIComponent(req.url)

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
        req.query.page ? pageNum : 1,
        caseload?.totalPages || 0,
        caseload?.totalElements || 0,
        page => addParameters(req, { page: page.toString() }),
        caseload?.pageSize || 10,
      )
      if (caseload) {
        newCaseload = {
          ...caseload,
          sortedBy: req?.query?.sortBy ? (req.query.sortBy as string) : caseload.sortedBy,
          caseload: caseload?.caseload?.map(val => ({
            ...val,
            newCase: val.allocatedOn ? DateTime.fromISO(val.allocatedOn) >= DateTime.now().minus({ days: 21 }) : false,
            tier: tiers ? tiers[val.crn]?.tierScore : undefined,
          })),
        }
      }
      res.render('pages/caseload/minimal-cases', {
        pagination,
        caseload: newCaseload,
        currentNavSection,
        filter,
        url,
        tiers,
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
      await caseloadController.showCaseload(hmppsAuthClient)(req, res, next, {
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
      await caseloadController.showCaseload(hmppsAuthClient)(req, res, next, {
        filter: req.session.caseFilter,
      })
    }
  },
  userSchedule: hmppsAuthClient => {
    return async (req, res) => {
      const { query, url } = req
      const type = url.split('/').pop().split('?')[0]
      const { sortBy: sortByQuery = '' } = query as Record<string, string>
      const pageNum: number = req.query.page ? Number.parseInt(req.query.page as string, 10) : 1
      const [name, dir] = sortByQuery.split('.') as [ColName, SortDir]
      let cols = colNames
      const outcomeFilter = req.query?.outcomeFilter ?? 'PAST_TWO_YEARS'
      let fromDate
      let toDate
      if (type === 'no-outcome') {
        cols = cols.filter(col => col !== 'appointment')
        if (outcomeFilter && res.locals.flags.enableHomePageOutcomesWithFilter) {
          const result = getDateRange(outcomeFilter as RangeType)
          fromDate = result.fromDate
          toDate = result.toDate
        }
      }
      const sortBy = cols.reduce((acc, colName) => {
        const defaultSort = !dir && colName === 'date' ? 'ascending' : 'none'
        return { ...acc, [colName]: name === colName ? directions?.[dir] || defaultSort : defaultSort }
      }, {})
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const ascending = dir ? (dir === 'asc').toString() : ''
      let userSchedule: UserSchedule = await masClient.getUserSchedule({
        username: res.locals.user.username,
        type,
        page: (pageNum - 1).toString(),
        sortBy: name,
        ascending,
        size: '',
        fromDate,
        toDate,
      })
      const appointments: UserActivity[] = userSchedule.appointments.map((appointment: UserActivity) => {
        const [year, month, day] = appointment.dob.split('-')
        return { ...appointment, birthdate: { day, month, year } }
      })
      let baseUrl = req.url.split('?')[0]
      userSchedule = {
        ...userSchedule,
        appointments,
      }
      if (type === 'no-outcome' && res.locals.flags.enableHomePageOutcomesWithFilter) {
        baseUrl = `${baseUrl}?outcomeFilter=${outcomeFilter}`
      }

      const pagination: Pagination = getPaginationLinks(
        req.query.page ? pageNum : 1,
        userSchedule?.totalPages || 0,
        userSchedule?.totalResults || 0,
        page => addParameters(req, { page: page.toString() }),
        userSchedule?.size || 10,
      )

      return res.render(`pages/caseload/appointments`, {
        userSchedule,
        type,
        sortBy,
        pagination,
        sortUrl: baseUrl,
        url,
        outcomesFilter: outcomeFilter,
      })
    }
  },
  postOutcomesAppointmentsFilter: hmppsAuthClient => {
    return async (req, res) => {
      const { outcomesFilter } = req.body
      const [path, queryString = ''] = req.url.split('?')
      const query = new URLSearchParams(queryString)

      query.set('outcomeFilter', outcomesFilter)

      return res.redirect(`${path}?${query.toString()}`)
    }
  },
  getTeams: hmppsAuthClient => {
    return async (req, res) => {
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      if (req.session?.mas?.team === undefined) {
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
      const currentTeam = req.session?.mas?.team ?? req.session?.mas?.team
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
      let updated: RecentlyViewedCase[] = []
      if (recentlyViewed && recentlyViewed.length > 0) {
        const crns = recentlyViewed.map(c => c.crn)
        const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
        const masClient = new MasApiClient(token)
        const userAccess = await masClient.checkUserAccess(res.locals.user.username, crns)
        updated = checkRecentlyViewedAccess(recentlyViewed, userAccess)
      }
      res.send(updated)
    }
  },
}

export default caseloadController
