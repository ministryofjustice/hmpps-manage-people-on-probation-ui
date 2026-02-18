/* eslint-disable no-param-reassign */

import { DateTime } from 'luxon'
import { Route } from '../@types'

import {
  categoryFilterOptions,
  filterOptions as complianceFilterOptions,
  hideContactsFilterOptions,
} from '../properties'
import { ActivityLogFilters, SelectedFilterItem } from '../models/ActivityLog'
import { Option } from '../models/Option'

export const filterActivityLog: Route<void> = (req, res, next): void => {
  if (req?.query?.clear) {
    delete req.session.activityLogFilters
    delete req.session.errorMessages
  }
  const { clearFilterKey, clearFilterValue } = req.query
  const view = req?.query?.view ?? req?.body?.view
  const { crn } = req.params
  const { keywords, dateFrom, dateTo, compliance, category, hideContact } = setSession()
  const errorMessages = req?.session?.errorMessages

  function setSession() {
    if (req.body?.submit && !req?.query?.error) {
      const complianceFilters: Array<string> = req.body.compliance ? [req.body.compliance].flat() : []
      const categoryFilters: Array<string> = req.body.category ? [req.body.category].flat() : []
      const hideContactFilters: Array<string> = req.body.hideContact ? [req.body.hideContact].flat() : []
      req.session.activityLogFilters = req.body as ActivityLogFilters
      req.session.activityLogFilters.compliance = complianceFilters
      req.session.activityLogFilters.category = categoryFilters
      req.session.activityLogFilters.hideContact = hideContactFilters
    }
    if (req.session.activityLogFilters) {
      checkClearFilterKeys()
    }
    return {
      keywords: req.session?.activityLogFilters?.keywords ?? '',
      dateFrom: req.session?.activityLogFilters?.dateFrom ?? '',
      dateTo: req.session?.activityLogFilters?.dateTo ?? '',
      compliance: req.session?.activityLogFilters?.compliance ?? [],
      category: req.session?.activityLogFilters?.category ?? [],
      hideContact: req.session?.activityLogFilters?.hideContact ?? [],
    }
  }
  function checkClearFilterKeys() {
    if (clearFilterKey === 'compliance') {
      req.session.activityLogFilters.compliance = req.session.activityLogFilters.compliance.filter(
        (value: string) => value !== clearFilterValue,
      )
    } else if (clearFilterKey === 'dateRange') {
      req.session.activityLogFilters.dateFrom = ''
      req.session.activityLogFilters.dateTo = ''
    } else if (clearFilterKey === 'keywords') {
      req.session.activityLogFilters.keywords = ''
    } else if (clearFilterKey === 'category') {
      req.session.activityLogFilters.category = req.session.activityLogFilters.category.filter(
        (value: string) => value !== clearFilterValue,
      )
    } else if (clearFilterKey === 'hideContact') {
      req.session.activityLogFilters.hideContact = req.session.activityLogFilters.hideContact.filter(
        (value: string) => value !== clearFilterValue,
      )
    }
  }

  const baseUrl = `/case/${crn}/activity-log`
  const filters: ActivityLogFilters = {
    keywords,
    dateFrom: dateFrom && dateTo && !errorMessages?.dateFrom && clearFilterKey !== 'dateRange' ? dateFrom : '',
    dateTo: dateTo && dateFrom && !errorMessages?.dateTo && clearFilterKey !== 'dateRange' ? dateTo : '',
    compliance,
    category,
    hideContact,
  }

  const filterHref = (key: string, value: string): string => {
    if (key === 'compliance') {
      return view
        ? `${baseUrl}?clearFilterKey=${key}&clearFilterValue=${encodeURI(value)}&view=${view}`
        : `${baseUrl}?clearFilterKey=${key}&clearFilterValue=${encodeURI(value)}`
    }
    if (key === 'category') {
      return view
        ? `${baseUrl}?clearFilterKey=${key}&clearFilterValue=${encodeURI(value)}&view=${view}`
        : `${baseUrl}?clearFilterKey=${key}&clearFilterValue=${encodeURI(value)}`
    }
    if (key === 'hideContact') {
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
          if (filterKey === 'compliance') {
            value.push({
              text: complianceFilterOptions.find(option => option.value === text).text,
              href: filterHref(filterKey, text),
            })
          } else if (filterKey === 'category') {
            value.push({
              text: categoryFilterOptions.find(option => option.value === text).text,
              href: filterHref(filterKey, text),
            })
          } else if (filterKey === 'hideContact') {
            value.push({
              text: hideContactsFilterOptions.find(option => option.value === text).text,
              href: filterHref(filterKey, text),
            })
          }
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

  const categoryOptions: Option[] = categoryFilterOptions.map(({ text, value }) => ({
    text,
    value,
    checked: filters.category.includes(value),
  }))

  const hideContactOptions: Option[] = hideContactsFilterOptions.map(({ text, value }) => ({
    text,
    value,
    checked: filters.hideContact.includes(value),
  }))

  const today = new Date()
  const maxDate = DateTime.fromJSDate(today).toFormat('dd/MM/yyyy')

  res.locals.filters = {
    selectedFilterItems,
    complianceOptions,
    categoryOptions,
    hideContactOptions,
    baseUrl,
    keywords: filters.keywords,
    compliance: filters.compliance,
    category: filters.category,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    hideContact: filters.hideContact,
    maxDate,
  }
  return next()
}
