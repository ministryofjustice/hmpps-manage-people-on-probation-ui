/* eslint-disable no-param-reassign */

import { DateTime } from 'luxon'
import { Route, ActivityLogFilters, ActivityLogFiltersResponse, SelectedFilterItem, Option } from '../@types'

const contactFilters = ['contactType', 'contactStatus'] as const

type FilterOptions = {
  [K in (typeof contactFilters)[number]]: Option[]
}

export const filterActivityLog: Route<void> = (req, res, next) => {
  if (req?.query?.submit) {
    let url = req.url.split('&page=')[0]
    url = url.replace('&submit=true', '')
    return res.redirect(url)
  }
  const { crn } = req.params
  const { keywords = '', dateFrom = '', dateTo = '', clearFilterKey, clearFilterValue } = req.query
  const errors = req?.session?.errors
  const { contactType: contactTypeQuery = [], contactStatus: contactStatusQuery = [] } = req.query
  let contactType = contactTypeQuery as string[] | string
  let contactStatus = contactStatusQuery as string[] | string
  const baseUrl = `/case/${crn}/activity-log`
  if (!Array.isArray(contactType)) {
    contactType = [contactType]
  }
  if (!Array.isArray(contactStatus)) {
    contactStatus = [contactStatus]
  }
  if (contactType?.length && clearFilterKey === 'contactType') {
    contactType = contactType.filter(value => value !== clearFilterValue)
  }
  if (contactStatus?.length && clearFilterKey === 'contactStatus') {
    contactStatus = contactStatus.filter(value => value !== clearFilterValue)
  }

  const contactFilterOptions: FilterOptions = {
    contactType: [{ text: 'National Standard', value: 'national standard' }],
    contactStatus: [
      { text: 'Absence waiting for evidence', value: 'absence waiting for evidence' },
      { text: 'Acceptable absence', value: 'acceptable absence' },
      { text: 'Complied', value: 'complied' },
      { text: 'Failed to comply', value: 'failed to comply' },
      { text: 'Rescheduled', value: 'rescheduled' },
      { text: 'No outcome', value: 'no outcome' },
      { text: 'Warning letter', value: 'warning letter' },
    ],
  }

  const filters: ActivityLogFilters = {
    keywords: keywords && clearFilterKey !== 'keywords' ? (keywords as string) : '',
    dateFrom:
      dateFrom && dateTo && !errors?.errorMessages?.dateFrom && clearFilterKey !== 'dateRange'
        ? (dateFrom as string)
        : '',
    dateTo:
      dateTo && dateFrom && !errors?.errorMessages?.dateTo && clearFilterKey !== 'dateRange' ? (dateTo as string) : '',
    contactType,
    contactStatus,
  }

  const getQueryString = (values: ActivityLogFilters | Record<string, string>): string => {
    const keys = [...Object.keys(filters)]
    const queryStr: string = Object.entries(values)
      .filter(([key, _value]) => keys.includes(key))
      .reduce((acc, [key, value]: [string, string | string[]], i) => {
        if (value) {
          if (Array.isArray(value)) {
            for (const val of value) {
              acc = `${acc}${acc ? '&' : ''}${key}=${encodeURI(val)}`
            }
          } else {
            acc = `${acc}${i > 0 ? '&' : ''}${key}=${encodeURI(value)}`
          }
        }
        return acc
      }, '')
    return queryStr
  }

  const queryStr = getQueryString(req.query as Record<string, string>)
  const queryStrPrefix = queryStr ? '?' : ''
  const queryStrSuffix = queryStr ? '&' : '?'
  const redirectQueryStr = getQueryString(filters)

  if (clearFilterKey) {
    let redirectUrl = baseUrl
    if (redirectQueryStr) redirectUrl = `${redirectUrl}?${redirectQueryStr}`
    return res.redirect(redirectUrl)
  }

  const filterHref = (key: string, value: string): string =>
    queryStr
      ? `${baseUrl}?${queryStr}&clearFilterKey=${key}&clearFilterValue=${encodeURI(value)}`
      : `${baseUrl}?clearFilterKey=${key}&clearFilterValue=${encodeURI(value)}`

  const selectedFilterItems: Record<string, SelectedFilterItem[]> = Object.entries(filters)
    .filter(([_key, value]) => value)
    .reduce((acc, [filterKey, filterValue]) => {
      let value: string | SelectedFilterItem[] = null
      if (['contactType', 'contactStatus'].includes(filterKey) && Array.isArray(filterValue)) {
        value = []
        for (const text of filterValue) {
          value.push({
            text: contactFilterOptions[filterKey as (typeof contactFilters)[number]].find(
              option => option.value === text,
            ).text,
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

  const contactTypeOptions: Option[] = contactFilterOptions.contactType.map(({ text, value }) => ({
    text,
    value,
    checked: filters.contactType.includes(value),
  }))

  const contactStatusOptions: Option[] = contactFilterOptions.contactStatus.map(({ text, value }) => ({
    text,
    value,
    checked: filters.contactStatus.includes(value),
  }))

  const today = new Date()
  const maxDate = DateTime.fromJSDate(today).toFormat('dd/MM/yyyy')

  const filtersResponse: ActivityLogFiltersResponse = {
    errors,
    selectedFilterItems,
    contactTypeOptions,
    contactStatusOptions,
    baseUrl,
    queryStr,
    queryStrPrefix,
    queryStrSuffix,
    keywords: filters.keywords,
    contactType: filters.contactType,
    contactStatus: filters.contactStatus,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    maxDate,
  }
  res.locals.filters = filtersResponse

  return next()
}
