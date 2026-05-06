import { activityLogEventName } from './activityLogEventName'

describe('activityLogEventName', () => {
  it('uses the approved display name to map contact events to contact codes', () => {
    expect(
      activityLogEventName('view', {
        id: '1',
        type: 'Phone call',
        displayName: 'Victim liaison contact',
        startDateTime: '2025-01-01T10:00:00Z',
      }),
    ).toBe('view_CVIC')
  })

  it('falls back to legacy names from action or type when displayName is not present', () => {
    expect(
      activityLogEventName('manage', {
        id: '1',
        type: 'Legacy NDelius label',
        action: 'eMail/Text from Other',
        startDateTime: '2025-01-01T10:00:00Z',
      }),
    ).toBe('manage_CM3A')
  })

  it('uses a direct code from the activity when one is available', () => {
    expect(
      activityLogEventName('view', {
        id: '1',
        type: 'Something custom',
        code: 'C326',
        startDateTime: '2025-01-01T10:00:00Z',
      } as never),
    ).toBe('view_C326')
  })

  it('falls back to appointment label mappings when the activity does not carry an explicit contact code', () => {
    expect(
      activityLogEventName('manage', {
        id: '1',
        type: 'Office appointment',
        startDateTime: '2025-01-01T10:00:00Z',
      }),
    ).toBe('manage_PlannedOfficeVisitNS')
  })

  it('returns undefined when no contact code can be resolved', () => {
    expect(
      activityLogEventName('manage', {
        id: '1',
        type: 'Something unmatched',
        startDateTime: '2025-01-01T10:00:00Z',
      }),
    ).toBeUndefined()
  })
})
