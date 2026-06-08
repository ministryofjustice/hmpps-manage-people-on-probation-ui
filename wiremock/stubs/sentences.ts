import superagent, { SuperAgentRequest } from 'superagent'

const stubSentences = ({
  crn = 'X778160',
  sentenceType = 'COMMUNITY',
  startDate = '2023-12-01',
  endDate = '2026-01-01',
}): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: '/mas/sentences/X778160',
      method: 'GET',
      queryParameters: {
        includeRarRequirements: {
          equalTo: 'false',
        },
      },
    },
    response: {
      status: 200,
      jsonBody: {
        personSummary: {
          crn,
        },
        sentences: [
          {
            id: 2501192724,
            eventNumber: '12345',
            mainOffence: {
              code: '18502',
              description: 'Breach of Restraining Order (Protection from Harassment Act 1997) - 00831',
            },
            order: {
              description: '12 month Community order',
              sentenceType,
              startDate,
              endDate,
            },
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
                active: true,
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
                active: true,
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
                active: true,
              },
              {
                id: 1001,
                mainDescription: 'Licence - Prohibited Activity',
                imposedReleasedDate: '2023-09-26',
                licenceConditionNotes: [],
                active: false,
              },
            ],
          },
          {
            id: 2501192725,
            eventNumber: '5678',
            mainOffence: {
              code: '18502',
              description:
                '(Having possession a picklock or other implement with intent to break into any premises - 18502)',
            },
            order: {
              description: 'ORA Community Order',
              sentenceType: 'COMMUNITY',
              endDate,
              startDate,
            },
            requirements: [
              {
                id: 1234,
                code: 'F',
                actualStartDate: '2024-04-12',
                description: '12 days RAR, 1 completed',
                length: 12,
                notes: 'my notes',
                rar: {
                  completed: 1,
                  scheduled: 11,
                  totalDays: 12,
                },
                active: true,
              },
              {
                id: 5678,
                code: 'RM49',
                expectedStartDate: '2024-01-07',
                actualStartDate: '2024-01-12',
                expectedEndDate: '2024-03-10',
                actualEndDate: '2024-01-09',
                terminationReason: 'Expired (Normal)',
                description: 'Curfew (Electronic Monitored)',
                length: '10',
                lengthUnitValue: 'Hours',
                notes: 'curfew notes',
                active: true,
              },
              {
                id: 9101,
                code: 'W',
                actualStartDate: '2015-05-22',
                description: 'Unpaid Work - Regular',
                length: 100,
                lengthUnitValue: 'Hours',
                notes: 'unpaid work notes',
                active: false,
              },
            ],
          },
          {
            id: 2501192726,
            eventNumber: '5679',
            mainOffence: {
              code: '18502',
              description:
                '(Having possession a picklock or other implement with intent to break into any premises - 18502)',
            },
            order: {
              description: 'ORA Community Order',
              sentenceType: 'COMMUNITY',
              endDate,
              startDate,
            },
            nsis: [
              {
                id: 162,
                description: 'BRE description',
              },
              {
                id: 163,
                description: 'OPD1 description (OPD1 subtype)',
              },
            ],
          },
        ],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubSingleSentence = ({
  crn = 'X778160',
  sentenceType = 'COMMUNITY',
  startDate = '2023-12-01',
  endDate = '2026-01-01',
}): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: '/mas/sentences/X778160',
      method: 'GET',
      queryParameters: {
        includeRarRequirements: {
          equalTo: 'false',
        },
      },
    },
    response: {
      status: 200,
      jsonBody: {
        personSummary: {
          crn,
        },
        sentences: [
          {
            id: 2501192724,
            eventNumber: '12345',
            mainOffence: {
              code: '18502',
              description: 'Breach of Restraining Order (Protection from Harassment Act 1997) - 00831',
            },
            order: {
              description: '12 month Community order',
              sentenceType,
              startDate,
              endDate,
            },
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
                active: true,
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
                active: true,
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
                active: true,
              },
              {
                id: 1001,
                mainDescription: 'Licence - Prohibited Activity',
                imposedReleasedDate: '2023-09-26',
                licenceConditionNotes: [],
                active: false,
              },
            ],
          },
        ],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

export default {
  stubSentences,
  stubSingleSentence,
}
