import httpMocks from 'node-mocks-http'
import { overrideDeliusManagedFlag } from './overrideDeliusManagedFlag'
import { mockAppResponse } from '../controllers/mocks'
import { Activity } from '../data/model/schedule'
import { Sentence } from '../data/model/sentenceDetails'

const mockAppointments: Activity[] = [
  {
    id: '6',
    eventNumber: '5678',
    type: 'Planned Office Visit (NS)',
    startDateTime: '2024-02-21T10:15:00.382936Z[Europe/London]',
    endDateTime: '2024-02-21T10:30:00.382936Z[Europe/London]',
    deliusManaged: false,
  },
  {
    id: '7',
    eventNumber: '1234',
    type: '3 Way Meeting',
    startDateTime: '2024-02-21T10:15:00.382936Z[Europe/London]',
    endDateTime: '2024-02-21T10:30:00.382936Z[Europe/London]',
    deliusManaged: false,
  },
  {
    id: '8',
    eventNumber: '9101',
    type: 'Phone call',
    startDateTime: '2024-02-21T10:15:00.382936Z[Europe/London]',
    endDateTime: '2024-02-21T10:30:00.382936Z[Europe/London]',
    deliusManaged: true,
  },
]

const mockSentences: Partial<Sentence>[] = [
  {
    id: 2501192724,
    eventNumber: '1234',
    order: {
      description: '12 month Community order',
      sentenceType: 'COMMUNITY',
      endDate: '2024-12-01',
      startDate: '2023-12-01',
      pss: false,
    },
    licenceConditions: [],
  },
  {
    id: 2501192725,
    eventNumber: '5678',
    order: {
      description: 'Pre Sentence',
      sentenceType: 'PRE_SENTENCE',
      endDate: '2024-12-01',
      startDate: '2023-12-01',
    },
  },
  {
    id: 2501192726,
    eventNumber: '9101',
    order: {
      description: 'Custodial sentence',
      sentenceType: 'CUSTODY',
      endDate: '2024-12-01',
      startDate: '2023-12-01',
    },
  },
]

const req = httpMocks.createRequest()

const res = mockAppResponse({
  sentences: mockSentences,
})

describe('middleware/overrideDeliusManagedFlag', () => {
  it('should accept one parameter', () => {
    expect(overrideDeliusManagedFlag.length).toEqual(1)
  })
  it('should override deliusManaged flag to true if appointment sentence is PRE_SENTENCE and deliusManaged is false', () => {
    const result = overrideDeliusManagedFlag(mockAppointments)(req, res)
    expect(result).toStrictEqual([
      { ...mockAppointments[0], deliusManaged: true },
      mockAppointments[1],
      mockAppointments[2],
    ])
  })
})
