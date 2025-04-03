import { SentenceDetails } from '../../data/model/sentenceDetails'

export const mockSentenceDetails = {
  personSummary: {
    name: {
      forename: 'Caroline',
      surname: 'Wolff',
    },
    crn: 'X000001',
    dateOfBirth: '1979-08-18',
  },
  sentenceSummaryList: [
    {
      eventNumber: '3',
      description: 'Default Sentence Type',
    },
    {
      eventNumber: '1',
      description: '12 month community order',
    },
  ],
  sentence: {
    offenceDetails: {
      eventNumber: '3',
      offence: {
        description: 'Murder',
        count: 3,
      },
      dateOfOffence: '2024-03-20',
      notes: 'overview',
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
      description: 'Default Sentence Type',
      length: 12,
      endDate: '2025-03-19',
      startDate: '2024-03-19',
    },
    requirements: [],
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
    licenceConditions: [
      {
        id: 7007,
        mainDescription: 'Alcohol Monitoring (Electronic Monitoring)',
        subTypeDescription: 'You must not drink any alcohol until [END DATE].',
        imposedReleasedDate: '2024-12-25',
        actualStartDate: '2024-12-26',
        licenceConditionNotes: [
          {
            id: 0,
            createdBy: 'Jon Jones',
            createdByDate: '2024-08-21',
            note: 'Licence Condition created automatically from the Create and Vary a licence system of\nAllow person(s) as designated by your supervising officer to install an electronic monitoring tag on you and access to install any associated equipment in your property, and for the purpose of ensuring that equipment is functioning correctly. You must not damage or tamper with these devices and ensure that the tag is charged, and report to your supervising officer and the EM provider immediately if the tag or the associated equipment are not working correctly. This will be for the purpose of monitoring your alcohol abstinence licence condition(s) unless otherwise authorised by your supervising officer. Licence Condition created automatically from the Create and Vary a licence system of\nAllow person(s) as designated by your supervising officer to install an electronic monitoring tag on you and access to install any associated equipment in your property, and for the purpose of ensuring that equipment is functioning correctly. You must not damage or tamper with these devices and ensure that the tag is charged, and report to your supervising officer and the EM provider immediately if the tag or the associated equipment are not working correctly. This will be for the purpose of monitoring your alcohol abstinence licence condition(s) unless otherwise authorised by your supervising officer.Licence Condition created automatically from the Create and Vary a licence system of\nAllow person(s) as desi',
            hasNoteBeenTruncated: true,
          },
        ],
      },
      {
        id: 3003,
        mainDescription: 'Freedom of movement',
        imposedReleasedDate: '2022-02-04',
        licenceConditionNotes: [
          {
            id: 1,
            note: 'Not to go to a football game.\nmulti-line\n\nnote\n\nthis is the forth line',
            hasNoteBeenTruncated: false,
          },
        ],
      },
      {
        id: 2002,
        mainDescription: 'Residence at a specific place',
        subTypeDescription: 'Bespoke Condition (See Notes)',
        imposedReleasedDate: '2024-10-03',
        actualStartDate: '2023-11-15',
        licenceConditionNotes: [
          {
            id: 2,
            createdBy: 'Mark Smith',
            createdByDate: '2023-10-04',
            note: "James must reside at his parent's house in Scotland for the duration of his release on licence.",
            hasNoteBeenTruncated: false,
          },
        ],
      },
      {
        id: 1001,
        mainDescription: 'Licence - Prohibited Activity',
        imposedReleasedDate: '2023-09-26',
        licenceConditionNotes: [],
      },
    ],
  },
} as unknown as SentenceDetails
