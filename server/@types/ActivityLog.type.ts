import type { Errors, Option } from './index'

export interface ActivityLogFilters {
  keywords: string
  dateFrom: string
  dateTo: string
  compliance: Array<string>
  clearFilterKey?: string
  clearFilterValue?: string
}

export interface ActivityLogRequestBody {
  keywords: string
  dateFrom: string
  dateTo: string
  filters: string[]
}

export interface SelectedFilterItem {
  text: string
  href: string
}

export interface ActivityLogFiltersResponse extends ActivityLogFilters {
  selectedFilterItems: Record<string, SelectedFilterItem[]>
  complianceOptions: Option[]
  baseUrl: string
  maxDate: string
  query?: ActivityLogFilters
}
