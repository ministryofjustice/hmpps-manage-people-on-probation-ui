import { PersonActivity } from '../data/model/activityLog'
import { TierCalculation } from '../data/tierApiClient'
import type { Errors, Option } from './index'

export interface ActivityLogFilters {
  keywords: string
  dateFrom: string
  dateTo: string
  contactType: string[]
  contactStatus: string[]
  clearFilterKey?: string
  clearFilterValue?: string
}

export interface ActivityLogRequestBody {
  keywords: string
  dateFrom: string
  dateTo: string
  contactType: string[]
  contactStatus: string[]
}

export interface SelectedFilterItem {
  text: string
  href: string
}

export interface ActivityLogFiltersResponse extends ActivityLogFilters {
  errors: Errors
  selectedFilterItems: Record<string, SelectedFilterItem[]>
  contactTypeOptions: Option[]
  contactStatusOptions: Option[]
  baseUrl: string
  queryStr: string
  queryStrPrefix: string
  queryStrSuffix: string
  maxDate: string
  query?: ActivityLogFilters
}

export interface ActivityLogCacheItem extends ActivityLogFilters {
  crn: string
  personActivity: PersonActivity
  tierCalculation: TierCalculation
}

export interface ActivityLogCache {
  results?: ActivityLogCacheItem[]
  filters?: ActivityLogFilters
}
