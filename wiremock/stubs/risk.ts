import superagent, { SuperAgentRequest } from 'superagent'

const stubSanIndicatorTrue = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: '/arns/san-indicator/crn/.*',
      method: 'GET',
    },
    response: {
      status: 200,
      jsonBody: {
        crn: 'X000001',
        sanIndicator: true,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubArnsUnavailable = (status = 500): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: '/arns/risks/crn/.*',
      method: 'GET',
    },
    response: {
      status,
      jsonBody: {
        message: 'Error',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubArnsServerError = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: '/arns/risks/crn/.*',
      method: 'GET',
    },
    response: {
      fault: 'CONNECTION_RESET_BY_PEER',
    },
  })

const stubSentencePlan404 = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: '/sentence-plan/plans/crn/.*',
      method: 'GET',
    },
    response: {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubSentencePlanAgreementStatus = (agreementStatus = 'AGREED'): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: '/sentence-plan/plans/crn/.*',
      method: 'GET',
    },
    response: {
      status: 200,
      jsonBody: [
        {
          publishedState: 'UNPUBLISHED',
          uuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          createdDate: '2025-09-29T10:54:36.782Z',
          createdBy: {
            externalId: 'string',
            username: 'string',
          },
          lastUpdatedDate: '2025-09-29T10:54:36.782Z',
          lastUpdatedBy: {
            externalId: 'string',
            username: 'string',
          },
          currentVersion: {
            uuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
            version: 0,
            planId: 0,
            planType: 'INITIAL',
            status: 'AWAITING_COUNTERSIGN',
            agreementStatus,
            createdDate: '2025-09-29T10:54:36.782Z',
            createdBy: {
              externalId: 'string',
              username: 'string',
            },
            updatedDate: '2025-09-29T10:54:36.782Z',
            updatedBy: {
              externalId: 'string',
              username: 'string',
            },
            agreementDate: '2025-09-29T10:54:36.782Z',
            readOnly: true,
            checksum: 'string',
            agreementNotes: [
              {
                optionalNote: 'string',
                agreementStatus: 'DRAFT',
                agreementStatusNote: 'string',
                practitionerName: 'string',
                personName: 'string',
                createdDate: '2025-09-29T10:54:36.782Z',
                createdBy: {
                  externalId: 'string',
                  username: 'string',
                },
              },
            ],
            planProgressNotes: [
              {
                note: 'string',
                isSupportNeeded: 'YES',
                isSupportNeededNote: 'string',
                isInvolved: true,
                isInvolvedNote: 'string',
                personName: 'string',
                practitionerName: 'string',
                createdDate: '2025-09-29T10:54:36.782Z',
                createdBy: {
                  externalId: 'string',
                  username: 'string',
                },
              },
            ],
            goals: [
              {
                uuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                title: 'string',
                areaOfNeed: {
                  uuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                  name: 'string',
                },
                targetDate: '2025-09-29',
                reminderDate: '2025-09-29',
                createdDate: '2025-09-29T10:54:36.782Z',
                createdBy: {
                  externalId: 'string',
                  username: 'string',
                },
                updatedDate: '2025-09-29T10:54:36.782Z',
                updatedBy: {
                  externalId: 'string',
                  username: 'string',
                },
                status: 'ACTIVE',
                statusDate: '2025-09-29T10:54:36.782Z',
                goalOrder: 0,
                steps: [
                  {
                    uuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                    description: 'string',
                    status: 'NOT_STARTED',
                    createdDate: '2025-09-29T10:54:36.782Z',
                    createdBy: {
                      externalId: 'string',
                      username: 'string',
                    },
                    actor: 'string',
                  },
                ],
                notes: [
                  {
                    note: 'string',
                    type: 'PROGRESS',
                    createdDate: '2025-09-29T10:54:36.782Z',
                    practitionerName: 'string',
                  },
                ],
                relatedAreasOfNeed: [
                  {
                    uuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                    name: 'string',
                  },
                ],
              },
            ],
            softDeleted: true,
            mostRecentUpdateDate: '2025-09-29T10:54:36.782Z',
            mostRecentUpdateByName: 'string',
            crn: 'string',
          },
          crn: 'string',
        },
      ],
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

export default {
  stubSanIndicatorTrue,
  stubSentencePlan404,
  stubSentencePlanAgreementStatus,
  stubArnsUnavailable,
  stubArnsServerError,
}
