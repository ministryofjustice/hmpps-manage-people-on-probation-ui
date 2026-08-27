import superagent, { SuperAgentRequest } from 'superagent'

export interface FinalThirdEligibilityStub {
  eligible: boolean
  since: string
}

const stubCurrentPhase = ({
  crn,
  finalThirdEligibility,
  status = 200,
}: {
  crn: string
  finalThirdEligibility?: FinalThirdEligibilityStub | null
  status?: number
}): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: `/supervision-packages/frontend-context/${crn}`,
      method: 'GET',
    },
    response: {
      status,
      jsonBody: { finalThirdEligibility },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

export default { stubCurrentPhase }
