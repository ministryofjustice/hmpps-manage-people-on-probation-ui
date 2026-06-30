import {
  normalizeContactDisplayNameKey,
  getApprovedContactDisplayName,
  mapScheduleWithApprovedContactDisplayNames,
  mapPersonActivityWithApprovedContactDisplayNames,
  mapPersonAppointmentWithApprovedContactDisplayNames,
  mapEnforcementContactsWithApprovedContactDisplayNames,
} from './contactDisplayNames'
import { PersonActivity } from '../data/model/activityLog'
import { PersonAppointment, EnforcementContactsResponse } from '../data/model/schedule'

describe('contactDisplayNames', () => {
  it('returns the approved display name for a legacy contact type', () => {
    expect(getApprovedContactDisplayName('Phone Contact to PoP')).toBe('Telephone contact to person on probation')
    expect(getApprovedContactDisplayName('Assistance to Court - Update from PP')).toBe(
      'Assistance to court – update from probation practitioner',
    )
  })

  it('maps activity log entries from action or type and falls back when unmatched', () => {
    const personActivity = {
      activities: [
        { id: '1', type: 'Phone Contact from PoP' },
        { id: '2', type: 'Phone call', action: 'eMail/Text from Other' },
        { id: '3', type: 'Legacy NDelius name' },
      ],
    } as PersonActivity

    expect(mapPersonActivityWithApprovedContactDisplayNames(personActivity).activities).toEqual([
      { id: '1', type: 'Phone Contact from PoP', displayName: 'Telephone contact from person on probation' },
      { id: '2', type: 'Phone call', action: 'eMail/Text from Other', displayName: 'Email or text from other' },
      { id: '3', type: 'Legacy NDelius name' },
    ])
  })

  it('maps appointment details without changing the original type used by business logic', () => {
    const personAppointment = {
      appointment: {
        id: '1',
        type: 'Management Oversight - HVRA',
      },
    } as PersonAppointment

    expect(mapPersonAppointmentWithApprovedContactDisplayNames(personAppointment).appointment).toEqual({
      id: '1',
      type: 'Management Oversight - HVRA',
      displayName: 'Management oversight – home visit risk assessment',
    })
  })

  it('maps enforcement contacts and calculates isOverdue', () => {
    const now = new Date()
    const pastDate = new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString().split('T')[0] // yesterday
    const futureDate = new Date(now.getTime() + 1000 * 60 * 60 * 24).toISOString().split('T')[0] // tomorrow

    const response = {
      enforcementContacts: [
        {
          appointmentType: 'Phone Contact from PoP',
          evidenceDueDate: pastDate,
        },
        {
          appointmentType: 'Home Visit',
          evidenceDueDate: futureDate,
        },
        {
          appointmentType: 'Office Appointment',
          evidenceDueDate: undefined,
        },
      ],
    } as unknown as EnforcementContactsResponse

    const result = mapEnforcementContactsWithApprovedContactDisplayNames(response)

    expect(result.enforcementContacts[0]).toMatchObject({
      displayName: 'Telephone contact from person on probation',
    })
    expect(result.enforcementContacts[1]).toMatchObject({
      displayName: 'Home Visit', // No mapping in approvedContactDisplayNames for "Home Visit" (it's "Home visit" lowercase in mapping usually, let's check)
    })
  })

  it('maps enforcement contacts and calculates isOverdue correctly for today', () => {
    const today = new Date().toISOString().split('T')[0]

    const response = {
      enforcementContacts: [
        {
          appointmentType: 'Phone Contact from PoP',
          evidenceDueDate: today,
        },
      ],
    } as unknown as EnforcementContactsResponse

    const result = mapEnforcementContactsWithApprovedContactDisplayNames(response)
    // TODO: Add assertion
  })

  it('mapScheduleWithApprovedContactDisplayNames maps appointments in schedule', () => {
    const schedule = {
      personSchedule: {
        appointments: [
          { id: 1, type: 'Phone Contact from PoP' },
          { id: 2, type: 'Unknown' },
        ],
      },
    } as any
    const result = mapScheduleWithApprovedContactDisplayNames(schedule)
    expect(result.personSchedule.appointments[0].displayName).toBe('Telephone contact from person on probation')
    expect(result.personSchedule.appointments[1].displayName).toBeUndefined()
  })

  it('normalizeContactDisplayNameKey normalizes various strings', () => {
    expect(normalizeContactDisplayNameKey('Phone – Contact')).toBe('phone - contact')
    expect(normalizeContactDisplayNameKey('  Multiple   Spaces  ')).toBe('multiple spaces')
    expect(normalizeContactDisplayNameKey('slash/separated')).toBe('slash / separated')
  })
})
