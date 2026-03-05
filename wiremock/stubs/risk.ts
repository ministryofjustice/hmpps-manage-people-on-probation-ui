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

const stubSentencePlanDraft = (): SuperAgentRequest =>
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
          uuid: 'a2dc10a4-7ad2-45e5-8999-7ecbadc8b1d8',
          createdDate: '2025-10-01T16:39:23Z',
          createdBy: {
            externalId: 'string',
            username: 'string',
          },
          lastUpdatedDate: '2025-10-01T16:39:23Z',
          lastUpdatedBy: {
            externalId: 'SYSTEM',
            username: 'hmpps-assess-risks-and-needs-coordinator-api-1',
          },
          currentVersion: {
            uuid: '6f351179-dcf2-406f-b264-5b059e6358e3',
            version: 0,
            planId: 5856,
            planType: 'INITIAL',
            status: 'UNSIGNED',
            agreementStatus: 'DRAFT',
            createdDate: '2025-10-01T16:39:23Z',
            createdBy: {
              externalId: 'string',
              username: 'string',
            },
            updatedDate: '2025-10-01T16:39:23Z',
            updatedBy: {
              externalId: 'string',
              username: 'string',
            },
            agreementDate: null,
            readOnly: false,
            checksum: null,
            agreementNotes: [],
            planProgressNotes: [],
            goals: [],
            softDeleted: false,
            mostRecentUpdateDate: '2025-10-01T16:39:23Z',
            mostRecentUpdateByName: 'string',
            crn: 'X960260',
          },
          versions: [],
          crn: 'X960260',
        },
      ],
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubPredictorScoresOGRS4 = (crn = 'X000001'): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: `/arns/risks/predictors/all/crn/${crn}`,
      method: 'GET',
    },
    response: {
      status: 200,
      jsonBody: [
        {
          outputVersion: '2',
          completedDate: '21 January 2026',
          completedDateTime: '21 January 2026 at 16:05',
          assessmentType: 'layer 3',
          allReoffendingPredictor: {
            name: 'All Reoffending Predictor',
            band: 'LOW',
            staticOrDynamic: 'Dynamic',
            score: 4.41,
            completedDate: '21 January 2026',
          },
          violentReoffendingPredictor: {
            name: 'Violent Reoffending Predictor',
            band: 'LOW',
            staticOrDynamic: 'Dynamic',
            score: 1.91,
            completedDate: '21 January 2026',
          },
          seriousViolentReoffendingPredictor: {
            name: 'Serious Violent Reoffending Predictor',
            band: 'LOW',
            staticOrDynamic: 'Dynamic',
            score: 0.28,
            completedDate: '21 January 2026',
          },
          directContactSexualReoffendingPredictor: {
            name: 'Direct Contact - Sexual Reoffending Predictor',
            band: 'NOT APPLICABLE',
            staticOrDynamic: null,
            score: 0,
            completedDate: '21 January 2026',
          },
          indirectImageContactSexualReoffendingPredictor: {
            name: 'Images and Indirect Contact – Sexual Reoffending Predictor',
            band: 'NOT APPLICABLE',
            staticOrDynamic: null,
            score: 0,
            completedDate: '21 January 2026',
          },
          combinedSeriousReoffendingPredictor: {
            name: 'Combined Serious Reoffending Predictor',
            band: 'LOW',
            staticOrDynamic: 'Dynamic',
            score: 0.28,
            completedDate: '21 January 2026',
          },
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
  stubSentencePlanDraft,
  stubArnsUnavailable,
  stubArnsServerError,
  stubPredictorScoresOGRS4,
}
