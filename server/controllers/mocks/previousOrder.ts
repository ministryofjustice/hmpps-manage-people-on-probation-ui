import { PreviousOrderDetail } from '../../data/model/previousOrderDetail'

export const mockPreviousOrder = {
  status: 200,
  jsonBody: {
    name: {
      forename: 'Caroline',
      middleName: '',
      surname: 'Wolff',
    },
    title: 'CJA - Std Determinate Custody (16 Months)',
    sentence: {
      offenceDetails: {
        eventNumber: '1',
        offence: {
          description: 'Speeding',
          count: 1,
        },
        dateOfOffence: '2024-01-20',
        notes: 'My note',
        additionalOffences: [
          {
            description: 'Burglary',
            count: 2,
          },
          {
            description: 'Assault',
            count: 1,
          },
        ],
      },
      conviction: {
        sentencingCourt: 'Hull Court',
        responsibleCourt: 'Birmingham Court',
        convictionDate: '2024-03-20',
        additionalSentences: [
          {
            length: 3,
            description: 'Disqualified from Driving',
          },
        ],
      },
      order: {
        description: '12 month community order',
        length: 12,
        endDate: '2025-01-31',
        releaseDate: '2024-11-01',
        startDate: '2024-02-01',
      },
      courtDocuments: [
        {
          id: '4d74f43c-5b42-4317-852e-56c7d29b610b',
          lastSaved: '2024-04-03',
          documentName: 'Pre-sentence report',
        },
        {
          id: '6037becb-0d0c-44e1-8727-193f22df0494',
          lastSaved: '2024-04-01',
          documentName: 'CPS Pack',
        },
        {
          id: 'd072ed9a-999f-4333-a116-a871a845aeb3',
          lastSaved: '',
          documentName: 'Previous convictions',
        },
      ],
    },
  },
} as unknown as PreviousOrderDetail
