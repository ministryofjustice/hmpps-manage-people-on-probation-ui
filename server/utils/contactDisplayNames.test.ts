import {
  getApprovedContactCode,
  getApprovedContactDisplayName,
  mapPersonActivityWithApprovedContactDisplayNames,
  mapPersonAppointmentWithApprovedContactDisplayNames,
} from './contactDisplayNames'
import { PersonActivity } from '../data/model/activityLog'
import { PersonAppointment } from '../data/model/schedule'

describe('contactDisplayNames', () => {
  it('returns the approved display name for a legacy contact type', () => {
    expect(getApprovedContactDisplayName('Phone Contact to PoP')).toBe('Telephone contact to person on probation')
    expect(getApprovedContactDisplayName('Victim liaison contact')).toBe('Victim liaison contact')
    expect(getApprovedContactDisplayName('Assistance to Court - Update from PP')).toBe(
      'Assistance to court – update from probation practitioner',
    )
  })

  it('returns the approved contact code for legacy or approved contact names', () => {
    expect(getApprovedContactCode('Phone Contact to PoP')).toBe('CTOB')
    expect(getApprovedContactCode('Victim liaison contact')).toBe('CVIC')
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
})
