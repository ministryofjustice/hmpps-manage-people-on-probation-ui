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
  it('should display a cancelled online check in as a system generated contact', () => {
    const env = createNunjucksTestEnv()
    env.addFilter('toYesNo', toYesNo)
    const cancelledCheckIn: Partial<Activity> = {
      ...appointment,
      id: '33',
      type: 'Online probation check in',
      description: 'Online check in cancelled',
      esupervisionId: '7fa85f64-5717-4562-b3fc-2c963f66afa6',
      isCancelledCheckIn: true,
      isAppointment: true,
      hasOutcome: false,
      appointmentNotes: [{ id: 0, note: 'Reason: The person on probation is in hospital' }],
    }
    const $ = cheerio.load(
      env.render('pages/appointments/appointment.njk', {
        crn,
        id: cancelledCheckIn.id,
        url: '',
        queryParams: [],
        hidePageHeader: true,
        personAppointment: {
          personSummary: { name: { forename: 'Eula', surname: 'Schmeler' } },
          appointment: cancelledCheckIn,
          documents: [],
        },
        drugHistoryContactTypes,
        enforcementContactTypes,
        isInThePast,
        lastUpdatedBy,
      }),
    )

    expect($('[data-qa="appointmentType"]').text().trim()).toBe('System generated')
    expect($('[data-qa="appointmentTitle"]').text().trim()).toBe('Online check in cancelled')
    expect($('[data-qa="appointmentDetailsCard"] .app-summary-card__title').text().trim()).toBe('Contact details')
    expect($('[data-qa="typeLabel"]').text()).toBe('Type')
    expect($('[data-qa="typeValue"]').text()).toBe('Online probation check in')
    expect($('[data-qa="descriptionLabel"]')).toHaveLength(0)
    expect($('[data-qa="rarActivityLabel"]')).toHaveLength(0)
    expect($('[data-qa="notesLabel"]').text()).toBe('Notes')
    expect($('[data-qa="notesValue"]').text()).toContain('Reason: The person on probation is in hospital')
  })

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
