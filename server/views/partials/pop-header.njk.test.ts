import * as cheerio from 'cheerio'
import httpMocks from 'node-mocks-http'
import { RiskData } from '@ministryofjustice/hmpps-arns-frontend-components-lib'
import { RoshRiskWidgetDto } from '../../data/model/risk'
import { AppResponse } from '../../models/Locals'
import { createNunjucksTestEnv } from '../../testutils/nunjucksTestEnv'
import { RiskBadgeData } from '../../utils/personRiskFlagSorter'

type TestModel = {
  flags: Record<string, boolean>
  rosh: { level: string }
  risksWidget: RoshRiskWidgetDto
  riskBadgeData: RiskBadgeData
  riskData: RiskData
}

const riskBadgeData: RiskBadgeData = {
  groups: [
    {
      severity: 'MEDIUM',
      badges: [
        {
          id: 1,
          text: 'Risk to children - Medium',
          level: 'MEDIUM',
          badgeClass: 'risk-badge--medium',
        },
        {
          id: 2,
          text: 'Risk to staff - Medium',
          level: 'MEDIUM',
          badgeClass: 'risk-badge--medium',
        },
        {
          id: 3,
          text: 'Risk to known adult - Medium',
          level: 'MEDIUM',
          badgeClass: 'risk-badge--medium',
        },
        {
          id: 4,
          text: 'Risk to prisoner - Medium',
          level: 'MEDIUM',
          badgeClass: 'risk-badge--medium',
        },
        {
          id: 5,
          text: 'Risk to public - Medium',
          level: 'MEDIUM',
          badgeClass: 'risk-badge--medium',
        },
        {
          id: 6,
          text: 'Medium rosh',
          level: 'MEDIUM',
          badgeClass: 'risk-badge--medium',
        },
      ],
    },
  ],
  remainingCount: 0,
}

const riskData = (assessments = {} as any): RiskData => ({
  assessments: [
    {
      outputVersion: '2',
      completedDate: '09 June 2026',
      completedDateTime: '09 June 2026 at 10:27',
      assessmentType: 'layer 1',
      allReoffendingPredictor: {
        name: 'All reoffending predictor',
        band: 'LOW',
        staticOrDynamic: 'Dynamic',
        score: 11.94,
        completedDate: '09 June 2026',
      },
      violentReoffendingPredictor: {
        name: 'Violent reoffending predictor',
        band: 'LOW',
        staticOrDynamic: 'Dynamic',
        score: 10.58,
        completedDate: '09 June 2026',
      },
      seriousViolentReoffendingPredictor: {
        name: 'Serious violent reoffending predictor',
        band: 'LOW',
        staticOrDynamic: 'Dynamic',
        score: 0.18,
        completedDate: '09 June 2026',
      },
      directContactSexualReoffendingPredictor: {
        name: 'Direct contact – sexual reoffending predictor',
        band: 'NOT APPLICABLE',
        staticOrDynamic: null,
        score: 0,
        completedDate: '09 June 2026',
      },
      indirectImageContactSexualReoffendingPredictor: {
        name: 'Images and indirect contact – sexual reoffending predictor',
        band: 'NOT APPLICABLE',
        staticOrDynamic: null,
        score: 0,
        completedDate: '09 June 2026',
      },
      combinedSeriousReoffendingPredictor: {
        name: 'Combined serious reoffending predictor',
        band: 'LOW',
        staticOrDynamic: 'Dynamic',
        score: 0.18,
        completedDate: '09 June 2026',
      },
      ...assessments,
    },
  ],
  httpStatus: 200,
})

const baseModel: TestModel = {
  flags: {
    enableNDeliusRosh: true,
    enablePersonHeader: true,
    enableSupervisionPackagePoPHeader: false,
  },
  rosh: {
    level: 'HIGH',
  },
  riskBadgeData,
  riskData: riskData(),
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
  return cheerio.load(env.render('partials/pop-header.njk', input))
}
describe('POP header', () => {
  describe('enableNDeliusRosh feature flag enabled', () => {
    it('should render the ROSH badge with NDelius data', () => {
      const $ = render()
      expect(
        $('.pop-header-risk-badges').find('[data-badge-base="Risk of serious harm HIGH"]').find('span').text(),
      ).toContain('Risk of serious harm')
      expect(
        $('.pop-header-risk-badges')
          .find('[data-badge-base="Risk of serious harm HIGH"]')
          .hasClass('arns-badge-base--high'),
      ).toBe(true)
      expect(
        $('.pop-header-risk-badges')
          .find('[data-badge-base="Risk of serious harm HIGH"]')
          .find('span')
          .find('strong')
          .text(),
      ).toContain('HIGH')
    })
  })
  describe('enableNDeliusRosh featur flag is disabled', () => {
    it(`should render the ROSH badge with 'Risk of serious harm' label and ARNS data`, () => {
      const $ = render({ flags: { ...baseModel.flags, enableNDeliusRosh: false } })
      expect(
        $('.pop-header-risk-badges').find('[data-badge-base="Risk of serious harm MEDIUM"]').find('span').text(),
      ).toContain('Risk of serious harm')
      expect(
        $('.pop-header-risk-badges')
          .find('[data-badge-base="Risk of serious harm MEDIUM"]')
          .hasClass('arns-badge-base--medium'),
      ).toBe(true)
      expect(
        $('.pop-header-risk-badges')
          .find('[data-badge-base="Risk of serious harm MEDIUM"]')
          .find('span')
          .find('strong')
          .text(),
      ).toContain('MEDIUM')
    })
    it(`should render the ROSH badge with 'ROSH' label and ARNS data`, () => {
      const $ = render({
        flags: { ...baseModel.flags, enableNDeliusRosh: false },
        riskData: riskData({ rsr: { band: 'LOW' } }),
      })
      expect($('.pop-header-risk-badges').find('[data-badge-base="ROSH MEDIUM"]').find('span').text()).toContain('ROSH')
      expect(
        $('.pop-header-risk-badges').find('[data-badge-base="ROSH MEDIUM"]').hasClass('arns-badge-base--medium'),
      ).toBe(true)
      expect(
        $('.pop-header-risk-badges').find('[data-badge-base="ROSH MEDIUM"]').find('span').find('strong').text(),
      ).toContain('MEDIUM')
    })
  })
})
