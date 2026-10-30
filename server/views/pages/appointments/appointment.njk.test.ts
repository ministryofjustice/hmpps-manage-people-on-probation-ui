import * as cheerio from 'cheerio'
import { Activity } from '../../../data/model/schedule'
import { createNunjucksTestEnv } from '../../../testutils/nunjucksTestEnv'
import { drugHistoryContactTypes, enforcementContactTypes, isInThePast, lastUpdatedBy, toYesNo } from '../../../utils'

const crn = 'X000001'
const appointment: Partial<Activity> = {
  id: '12',
  type: 'Drug Test Details',
  startDateTime: '2099-02-12T10:15:00.382Z',
  endDateTime: '2099-02-12T10:30:00.382Z',
  isSensitive: false,
  hasOutcome: true,
  deliusManaged: true,
  eventNumber: '7654321',
  isAppointment: false,
  appointmentNotes: [],
  documents: [],
  location: {},
  officer: { name: { forename: 'Paulie', surname: 'Walnuts' } },
  lastUpdated: '2023-03-20',
  lastUpdatedBy: { forename: 'Paul', surname: 'Smith' },
}

describe('Appointment detail page', () => {
  it('should display the NDelius drug history deep link when an outcome is recorded', () => {
    const env = createNunjucksTestEnv()
    env.addFilter('toYesNo', toYesNo)
    const $ = cheerio.load(
      env.render('pages/appointments/appointment.njk', {
        crn,
        id: appointment.id,
        url: '',
        queryParams: [],
        hidePageHeader: true,
        personAppointment: {
          personSummary: { name: { forename: 'Eula', surname: 'Schmeler' } },
          appointment,
          documents: [],
        },
        drugHistoryContactTypes,
        enforcementContactTypes,
        isInThePast,
        lastUpdatedBy,
      }),
    )

    const link = $('a').filter((_, element) => $(element).text().includes('drug history in NDelius'))

    expect($('[data-qa="outcomeDetailsCard"]')).toHaveLength(1)
    expect(link).toHaveLength(1)
    expect(link.attr('target')).toBe('_blank')
    expect(link.attr('href')).toBe(
      'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=DrugHistory&CRN=X000001&EventNumber=7654321',
    )
  })
})
