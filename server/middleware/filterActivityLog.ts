/* eslint-disable no-param-reassign */
import { Route } from '../@types'

import {
  categoryFilterOptions,
  sparksCategoryFilterOption,
  supervisionPackageCategoryFilterOption,
  filterOptions as complianceFilterOptions,
  hideContactsFilterOptions,
  supervisionPackageAppointmentsCategoryFilterOption,
} from '../properties'
import { ActivityLogFilters, SelectedFilterItem } from '../models/ActivityLog'
import { Option } from '../models/Option'

export const filterActivityLog: Route<void> = (req, res, next): void => {
  if (req?.query?.clear) {
    delete req.session.activityLogFilters
    delete req.session.errorMessages
  }
  const { clearFilterKey, clearFilterValue } = req.query
  const view = req?.query?.view
  const { crn } = req.params as Record<string, string>
  const {
    keywords,
    dateFrom,
    dateTo,
    compliance,
    category,
    sparks,
    supervisionPackage,
    supervisionPackageAppointments,
    hideContact,
  } = setSession()
  const errorMessages = req?.session?.errorMessages

  function setSession() {
    if (crn !== req.session.activityLogFilters?.crn) {
      delete req.session.activityLogFilters
    }
    if (req.query?.submit && !req?.query?.error) {
      const complianceFilters: string[] = req.query.compliance ? ([req.query.compliance].flat() as string[]) : []
      const categoryFilters: string[] = req.query.category ? ([req.query.category].flat() as string[]) : []
      const sparksFilters: string[] = req.query.sparks ? ([req.query.sparks].flat() as string[]) : []
      const supervisionPackageFilters: string[] = req.query.supervisionPackage
        ? ([req.query.supervisionPackage].flat() as string[])
        : []
      const supervisionPackageAppointmentsFilters: string[] = req.query.supervisionPackageAppointments
        ? ([req.query.supervisionPackageAppointments].flat() as string[])
        : []
      const hideContactFilters: string[] = req.query.hideContact ? ([req.query.hideContact].flat() as string[]) : []

      req.session.activityLogFilters = {
        keywords: (req.query.keywords as string) ?? '',
        dateFrom: (req.query.dateFrom as string) ?? '',
        dateTo: (req.query.dateTo as string) ?? '',
        compliance: complianceFilters,
        category: categoryFilters,
        sparks: sparksFilters,
        supervisionPackage: supervisionPackageFilters,
        supervisionPackageAppointments: supervisionPackageAppointmentsFilters,
        hideContact: hideContactFilters,
        crn,
      }
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
      sparks: req.session?.activityLogFilters?.sparks ?? [],
      supervisionPackage: req.session?.activityLogFilters?.supervisionPackage ?? [],
      supervisionPackageAppointments: req.session?.activityLogFilters?.supervisionPackageAppointments ?? [],
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
    } else if (clearFilterKey === 'sparks') {
      req.session.activityLogFilters.sparks = req.session.activityLogFilters.sparks.filter(
        (value: string) => value !== clearFilterValue,
      )
    } else if (clearFilterKey === 'supervisionPackage') {
      req.session.activityLogFilters.supervisionPackage = req.session.activityLogFilters.supervisionPackage.filter(
        (value: string) => value !== clearFilterValue,
      )
    } else if (clearFilterKey === 'supervisionPackageAppointments') {
      req.session.activityLogFilters.supervisionPackageAppointments =
        req.session.activityLogFilters.supervisionPackageAppointments.filter(
          (value: string) => value !== clearFilterValue,
        )
    } else if (clearFilterKey === 'hideContact') {
      req.session.activityLogFilters.hideContact = req.session.activityLogFilters.hideContact.filter(
        (value: string) => value !== clearFilterValue,
      )
    }
  }

  const sparksEnabled = res.locals.flags?.enableSparksFilter === true
  const categoryOptionsSource = sparksEnabled
    ? categoryFilterOptions.map(option =>
        option.value === 'appointments' ? { ...option, text: 'All appointments' } : option,
      )
    : categoryFilterOptions
  const sparksOptionsSource = sparksEnabled ? [sparksCategoryFilterOption] : []

  const supervisionPackageEnabled = res.locals.flags?.enableSupervisionPackageFilter === true
  const supervisionPackageAppointmentsEnabled = res.locals.flags?.enableSupervisionPackageAppointments === true
  const supervisionPackageOptionsSource = supervisionPackageEnabled ? [supervisionPackageCategoryFilterOption] : []
  const supervisionPackageAppointmentsOptionsSource = supervisionPackageAppointmentsEnabled
    ? [supervisionPackageAppointmentsCategoryFilterOption]
    : []

  const baseUrl = `/case/${crn}/activity-log`
  const filters: ActivityLogFilters = {
    keywords,
    dateFrom: dateFrom && dateTo && !errorMessages?.dateFrom && clearFilterKey !== 'dateRange' ? dateFrom : '',
    dateTo: dateTo && dateFrom && !errorMessages?.dateTo && clearFilterKey !== 'dateRange' ? dateTo : '',
    compliance,
    category,
    sparks,
    supervisionPackage,
    supervisionPackageAppointments,
    hideContact,
  }

  const keysWithClearValue = [
    'compliance',
    'category',
    'sparks',
    'supervisionPackage',
    'supervisionPackageAppointments',
    'hideContact',
  ]
  const filterHref = (key: string, value: string): string => {
    const base = keysWithClearValue.includes(key)
      ? `${baseUrl}?clearFilterKey=${key}&clearFilterValue=${encodeURIComponent(value)}`
      : `${baseUrl}?clearFilterKey=${key}`
    return view ? `${base}&view=${view}` : base
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
            const categoryOption = categoryOptionsSource.find(option => option.value === text)
            if (categoryOption) {
              value.push({
                text: categoryOption.text,
                href: filterHref(filterKey, text),
              })
            }
          } else if (filterKey === 'sparks') {
            const sparksOption = sparksOptionsSource.find(option => option.value === text)
            if (sparksOption) {
              value.push({
                text: sparksOption.text,
                href: filterHref(filterKey, text),
              })
            }
          } else if (filterKey === 'supervisionPackage') {
            const supervisionPackageOption = supervisionPackageOptionsSource.find(option => option.value === text)
            if (supervisionPackageOption) {
              value.push({
                text: supervisionPackageOption.text,
                href: filterHref(filterKey, text),
              })
            }
          } else if (filterKey === 'supervisionPackageAppointments') {
            const supervisionPackageAppointmentsOption = supervisionPackageAppointmentsOptionsSource.find(
              option => option.value === text,
            )
            if (supervisionPackageAppointmentsOption) {
              value.push({
                text: supervisionPackageAppointmentsOption.text,
                href: filterHref(filterKey, text),
              })
            }
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

  const categoryOptions: Option[] = categoryOptionsSource.map(({ text, value }) => ({
    text,
    value,
    checked: filters.category.includes(value),
  }))

  const sparksOptions: Option[] = sparksOptionsSource.map(({ text, value }) => ({
    text,
    value,
    checked: filters.sparks.includes(value),
  }))

  const supervisionPackageOptions: Option[] = supervisionPackageOptionsSource.map(({ text, value }) => ({
    text,
    value,
    checked: filters.supervisionPackage.includes(value),
  }))

  const supervisionPackageAppointmentsOptions: Option[] = supervisionPackageAppointmentsOptionsSource.map(
    ({ text, value }) => ({
      text,
      value,
      checked: filters.supervisionPackageAppointments.includes(value),
    }),
  )

  const hideContactOptions: Option[] = hideContactsFilterOptions.map(({ text, value }) => ({
    text,
    value,
    checked: filters.hideContact.includes(value),
  }))

  res.locals.filters = {
    selectedFilterItems,
    complianceOptions,
    categoryOptions,
    sparksOptions,
    supervisionPackageOptions,
    supervisionPackageAppointmentsOptions,
    hideContactOptions,
    baseUrl,
    keywords: filters.keywords,
    compliance: filters.compliance,
    category: filters.category,
    sparks: filters.sparks,
    supervisionPackage: filters.supervisionPackage,
    supervisionPackageAppointments: filters.supervisionPackageAppointments,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    hideContact: filters.hideContact,
    crn,
  }
  return next()
}
