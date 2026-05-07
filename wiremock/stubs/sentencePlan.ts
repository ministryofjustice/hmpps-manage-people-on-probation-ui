import superagent, { SuperAgentRequest } from 'superagent'

const stubSentencePlanAgreementDraft = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: '/assessment-platform/query',
      method: 'POST',
    },
    response: {
      status: 200,
      jsonBody: {
        queries: [
          {
            result: {
              type: 'AssessmentVersionQueryResult',
              assessmentUuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
              updatedAt: '2025-09-29T10:54:36.782Z',
              collections: [
                {
                  uuid: 'c0000000-0000-0000-0000-000000000001',
                  createdAt: '2025-09-29T10:54:36.782Z',
                  updatedAt: '2025-09-29T10:54:36.782Z',
                  name: 'PLAN_AGREEMENTS',
                  items: [
                    {
                      uuid: 'd0000000-0000-0000-0000-000000000001',
                      createdAt: '2025-09-29T10:54:36.782Z',
                      updatedAt: '2025-09-29T10:54:36.782Z',
                      answers: {
                        agreement_question: { type: 'Single', value: 'yes' },
                        created_by: { type: 'Single', value: 'string' },
                      },
                      properties: {
                        status: { type: 'Single', value: 'DRAFT' },
                        status_date: { type: 'Single', value: '2025-09-29T10:54:36.782Z' },
                      },
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

export default {
  stubSentencePlanAgreementDraft,
}
