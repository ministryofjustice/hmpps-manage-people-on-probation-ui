import { ContactEnforcementAction, ContactOutcome } from '../data/model/schedule'
import { getContactEnforcementActions } from './getContactEnforcementActions'

const mockEnforcementActions: ContactEnforcementAction[][] = [
  [
    { code: 'IBR', description: null, defaultResponsePeriodDays: 7 },
    { code: 'ROM', description: 'Refer to Offender Manager', defaultResponsePeriodDays: 7 },
  ],
  [
    { code: 'EA13', description: 'YOT OM Notified', defaultResponsePeriodDays: 7 },
    { code: 'EA07', description: 'Withdrawal of Warning', defaultResponsePeriodDays: 7 },
  ],
  [],
  [{ code: 'EA08', description: 'Breach Letter Sent', defaultResponsePeriodDays: 7 }],
]

const mockContactOutcomes = (hasActions = false): ContactOutcome[] => [
  {
    code: 'ATTC',
    description: 'Attended - Complied',
    enforcementActions: hasActions ? mockEnforcementActions[0] : [],
  },
  {
    code: 'AFTC',
    description: 'Attended - Failed To Comply',
    enforcementActions: hasActions ? mockEnforcementActions[1] : [],
  },
  {
    code: 'UAAB',
    description: 'Unacceptable Absence',
    enforcementActions: hasActions ? mockEnforcementActions[2] : [],
  },
  {
    code: 'AFTA',
    description: 'Failed To Attend',
    enforcementActions: hasActions ? mockEnforcementActions[3] : [],
  },
]

describe('utils/getContactEnforcementActions', () => {
  it('should return an empty array if no enforcement actions', () => {
    const result = getContactEnforcementActions(mockContactOutcomes())
    expect(result).toStrictEqual([])
  })
  it('should return the enforcement actions', () => {
    const result = getContactEnforcementActions(mockContactOutcomes(true))
    expect(result).toStrictEqual([
      ...mockEnforcementActions[0],
      ...mockEnforcementActions[1],
      ...mockEnforcementActions[3],
    ])
  })
})
