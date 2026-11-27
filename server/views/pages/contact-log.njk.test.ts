import * as cheerio from 'cheerio'
import { createNunjucksTestEnv } from '../../testutils/nunjucksTestEnv'
import { isInThePast } from '../../utils'

const crn = 'X000001'

const activity = {
  id: '33',
  type: 'Appointment',
  startDateTime: '2023-02-09T09:00:00.000Z',
  endDateTime: '2023-02-09T09:30:00.000Z',
  hasOutcome: false,
  isSensitive: false,
  appointmentNotes: [] as unknown[],
}

const render = (model: Record<string, unknown> = {}) => {
  const env = createNunjucksTestEnv()
  env.addGlobal('supervisionContactsAddLink', () => `/case/${crn}/activity-log/new`)
  env.addGlobal('getDistinctRequirements', (): string[] => [])

  return cheerio.load(
    env.render('pages/contact-log.njk', {
      crn,
      headerPersonName: { forename: 'Terry', surname: 'Jones' },
      personActivity: {
        personSummary: { crn, dateOfBirth: '1980-01-01', gender: 'Male' },
        activities: [activity],
        totalResults: 1,
        totalPages: 1,
      },
      entries: [activity],
      groupedActivities: [{ date: 'Thursday 9 February 2023', activities: [activity] }],
      resultsStart: 1,
      resultsEnd: 1,
      filters: {},
      isInThePast,
      url: encodeURIComponent(`/case/${crn}/activity-log`),
      query: {},
      queryParams: [],
      page: '',
      view: 'default',
      showContactInformationWarning: false,
      ...model,
    }),
  )
}

describe('Contact log page', () => {
  describe('Contact information warning', () => {
    it('should not display the warning when showContactInformationWarning is false', () => {
      const $ = render({ showContactInformationWarning: false })

      expect($('.moj-alert')).toHaveLength(0)
    })

    it('should not display the warning when showContactInformationWarning is not set', () => {
      const $ = render({ showContactInformationWarning: undefined })

      expect($('.moj-alert')).toHaveLength(0)
    })

    it('should display the warning when showContactInformationWarning is true', () => {
      const $ = render({ showContactInformationWarning: true })

      expect($('.moj-alert')).toHaveLength(1)
      expect($('.moj-alert').text()).toContain(
        'Contacts created since Friday 18 September 2026 are currently unavailable.',
      )
      expect($('.moj-alert').text()).toContain('You can view them on NDelius.')
    })
  })

  describe('Contact log list', () => {
    describe('when feature flag enableContactCardDesign20261126Squad3 is disabled', () => {
      it('should render the contact log list in the default design', () => {
        const $ = render({ flags: { enableContactCardDesign20261126Squad3: false } })

        // Add assertions for the default design here
        expect($('table.contact-log-compact')).toHaveLength(1)
      })
    })
  })
  describe('when feature flag enableContactCardDesign20261126Squad3 is enabled', () => {
    it('should render the contact log list in the new design', () => {
      const $ = render({ flags: { enableContactCardDesign20261126Squad3: true } })

      expect($('.app-hmpps-generic-card').length).toBeGreaterThanOrEqual(1)
      expect($('.contact-log-compact')).toHaveLength(0)
    })
  })
})
