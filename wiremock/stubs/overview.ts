import superagent, { SuperAgentRequest } from 'superagent'

const stubOverviewVisorRegistration = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: '/mas/overview/X778160',
      queryParameters: {
        sentenceNumber: {
          matches: '.*',
        },
      },
    },
    response: {
      status: 200,
      jsonBody: {
        appointmentsWithoutOutcome: 5,
        absencesWithoutEvidence: 1,
        personalDetails: {
          name: {
            forename: 'Caroline',
            middleName: 'Linda',
            surname: 'Wolff',
          },
          telephoneNumber: '0191278654',
          mobileNumber: '07989654824',
          preferredName: 'Caz',
          preferredGender: 'Female',
          dateOfBirth: '2002-01-09',
          disabilities: [
            {
              description: 'Dyslexia',
            },
            {
              description: 'Arthritis',
            },
          ],
          provisions: [
            {
              description: 'Hand Rails',
            },
            {
              description: 'Special Furniture',
            },
          ],
          personalCircumstances: [
            {
              subType: 'Life imprisonment (Adult)',
              type: 'Committed/ Transferred to Crown',
            },
          ],
        },
        previousOrders: {
          breaches: 0,
          count: 1,
        },
        schedule: {
          nextAppointment: {
            date: '2024-03-09T14:59:05.382936Z[Europe/London]',
            description: 'Initial Appointment - In office (NS)',
          },
        },
        sentences: [
          {
            additionalOffences: [],
            eventNumber: '3',
            mainOffence: {
              code: '18502',
              description: 'Breach of Restraining Order (Protection from Harassment Act 1997) - 00831',
            },
            order: {
              description: '12 month Community order',
              endDate: '2024-12-01',
              startDate: '2023-12-01',
            },
            rarDescription: '16 of 20 RAR days completed',
          },
          {
            additionalOffences: [
              {
                code: '9087',
                description: 'Burglary - 9087',
              },
              {
                code: '9876',
                description: 'Arson - 9876',
              },
            ],
            eventNumber: '2',
            mainOffence: {
              code: '18502',
              description:
                '(Having possession a picklock or other implement with intent to break into any premises - 18502)',
            },
            order: {
              description: 'ORA Community Order',
              endDate: '2024-09-01',
              startDate: '2020-03-02',
            },
            rarDescription: '10 of 10 RAR days completed',
          },
        ],
        activity: {
          acceptableAbsenceCount: 1,
          unacceptableAbsenceCount: 2,
          attendedButDidNotComplyCount: 2,
          outcomeNotRecordedCount: 2,
          waitingForEvidenceCount: 2,
          rescheduledCount: 2,
          absentCount: 2,
          rescheduledByStaffCount: 2,
          rescheduledByPersonOnProbationCount: 2,
          lettersCount: 2,
          nationalStandardAppointmentsCount: 2,
          compliedAppointmentsCount: 3,
        },
        compliance: {
          currentBreaches: 2,
          breachStarted: true,
          breachesOnCurrentOrderCount: 1,
          priorBreachesOnCurrentOrderCount: 1,
          failureToComplyCount: 3,
        },
        registrations: ['VISOR', 'Restraining Order', 'Domestic Abuse Perpetrator', 'Risk to Known Adult'],
        mappa: {
          level: 3,
          levelDescription: 'M3 Desc',
          category: 2,
          categoryDescription: 'X2 Desc',
          startDate: '2024-12-12',
          reviewDate: '2024-12-13',
          lastUpdated: '2024-10-08',
        },
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubOverviewRiskFlagsNoLevel = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: '/mas/risk-flags/X000001',
      method: 'GET',
    },
    response: {
      status: 200,
      jsonBody: {
        personSummary: {
          name: {
            forename: 'Caroline',
            middleName: 'Linda',
            surname: 'Wolff',
          },
          crn: 'X000001',
          dateOfBirth: '1979-08-18',
        },
        opd: {
          eligible: true,
          date: '2024-12-12',
        },
        mappa: {
          level: 2,
          levelDescription: 'M2 Desc',
          category: 0,
          categoryDescription: 'X9 Desc',
          startDate: '2024-12-12',
          reviewDate: '2024-12-13',
        },
        riskFlags: [
          {
            id: 1,
            description: 'Risk to Staff',
            createdDate: '2022-12-18',
            nextReviewDate: '2024-12-15',
            createdBy: {
              forename: 'Paul',
              surname: 'Smith',
            },
            removed: false,
          },
          {
            id: 2,
            description: 'Domestic Abuse Perpetrator',
            riskNotes: [
              {
                id: 0,
                createdBy: 'Patrick Bateman',
                createdByDate: '2024-10-30',
                note: 'Risk Notes 1',
                hasNoteBeenTruncated: false,
              },
              {
                id: 1,
                note: 'Note 1',
                hasNoteBeenTruncated: false,
              },
            ],
            nextReviewDate: '2025-08-18',
            mostRecentReviewDate: '2023-12-18',
            createdDate: '2022-12-18',
            createdBy: {
              forename: 'Paul',
              surname: 'Smith',
            },
            removed: false,
          },
          {
            id: 3,
            level: 'LOW',
            description: 'Risk to Known Adult',
            riskNotes: [
              {
                id: 0,
                createdBy: 'Tom Brady',
                createdByDate: '2024-10-30',
                note: 'Risk Notes created automatically from the Create and Vary a licence system of\nAllow person(s) as designated by your supervising officer to install an electronic monitoring tag on you and access to install any associated equipment in your property, and for the purpose of ensuring that equipment is functioning correctly. You must not damage or tamper with these devices and ensure that the tag is charged, and report to your supervising officer and the EM provider immediately if the tag or the associated equipment are not working correctly. This will be for the purpose of monitoring your alcohol abstinence Disability Notes(s) unless otherwise authorised by your supervising officer.',
                hasNoteBeenTruncated: true,
              },
              {
                id: 1,
                note: 'Note 1',
                hasNoteBeenTruncated: false,
              },
            ],
            nextReviewDate: '2025-08-18',
            mostRecentReviewDate: '2023-12-18',
            createdDate: '2022-12-18',
            createdBy: {
              forename: 'Paul',
              surname: 'Smith',
            },
            removed: false,
          },
          {
            id: 4,
            level: 'INFORMATION_ONLY',
            description: 'Domestic Abuse Perpetrator',
            riskNotes: [
              {
                id: 0,
                createdBy: 'John Wick',
                createdByDate: '2024-10-30',
                note: 'Risk Notes 4',
                hasNoteBeenTruncated: false,
              },
              {
                id: 1,
                note: 'Note 1',
                hasNoteBeenTruncated: false,
              },
            ],
            nextReviewDate: '2025-08-18',
            mostRecentReviewDate: '2023-12-18',
            createdDate: '2022-12-18',
            createdBy: {
              forename: 'Paul',
              surname: 'Smith',
            },
            removed: false,
          },
        ],
        removedRiskFlags: [
          {
            id: 4,
            description: 'Restraining Order',
            riskNotes: [
              {
                id: 0,
                createdBy: 'Harry Hole',
                createdByDate: '2025-01-01',
                note: 'Removed risk note 1',
                hasNoteBeenTruncated: false,
              },
            ],
            nextReviewDate: '2025-08-18',
            mostRecentReviewDate: '2023-12-18',
            createdDate: '2022-12-18',
            createdBy: {
              forename: 'Paul',
              surname: 'Smith',
            },
            removed: true,
            removalHistory: [
              {
                riskRemovalNotes: [
                  {
                    id: 0,
                    createdBy: 'Dave Holland',
                    createdByDate: '2025-01-02',
                    note: 'Removal history note 1',
                    hasNoteBeenTruncated: false,
                  },
                ],
                removalDate: '2022-11-18',
                removedBy: {
                  forename: 'Paul',
                  surname: 'Smith',
                },
              },
            ],
          },
          {
            id: 5,
            description: 'Domestic Abuse Perpetrator',
            riskNotes: [
              {
                id: 0,
                createdBy: 'Charlie Brown',
                createdByDate: '2025-01-02',
                note: 'Removed risk note 2',
                hasNoteBeenTruncated: false,
              },
            ],
            nextReviewDate: '2025-08-18',
            mostRecentReviewDate: '2023-12-18',
            createdDate: '2022-12-18',
            createdBy: {
              forename: 'Paul',
              surname: 'Smith',
            },
            removed: true,
            removalHistory: [
              {
                removalDate: '2022-11-18',
                removedBy: {
                  forename: 'Paul',
                  surname: 'Smith',
                },
              },
            ],
          },
          {
            id: 6,
            description: 'Risk to Known Adult',
            riskNotes: [
              {
                id: 0,
                createdBy: 'Mickey Haller',
                createdByDate: '2025-01-03',
                note: 'Removed risk note 3',
                hasNoteBeenTruncated: false,
              },
            ],
            nextReviewDate: '2025-08-18',
            mostRecentReviewDate: '2023-12-18',
            createdDate: '2022-12-18',
            createdBy: {
              forename: 'Paul',
              surname: 'Smith',
            },
            removed: true,
            removalHistory: [
              {
                riskRemovalNotes: [
                  {
                    id: 0,
                    createdBy: 'Peter Jones',
                    createdByDate: '2025-01-10',
                    note: 'Removal history note 2',
                    hasNoteBeenTruncated: false,
                  },
                ],
                removalDate: '2022-11-18',
                removedBy: {
                  forename: 'Paul',
                  surname: 'Smith',
                },
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

export default { stubOverviewVisorRegistration, stubOverviewRiskFlagsNoLevel }
