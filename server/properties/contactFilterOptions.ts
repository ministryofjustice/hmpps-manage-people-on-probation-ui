import { Option } from '../@types'

export const contactFilters = ['contactType', 'contactStatus'] as const

type FilterOptions = {
  [K in (typeof contactFilters)[number]]: Option[]
}

export const contactFilterOptions: FilterOptions = {
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
