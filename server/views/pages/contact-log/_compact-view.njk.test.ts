import * as cheerio from 'cheerio'
import { createNunjucksTestEnv } from '../../../testutils/nunjucksTestEnv'
import { Activity } from '../../../data/model/schedule'
import { isInThePast } from '../../../utils'

const crn = 'X000001'
const url = encodeURIComponent('/case/X000001/activity-log')
const esupervisionId = '7fa85f64-5717-4562-b3fc-2c963f66afa6'

const checkIn = (overrides: Partial<Activity> = {}): Partial<Activity> => ({
  id: '33',
  type: 'Online probation check in',
  startDateTime: '2023-02-09T09:00:00.000Z',
  endDateTime: '2023-02-09T09:00:00.000Z',
  hasOutcome: false,
  isSensitive: false,
  esupervisionId,
  appointmentNotes: [{ id: 0, note: 'Reason: The person on probation is in hospital', hasNoteBeenTruncated: false }],
  lastUpdated: '2023-02-09',
  lastUpdatedBy: { forename: 'Online Check In', surname: 'Service' },
  ...overrides,
})

const render = (activity: Partial<Activity>) => {
  const env = createNunjucksTestEnv()
  // The partial relies on macros that partials/layout.njk imports for the full page
  const template = `
    {% from "_components/compliance-tag/macro.njk" import appComplianceTag %}
    {% from "_components/note/macro.njk" import appNote %}
    {% include "pages/contact-log/_compact-view.njk" %}
  `
  return cheerio.load(
    env.renderString(template, {
      crn,
      url,
      filters: {},
      isInThePast,
      groupedActivities: [{ date: 'Thursday 9 February 2023', activities: [activity] }],
    }),
  )
}

describe('Contact log compact view', () => {
  describe('cancelled online check in', () => {
    const $ = render(checkIn({ description: 'Online check in cancelled', isCancelledCheckIn: true }))

    it('shows the cancellation as the contact title, with the notes', () => {
      expect($('.govuk-details__summary-text').text().trim()).toBe('Online check in cancelled')
      expect($('.govuk-details__text').text()).toContain('Reason: The person on probation is in hospital')
    })

    it('shows a View link to the contact in this service, not a Manage link to the check ins service', () => {
      const viewLink = $('[data-qa="view-link"]')
      expect(viewLink.text()).toContain('View')
      expect(viewLink.attr('href')).toBe(`/case/${crn}/activity/33?back=${url}`)
      expect($('[data-qa="esup-manage-link"]')).toHaveLength(0)
    })
  })

  describe('other online check in', () => {
    const $ = render(checkIn({ description: 'Online check in scheduled', isCancelledCheckIn: false }))

    it('still shows a Manage link to the check ins service', () => {
      const manageLink = $('[data-qa="esup-manage-link"]')
      expect(manageLink.attr('href')).toBe(`/case/${crn}/appointments/${esupervisionId}/check-in/update?back=${url}`)
      expect($('[data-qa="view-link"]')).toHaveLength(0)
    })
  })
})
