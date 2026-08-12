import superagent, { SuperAgentRequest } from 'superagent'

export interface TierHistoryEntryStub {
  tierScore: string
  calculationId?: string
  calculationDate: string
  changeReason?: string
  provisional?: boolean
}

// Stubs the Tier API tier history endpoint. TIER_API_URL is http://localhost:9091/tier in
// feature.env, so the app requests /tier/v3/crn/{crn}/tier/history.
const stubTierHistory = ({
  crn,
  history,
  status = 200,
}: {
  crn: string
  history: TierHistoryEntryStub[]
  status?: number
}): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPath: `/tier/v3/crn/${crn}/tier/history`,
      method: 'GET',
    },
    response: {
      status,
      jsonBody: history,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

export default { stubTierHistory }
