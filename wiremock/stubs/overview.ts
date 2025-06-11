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

export default { stubOverviewVisorRegistration }
