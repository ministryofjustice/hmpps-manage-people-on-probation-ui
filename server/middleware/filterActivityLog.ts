/* eslint-disable no-param-reassign */

import { DateTime } from 'luxon'
import { ActivityLogFilters, Option, Route, SelectedFilterItem } from '../@types'

import { filterOptions as complianceFilterOptions } from '../properties'

export const filterActivityLog: Route<void> = (req, res, next): void => {
  if (req?.query?.clear || (Object.keys(req.query).length === 0 && req.method === 'GET')) {
    // Only clear session when there is no query params in a GET request, or it has been explicitly requested
    req.session.activityLogFilters = undefined
  }
  const { clearFilterKey, clearFilterValue } = req.query
  const view = req?.query?.view ?? req?.body?.view
  const { crn } = req.params
  const { keywords, dateFrom, dateTo, compliance } = setSession()
  const errorMessages = req?.session?.errorMessages

  function setSession() {
    if (req.body?.submit && !req?.query?.error) {
      const complianceFilters: Array<string> = req.body.compliance ? [req.body.compliance].flat() : []
      req.session.activityLogFilters = req.body as ActivityLogFilters
      req.session.activityLogFilters.compliance = complianceFilters
    }
    if (req.session.activityLogFilters) {
      checkClearFilterKeys()
    }
    return {
      keywords: req.session?.activityLogFilters?.keywords || '',
      dateFrom: req.session?.activityLogFilters?.dateFrom || '',
      dateTo: req.session?.activityLogFilters?.dateTo || '',
      compliance: req.session?.activityLogFilters?.compliance || [],
    }
  }
  function checkClearFilterKeys() {
    if (clearFilterKey === 'compliance') {
      req.session.activityLogFilters.compliance = req.session.activityLogFilters.compliance.filter(
        value => value !== clearFilterValue,
      )
    } else if (clearFilterKey === 'dateRange') {
      req.session.activityLogFilters.dateFrom = ''
      req.session.activityLogFilters.dateTo = ''
    } else if (clearFilterKey === 'keywords') {
      req.session.activityLogFilters.keywords = ''
    }
  }

  const baseUrl = `/case/${crn}/activity-log`
  const filters: ActivityLogFilters = {
    keywords,
    dateFrom: dateFrom && dateTo && !errorMessages?.dateFrom && clearFilterKey !== 'dateRange' ? dateFrom : '',
    dateTo: dateTo && dateFrom && !errorMessages?.dateTo && clearFilterKey !== 'dateRange' ? dateTo : '',
    compliance,
  }

  const filterHref = (key: string, value: string): string => {
    if (key === 'compliance') {
      return view
        ? `${baseUrl}?clearFilterKey=${key}&clearFilterValue=${encodeURI(value)}&view=${view}`
        : `${baseUrl}?clearFilterKey=${key}&clearFilterValue=${encodeURI(value)}`
    }
    return view ? `${baseUrl}?clearFilterKey=${key}&view=${view}` : `${baseUrl}?clearFilterKey=${key}`
  }

  const selectedFilterItems: Record<string, SelectedFilterItem[]> = Object.entries(filters)
    .filter(([_key, value]) => value)
    .reduce((acc, [filterKey, filterValue]) => {
      let value: string | SelectedFilterItem[] = null
      if (Array.isArray(filterValue)) {
        value = []
        for (const text of filterValue) {
          value.push({
            text: complianceFilterOptions.find(option => option.value === text).text,
            href: filterHref(filterKey, text),
          })
        }
      } else if (filterKey !== 'dateTo') {
        let text = filterValue
        if (filterKey === 'dateFrom') {
          text = filterValue && filters.dateTo ? `${filterValue} - ${filters.dateTo}` : ''
          filterKey = 'dateRange'
        }
        if (text) {
          value = [{ text, href: filterHref(filterKey, filterValue) }]
        }
      }
      return filterKey !== 'dateTo' ? { ...acc, [filterKey]: value } : acc
    }, {})

  const complianceOptions: Option[] = complianceFilterOptions.map(({ text, value }) => ({
    text,
    value,
    checked: filters.compliance.includes(value),
  }))

  const today = new Date()
  const maxDate = DateTime.fromJSDate(today).toFormat('dd/MM/yyyy')

  res.locals.filters = {
    selectedFilterItems,
    complianceOptions,
    baseUrl,
    keywords: filters.keywords,
    compliance: filters.compliance,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    maxDate,
  }
  return next()
}
