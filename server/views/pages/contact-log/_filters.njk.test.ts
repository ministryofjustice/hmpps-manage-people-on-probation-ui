import * as cheerio from 'cheerio'
import { ActivityLogFiltersResponse } from '../../../models/ActivityLog'
import { createNunjucksTestEnv } from '../../../testutils/nunjucksTestEnv'

const render = () => {
  const env = createNunjucksTestEnv()
  const selectedAppointment = {
    text: 'Show supervision package appointments',
    href: '/case/X000001/activity-log?clearFilterKey=supervisionPackageAppointments',
  }
  const filters: Partial<ActivityLogFiltersResponse> = {
    maxDate: '02/09/2026',
    complianceOptions: [],
    categoryOptions: [],
    sparksOptions: [],
    supervisionPackageOptions: [],
    supervisionPackageAppointmentsOptions: [
      {
        text: 'Show supervision package appointments',
        value: 'supervision package appointments',
        checked: true,
      },
    ],
    hideContactOptions: [],
    selectedFilterItems: {
      keywords: [],
      dateRange: [],
      compliance: [],
      category: [],
      sparks: [],
      supervisionPackage: [],
      supervisionPackageAppointments: [selectedAppointment],
    },
  }

  return cheerio.load(
    env.render('pages/contact-log/_filters.njk', {
      baseUrl: '/case/X000001/activity-log',
      crn: 'X000001',
      errorMessages: {},
      filters,
      page: 1,
      query: { keywords: '', dateFrom: '', dateTo: '' },
      queryParams: [],
    }),
  )
}

describe('Contact log filters', () => {
  it('renders supervision package appointment options and selected filters', () => {
    const $ = render()

    expect($('[data-qa="supervisionPackageAppointments"] input[name="supervisionPackageAppointments"]').length).toBe(1)
    expect($('[data-qa="supervisionPackageAppointments"]').text()).toContain('Show supervision package appointments')
    expect($('.moj-filter__selected').text()).toContain('Supervision package appointments filter')
    expect($('.moj-filter__selected').text()).toContain('Show supervision package appointments')
  })
})
