import { Option } from './Option'

export interface ActivityLogFilters {
  keywords: string
  dateFrom: string
  dateTo: string
  compliance: Array<string>
  category: Array<string>
  clearFilterKey?: string
  clearFilterValue?: string
  hideContact?: Array<string>
}

export interface ActivityLogRequestBody {
  keywords: string
  dateFrom: string
  dateTo: string
  filters: string[]
  includeSystemGenerated?: boolean
}

export interface SelectedFilterItem {
  text: string
  href: string
}

export interface ActivityLogFiltersResponse extends ActivityLogFilters {
  selectedFilterItems: Record<string, SelectedFilterItem[]>
  complianceOptions: Option[]
  categoryOptions: Option[]
  hideContactOptions: Option[]
  baseUrl: string
  maxDate: string
  query?: ActivityLogFilters
}
