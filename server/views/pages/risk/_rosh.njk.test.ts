import * as cheerio from 'cheerio'
import httpMocks from 'node-mocks-http'
import { RoshRiskWidgetDto } from '../../../data/model/risk'
import { AppResponse } from '../../../models/Locals'
import { createNunjucksTestEnv } from '../../../testutils/nunjucksTestEnv'

type TestModel = {
  flags: Record<string, boolean>
  risksWidget: RoshRiskWidgetDto
}

const baseModel: TestModel = {
  flags: {
    enableNDeliusRosh: true,
  },
  risksWidget: {
    overallRisk: 'MEDIUM',
    assessedOn: '2026-06-09T10:27:01',
    risks: [
      { riskTo: 'Children', community: 'MEDIUM', custody: 'MEDIUM' },
      { riskTo: 'Public', community: 'MEDIUM', custody: 'MEDIUM' },
      { riskTo: 'Known Adult', community: 'MEDIUM', custody: 'MEDIUM' },
      { riskTo: 'Staff', community: 'MEDIUM', custody: 'MEDIUM' },
      { riskTo: 'Prisoners', community: 'N/A', custody: 'MEDIUM' },
    ],
  },
}

const render = (model = {} as Partial<TestModel>) => {
  const input = {
    ...baseModel,
    ...model,
  }
  const req = httpMocks.createRequest()
  const res = httpMocks.createResponse({
    locals: input,
  }) as AppResponse
  const env = createNunjucksTestEnv(req, res)
  return cheerio.load(env.render('pages/risk/_rosh.njk', input))
}

describe('ROSH widget', () => {
  it('should show the rosh warning if enableNDeliusRosh feature flag is enabled', () => {
    const $ = render()
    expect($('[data-qa=roshWarning]').find('strong').text()).toContain('Check ROSH in NDelius and OASys')
    expect($('[data-qa=roshWarning]').find('p').text()).toContain(
      'MPOP may show the last signed and locked ROSH level rather that the latest risk information.',
    )
  })
  it('should not show the rosh warning if enableNDeliusRosh feature flag is disabled', () => {
    const $ = render({
      flags: {
        enableNDeliusRosh: false,
      },
    })
    expect($('[data-qa=roshWarning]').length).toBe(0)
  })
})
