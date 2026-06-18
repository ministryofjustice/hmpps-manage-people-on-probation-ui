/* eslint-disable no-param-reassign */
import path from 'path'
import { AsyncLocalStorage } from 'node:async_hooks'
import nunjucks from 'nunjucks'

import { arnsNunjucksSetup } from '@ministryofjustice/hmpps-arns-frontend-components-lib'
import express, { Request, NextFunction } from 'express'
import type { Services } from '../services'

import {
  initialiseName,
  yearsSince,
  yearsBetween,
  dateWithYear,
  dateToTimestamp,
  dateWithDayAndWithoutYear,
  dateWithDayAndWithYear,
  addressToList,
  dateForSort,
  dateWithNoDay,
  dateWithYearShortMonth,
  dateWithYearShortMonthAndTime,
  deliusDateFormat,
  deliusDeepLinkUrl,
  deepLinkContactTypes,
  drugHistoryContactTypes,
  enforcementContactTypes,
  fromIsoDateToPicker,
  fullName,
  getCurrentRisksToThemselves,
  getPreviousRisksToThemselves,
  getRisksToThemselves,
  getTagClass,
  govukTime,
  lastUpdatedBy,
  lastUpdatedDate,
  monthsOrDaysElapsed,
  tierLink,
  timeForSort,
  toIsoDateFromPicker,
  activityLogDate,
  compactActivityLogDate,
  dayOfWeek,
  deliusHomepageUrl,
  getAppointmentsToAction,
  getComplianceStatus,
  getDistinctRequirements,
  getRisksWithScore,
  interventionsLink,
  supervisionContactsAddLink,
  supervisionContactsUpdateLink,
  isInThePast,
  isToday,
  oaSysUrl,
  removeEmpty,
  scheduledAppointments,
  sentencePlanLink,
  setSortOrder,
  sortAppointmentsDescending,
  timeFromTo,
  toSlug,
  toYesNo,
  defaultFormInputValues,
  defaultFormSelectValues,
  isDefined,
  isNotNull,
  decorateFormAttributes,
  groupByLevel,
  getStaffRisk,
  hasValue,
  riskLevelLabel,
  toErrorList,
  toSentenceCase,
  roleDescription,
  toSentenceDescription,
  concat,
  shortTime,
  convertToTitleCase,
  getPersonLevelTypes,
  handleQuotes,
  formatEnforcementActionNote,
  dateToLongDate,
  merge,
  dateWithYearTimeFirst,
  getDataValue,
} from '.'

import { ApplicationInfo } from '../applicationInfo'
import config from '../config'
import { AppResponse } from '../models/Locals'
import { splitString } from './splitString'
import getUserFriendlyString from './eSupervisionFriendlyString'
import { to12HourTimeWithMinutes, toIso12HourTimeWithMinutes } from './to12HourTimeWithMinutes'
import { to12HourTimeCompact } from './to12HourTimeCompact'
import {
  checkLocationMonitoring,
  checkLocationMonitoringByEventNumber,
  checkLocationMonitoringCode,
} from '../middleware/checkLocationMonitoring'
import logger from '../../logger'

