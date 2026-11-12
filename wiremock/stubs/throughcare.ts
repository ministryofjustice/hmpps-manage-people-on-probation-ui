import superagent, { Response } from 'superagent'

const stubPrisonerReleased = (): Promise<Array<Response>> =>
  Promise.all([
    superagent.post('http://localhost:9091/__admin/mappings').send({
      request: {
        urlPath: '/prisoner-search/prisoner/G9566GQ',
        method: 'GET',
      },
      response: {
        status: 200,
        jsonBody: {
          prisonerNumber: 'G9566GQ',
          firstName: 'CAROLINE',
          lastName: 'WOLFF',
          status: 'INACTIVE OUT',
          inOutStatus: 'OUT',
          legalStatus: 'SENTENCED',
          lastMovementTypeCode: 'REL',
          lastMovementReasonCode: 'CR',
          prisonId: 'OUT',
          prisonName: 'Outside',
          lastPrisonId: 'MDI',
          recall: false,
          releaseDate: '2025-03-16',
        },
        headers: {
          'Content-Type': 'application/json',
        },
      },
    }),
    superagent.post('http://localhost:9091/__admin/mappings').send({
      request: {
        urlPath: '/prison-register/prisons/id/MDI',
        method: 'GET',
      },
      response: {
        status: 200,
        jsonBody: {
          prisonId: 'MDI',
          prisonName: 'Moorland (HMP & YOI)',
          active: true,
          male: true,
          female: false,
          contracted: false,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      },
    }),
  ])

export default { stubPrisonerReleased }
