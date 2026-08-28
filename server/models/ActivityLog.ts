import { Option } from './Option'

export interface ActivityLogFilters {
  keywords: string
  dateFrom: string
  dateTo: string
  compliance: Array<string> | string
  category: string[]
  sparks?: string[]
  supervisionPackage?: string[]
  supervisionPackageAppointments?: string[]
  clearFilterKey?: string
  clearFilterValue?: string
  hideContact?: Array<string>
}

export interface ActivityLogRequestBody {
  keywords: string
  dateFrom: string
  dateTo: string
  filters: string[]
  filterBySparksContacts?: boolean
  filterBySupervisionPackageContacts?: boolean
  filterBySupervisionPackageAppointmentsContacts?: boolean
  includeSystemGenerated?: boolean
  typeCodes: string[]
}

export interface SelectedFilterItem {
  text: string
  href: string
}

export interface ActivityLogFiltersResponse extends ActivityLogFilters {
  selectedFilterItems: Record<string, SelectedFilterItem[]>
  complianceOptions: Option[]
  categoryOptions: Option[]
  sparksOptions: Option[]
  supervisionPackageOptions: Option[]
  supervisionPackageAppointmentsOptions: Option[]
  hideContactOptions: Option[]
  baseUrl: string
  maxDate: string
  query?: ActivityLogFilters
  crn: string
}