export default function nunjucksSetup(
  app: express.Express,
  applicationInfo: ApplicationInfo,
  services: Services,
): void {
  const production = process.env.NODE_ENV === 'production'
  app.set('view engine', 'njk')

  app.locals.asset_path = '/assets/'
  app.locals.applicationName = 'Manage people on probation'
  app.locals.environmentName = config.environmentName
  app.locals.environmentNameColour = config.environmentName === 'PRE-PRODUCTION' ? 'govuk-tag--green' : ''

  if (production) {
    app.locals.version = applicationInfo.gitShortHash
  } else {
    app.use((_req, res: AppResponse, next) => {
      res.locals.version = Date.now().toString()
      return next()
    })
  }

  const requestContext = new AsyncLocalStorage<{ req: Request; res: AppResponse }>()

  app.use((req: Request, res: AppResponse, next: NextFunction) => {
    requestContext.run({ req, res }, next)
  })

  const njkEnv = nunjucks.configure(
    [
      path.join(__dirname, 'server/views'),
      path.join(__dirname, '../../server/views'),
      'node_modules/govuk-frontend/dist',
      'node_modules/govuk-frontend/dist/components/',
      'node_modules/@ministryofjustice/frontend/',
      'node_modules/@ministryofjustice/frontend/moj/components/',
      'node_modules/@ministryofjustice/probation-search-frontend/components',
      'node_modules/@ministryofjustice/hmpps-arns-frontend-components-lib/dist/',
    ],
    {
      autoescape: true,
      express: app,
    },
  )

  njkEnv.addFilter('initialiseName', initialiseName)
  njkEnv.addFilter('dateWithYear', dateWithYear)
  njkEnv.addFilter('dateToTimestamp', dateToTimestamp)
  njkEnv.addFilter('dateWithDayAndWithoutYear', dateWithDayAndWithoutYear)
  njkEnv.addFilter('dateWithDayAndWithYear', dateWithDayAndWithYear)
  njkEnv.addFilter('yearsSince', yearsSince)
  njkEnv.addFilter('yearsBetween', yearsBetween)
  njkEnv.addFilter('dateWithNoDay', dateWithNoDay)
  njkEnv.addFilter('dateWithYearShortMonth', dateWithYearShortMonth)
  njkEnv.addFilter('fullName', fullName)
  njkEnv.addFilter('monthsOrDaysElapsed', monthsOrDaysElapsed)
  njkEnv.addFilter('govukTime', govukTime)
  njkEnv.addFilter('lastUpdatedDate', lastUpdatedDate)
  njkEnv.addFilter('deliusDateFormat', deliusDateFormat)
  njkEnv.addFilter('dayOfWeek', dayOfWeek)
  njkEnv.addFilter('toYesNo', toYesNo)
  njkEnv.addFilter('compactActivityLogDate', compactActivityLogDate)
  njkEnv.addFilter('activityLogDate', activityLogDate)
  njkEnv.addFilter('removeEmpty', removeEmpty)
  njkEnv.addFilter('toSlug', toSlug)
  njkEnv.addFilter('defaultFormInputValues', defaultFormInputValues)
  njkEnv.addFilter('defaultFormSelectValues', defaultFormSelectValues)
  njkEnv.addFilter('dateForSort', dateForSort)
  njkEnv.addFilter('timeForSort', timeForSort)
  njkEnv.addFilter('toErrorList', toErrorList)
  njkEnv.addFilter('roleDescription', roleDescription)
  njkEnv.addFilter('toSentenceCase', toSentenceCase)
  njkEnv.addFilter('toSentenceDescription', toSentenceDescription)
  njkEnv.addFilter('concat', concat)
  njkEnv.addFilter('merge', (obj, other) => ({ ...obj, ...other }))
  njkEnv.addFilter('shortTime', shortTime)
  njkEnv.addFilter('split', splitString)
  njkEnv.addFilter('userFriendlyString', getUserFriendlyString)
  njkEnv.addFilter('convertToTitleCase', convertToTitleCase)
  njkEnv.addFilter('handleQuotes', handleQuotes)
  njkEnv.addFilter('formatEnforcementActionNote', formatEnforcementActionNote)
  njkEnv.addFilter('dmyToLongDate', dateToLongDate)
  njkEnv.addFilter('merge', merge)
  njkEnv.addFilter('dateWithYearTimeFirst', dateWithYearTimeFirst)
  njkEnv.addFilter('isArray', (str: string | string[]) => Array.isArray(str))

  njkEnv.addFilter('decorateFormAttributes', (obj: any, sections?: string[]) => {
    const ctx = requestContext.getStore()

    // Some render paths (for example tests or non-request rendering) may not
    // have an AsyncLocalStorage context. Fall back to the undecorated object and
    // log for investigation.
    if (!ctx) {
      logger.warn('decorateFormAttributes called without request context')
      return obj
    }

    return decorateFormAttributes(ctx.req, ctx.res)(obj, sections)
  })

  njkEnv.addFilter('dateWithYearShortMonthAndTime', dateWithYearShortMonthAndTime)
  njkEnv.addGlobal('groupByLevel', groupByLevel)
  njkEnv.addGlobal('getPersonLevelTypes', getPersonLevelTypes)
  njkEnv.addGlobal('getStaffRisk', getStaffRisk)
  njkEnv.addGlobal('getComplianceStatus', getComplianceStatus)
  njkEnv.addGlobal('timeFromTo', timeFromTo)
  njkEnv.addGlobal('getRisksWithScore', getRisksWithScore)
  njkEnv.addGlobal('getRisksToThemselves', getRisksToThemselves)
  njkEnv.addGlobal('getCurrentRisksToThemselves', getCurrentRisksToThemselves)
  njkEnv.addGlobal('getPreviousRisksToThemselves', getPreviousRisksToThemselves)
  njkEnv.addGlobal('getTagClass', getTagClass)
  njkEnv.addGlobal('addressToList', addressToList)
  njkEnv.addGlobal('lastUpdatedBy', lastUpdatedBy)
  njkEnv.addGlobal('deliusDeepLinkUrl', deliusDeepLinkUrl)
  njkEnv.addGlobal('deepLinkContactTypes', deepLinkContactTypes)
  njkEnv.addGlobal('drugHistoryContactTypes', drugHistoryContactTypes)
  njkEnv.addGlobal('enforcementContactTypes', enforcementContactTypes)
  njkEnv.addGlobal('oaSysUrl', oaSysUrl)
  njkEnv.addGlobal('deliusHomepageUrl', deliusHomepageUrl)
  njkEnv.addGlobal('scheduledAppointments', scheduledAppointments)
  njkEnv.addGlobal('isToday', isToday)
  njkEnv.addGlobal('isInThePast', isInThePast)
  njkEnv.addGlobal('getAppointmentsToAction', getAppointmentsToAction)
  njkEnv.addGlobal('getDistinctRequirements', getDistinctRequirements)
  njkEnv.addGlobal('tierLink', tierLink)
  njkEnv.addGlobal('sentencePlanLink', sentencePlanLink)
  njkEnv.addGlobal('interventionsLink', interventionsLink)
  njkEnv.addGlobal('supervisionContactsAddLink', supervisionContactsAddLink)
  njkEnv.addGlobal('supervisionContactsUpdateLink', supervisionContactsUpdateLink)
  njkEnv.addGlobal('setSortOrder', setSortOrder)
  njkEnv.addGlobal('sortAppointmentsDescending', sortAppointmentsDescending)
  njkEnv.addGlobal('isNotNull', isNotNull)
  njkEnv.addGlobal('isDefined', isDefined)
  njkEnv.addGlobal('hasValue', hasValue)
  njkEnv.addGlobal('riskLevelLabel', riskLevelLabel)
  njkEnv.addGlobal('toIsoDateFromPicker', toIsoDateFromPicker)
  njkEnv.addGlobal('fromIsoDateToPicker', fromIsoDateToPicker)
  njkEnv.addGlobal('lastTechnicalUpdate', services.technicalUpdatesService.getLatestTechnicalUpdateHeading())
  njkEnv.addFilter('to12HourTimeWithMinutes', to12HourTimeWithMinutes)
  njkEnv.addFilter('to12HourTimeCompact', to12HourTimeCompact)
  njkEnv.addFilter('toIso12HourTimeWithMinutes', toIso12HourTimeWithMinutes)
  njkEnv.addFilter('checkLocationMonitoring', checkLocationMonitoring)
  njkEnv.addFilter('checkLocationMonitoringCode', checkLocationMonitoringCode)
  njkEnv.addFilter('checkLocationMonitoringByEventNumber', checkLocationMonitoringByEventNumber)

  arnsNunjucksSetup(njkEnv)
}
