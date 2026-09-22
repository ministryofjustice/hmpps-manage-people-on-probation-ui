import * as cheerio from 'cheerio'
import { createNunjucksTestEnv } from '../../testutils/nunjucksTestEnv'

const crn = 'X000001'

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
        activities: [],
        totalResults: 0,
        totalPages: 0,
      },
      filters: {},
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

      expect($('.moj-alert').length).toBe(0)
    })

    it('should not display the warning when showContactInformationWarning is not set', () => {
      const $ = render({ showContactInformationWarning: undefined })

      expect($('.moj-alert').length).toBe(0)
    })

    it('should display the warning when showContactInformationWarning is true', () => {
      const $ = render({ showContactInformationWarning: true })

      expect($('.moj-alert').length).toBe(1)
      expect($('.moj-alert').text()).toContain(
        'Contacts created since Friday 18 September 2026 are currently unavailable.',
      )
      expect($('.moj-alert').text()).toContain('You can view them on NDelius.')
    })
  })
})
