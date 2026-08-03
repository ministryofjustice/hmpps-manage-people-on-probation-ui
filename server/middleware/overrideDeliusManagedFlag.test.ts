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
]

const req = httpMocks.createRequest()

const res = mockAppResponse({
  sentences: mockSentences,
})

describe('middleware/overrideDeliusManagedFlag', () => {
  it('should accept one parameter', () => {
    expect(overrideDeliusManagedFlag.length).toEqual(1)
  })
  it('should add delius managed flag if appointment sentence is PRE_SENTENCE', () => {
    const result = overrideDeliusManagedFlag(mockAppointments)(req, res)
    expect(result).toStrictEqual([{ ...mockAppointments[0], deliusManaged: true }, mockAppointments[1]])
  })
})
