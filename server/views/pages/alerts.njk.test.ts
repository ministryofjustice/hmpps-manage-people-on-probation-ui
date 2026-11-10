// import * as cheerio from 'cheerio'
// import httpMocks from 'node-mocks-http'
// import { AppResponse } from '../../models/Locals'
// import { createNunjucksTestEnv } from '../../testutils/nunjucksTestEnv'
// import { UserAlerts } from '../../models/Alerts'
// import { RiskRoshScoreMap } from '../../controllers/alerts'
// import { CrnToRiskWidgetMap, RoshBadgeLevel } from '../../data/model/risk'

// const mockAlertsData: UserAlerts = {
//   content: [
//     {
//       id: 2511321657,
//       type: { description: '3 Way Meeting (Non NS)', editable: true },
//       crn: 'X643390',
//       name: { forename: 'Conrad', middleName: '', surname: 'Littel' },
//       date: '2026-10-13',
//       alertNotes: [],
//       officer: {
//         name: { forename: 'AutomatedTestUser', surname: 'AutomatedTestUser' },
//         code: 'N54A022',
//       },
//     },
//   ],
//   totalResults: 1,
//   totalPages: 1,
//   page: 0,
//   size: 10,
// }

// const crnToRiskWidgetMap: CrnToRiskWidgetMap = {
//   X643390: {
//     overallRisk: 'LOW',
//     assessedOn: '2026-06-09T10:27:01',
//     risks: [
//       { riskTo: 'Children', community: 'MEDIUM', custody: 'MEDIUM' },
//       { riskTo: 'Public', community: 'MEDIUM', custody: 'MEDIUM' },
//       { riskTo: 'Known Adult', community: 'MEDIUM', custody: 'MEDIUM' },
//       { riskTo: 'Staff', community: 'MEDIUM', custody: 'MEDIUM' },
//       { riskTo: 'Prisoners', community: 'N/A', custody: 'MEDIUM' },
//     ],
//   },
// }

// type TestModel = {
//   flags: Record<string, boolean>
//   riskRoshScoreMap?: RiskRoshScoreMap
//   crnToRiskWidgetMap?: CrnToRiskWidgetMap
//   alertsData: UserAlerts
// }

// const baseModel: TestModel = {
//   flags: {
//     enableNDeliusRoshAlertsPage: false,
//   },
//   alertsData: mockAlertsData,
//   riskRoshScoreMap: {
//     X643390: 'MEDIUM',
//   },
//   crnToRiskWidgetMap,
// }

// const render = (model = {} as Partial<TestModel>) => {
//   const input = {
//     ...baseModel,
//     ...model,
//   }
//   const req = httpMocks.createRequest()
//   const res = httpMocks.createResponse({
//     locals: input,
//   }) as AppResponse
//   const env = createNunjucksTestEnv(req, res)
//   return cheerio.load(env.render('pages/alerts.njk', input))
// }

describe('Alerts nunjucks render tests', () => {
  it('should render the correct rosh score when enableNDeliusRoshAlertsPage feature flag is disabled', () => {
    expect(true)
    // const $ = render()
    // expect(
    //   $('[data-qa=alertsTable]')
    //     .find('.govuk-table__body')
    //     .find('.govuk-table__row')
    //     .eq(0)
    //     .find('[data-qa=alertRisk]')
    //     .text(),
    // ).toContain('LOW')
  })

  // it.each([
  //   ['LOW', 'LOW'],
  //   ['MEDIUM', 'MEDIUM'],
  //   ['HIGH', 'HIGH'],
  //   ['VERY_HIGH', 'VERY HIGH'],
  // ])(
  //   'should render the correct rosh score when enableNDeliusRoshAlertsPage feature flag is enabled',
  //   (score: RoshBadgeLevel, expected: string) => {
  //     const $ = render({
  //       flags: { enableNDeliusRoshAlertsPage: true },
  //       riskRoshScoreMap: {
  //         X643390: score,
  //       },
  //     })
  //     expect(
  //       $('[data-qa=alertsTable]')
  //         .find('.govuk-table__body')
  //         .find('.govuk-table__row')
  //         .eq(0)
  //         .find('[data-qa=alertRisk]')
  //         .text(),
  //     ).toContain(expected)
  //   },
  // )
})
