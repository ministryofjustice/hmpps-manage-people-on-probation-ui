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
          completedDate: '2026-01-21T16:05:43',
          status: 'COMPLETE',
          assessmentType: 'LAYER3',
          outputVersion: '2',
          output: {
            allReoffendingPredictor: {
              staticOrDynamic: 'DYNAMIC',
              score: 16.8,
              band: 'LOW',
            },
            violentReoffendingPredictor: {
              staticOrDynamic: 'DYNAMIC',
              score: 16.94,
              band: 'LOW',
            },
            seriousViolentReoffendingPredictor: {
              staticOrDynamic: 'DYNAMIC',
              score: 0.28,
              band: 'LOW',
            },
            directContactSexualReoffendingPredictor: {
              score: 1,
              band: 'LOW',
            },
            indirectImageContactSexualReoffendingPredictor: {
              score: 1,
              band: 'LOW',
            },
            combinedSeriousReoffendingPredictor: {
              algorithmVersion: '6',
              staticOrDynamic: 'DYNAMIC',
              score: 0.28,
              band: 'LOW',
            },
            generalPredictorScore: {
              staticOrDynamic: 'DYNAMIC',
              score: 1,
              band: 'LOW',
            },
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
  stubArnsUnavailable,
  stubArnsServerError,
  stubPredictorScoresOGRS4,
}
