/* eslint-disable no-param-reassign */

import { DateTime } from 'luxon'
import { ActivityLogFilters, Option, Route, SelectedFilterItem } from '../@types'

import { filterOptions as complianceFilterOptions } from '../properties'

export const filterActivityLog: Route<void> = (req, res, next): void => {
  if (req?.query?.clear || !req?.query.page) {
    req.session.activityLogFilters = undefined
  }
  const { crn } = req.params
  let keywords = ''
  let dateFrom = ''
  let dateTo = ''

  const { clearFilterKey, clearFilterValue } = req.query
  const errors = req?.session?.errors

  if (req.body?.submit) {
    const complianceFilters: Array<string> = req.body.compliance ? [req.body.compliance].flat() : []
    req.session.activityLogFilters = req.body as ActivityLogFilters
    req.session.activityLogFilters.compliance = complianceFilters
  }

  if (req.session?.activityLogFilters) {
    keywords = req.session?.activityLogFilters.keywords
    dateFrom = req.session?.activityLogFilters.dateFrom
    dateTo = req.session?.activityLogFilters.dateTo
  }

  let compliance: string[] = req.session?.activityLogFilters?.compliance || []
  const baseUrl = `/case/${crn}/activity-log`

  if (clearFilterKey === 'compliance') {
    compliance = compliance.filter(value => value !== clearFilterValue)
    req.session.activityLogFilters.compliance = compliance
  }

  if (clearFilterKey === 'keywords') {
    keywords = ''
  }

  if (clearFilterKey === 'dateRange') {
    dateFrom = ''
  }

  if (clearFilterKey === 'dateRange') {
    dateTo = ''
  }

  if (clearFilterKey && req?.session?.activityLogFilters) {
    req.session.activityLogFilters.keywords = keywords
    req.session.activityLogFilters.dateFrom = dateFrom
    req.session.activityLogFilters.dateTo = dateTo
  }

  const filters: ActivityLogFilters = {
    keywords,
    dateFrom: dateFrom && dateTo && !errors?.errorMessages?.dateFrom && clearFilterKey !== 'dateRange' ? dateFrom : '',
    dateTo: dateTo && dateFrom && !errors?.errorMessages?.dateTo && clearFilterKey !== 'dateRange' ? dateTo : '',
    compliance,
  }

  const filterHref = (key: string, value: string): string => {
    if (key === 'compliance') {
      return `${baseUrl}?clearFilterKey=${key}&clearFilterValue=${encodeURI(value)}`
    }
    return `${baseUrl}?clearFilterKey=${key}`
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
    errors,
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
