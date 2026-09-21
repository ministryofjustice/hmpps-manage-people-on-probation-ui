import nunjucks from 'nunjucks'
import { appWithAllRoutes } from '../../routes/testutils/appSetup'
import { toRoshWidget } from '../../utils'
import { RiskSummary } from '../../data/model/risk'
import type { Services } from '../../services'

const mockServices = {
  technicalUpdatesService: {
    getLatestTechnicalUpdateHeading: jest.fn(() => ''),
    getTechnicalUpdates: jest.fn(),
  },
  searchService: {
    post: jest.fn((_req, _res, next) => next()),
    get: jest.fn((_req, _res, next) => next()),
  },
} as unknown as Services

const app = appWithAllRoutes({ services: mockServices })
const njkEnv = app.get('nunjucksEnv') as nunjucks.Environment

const workingRisks = {
  summary: {
    overallRiskLevel: 'HIGH',
    riskInCommunity: { HIGH: ['Public'] },
    riskInCustody: { HIGH: ['Public'] },
  },
  assessedOn: '2024-11-29T13:01:15',
} as unknown as RiskSummary

const workingRiskData = {
  assessments: [
    {
      combinedSeriousReoffendingPredictor: { name: 'OGRS4', band: 'HIGH', score: 62, staticOrDynamic: 'Static' },
    },
  ],
  httpStatus: 200,
}

const baseContext = (overrides: Record<string, unknown> = {}) => ({
  headerPersonName: { forename: 'Caroline', surname: 'Wolff' },
  headerCRN: 'X000001',
  headerDob: '1979-08-18',
  headerTierLink: '/case/X000001/tier-history',
  tierUrlV3: '/case/X000001/tier-details',
  tierCalculation: { tierScore: 'B2' },
  managedBy: { text: 'Jane Smith', href: '/case/X000001/personal-details/staff-contacts' },
  personPhotoSrc: '/search/prisoner-image/G9566GQ',
  arnsUnavailable: false,
  prisonsUnavailable: false,
  risksWidget: toRoshWidget(workingRisks),
  riskData: workingRiskData,
  headerActions: '',
  flags: { enablePersonHeader: true },
  ...overrides,
})

const render = (context: Record<string, unknown>): string =>
  njkEnv.renderString(
    `{% from "moj/components/alert/macro.njk" import mojAlert %}
     {% from "arns/components/predictor-badge/macro.njk" import predictorBadge %}
     {% include "partials/pop-header.njk" %}`,
    context,
  )

describe('pop-header.njk API failure handling', () => {
  describe('person-header (enablePersonHeader: true)', () => {
    it('AC baseline: shows the photo and risk badges, no error summary, when everything succeeds', () => {
      const html = render(baseContext())

      expect(html).not.toContain('data-qa="headerErrors"')
      expect(html).toContain("data-qa='personPhoto'")
      expect(html).toContain("data-qa='riskBadges'")
    })

    it('AC2: ARNS failure hides the risk badges and shows the ARNS message', () => {
      const html = render(
        baseContext({
          arnsUnavailable: true,
          riskData: null,
          risksWidget: toRoshWidget(null),
        }),
      )

      expect(html).toContain('data-qa="headerErrors"')
      expect(html).toContain('Risk information from the ARNS service is currently unavailable.')
      expect(html).not.toContain('Photos and throughcare information are currently unavailable.')
      expect(html).not.toContain("data-qa='riskBadges'")
      expect(html).toContain("data-qa='personPhoto'")
    })

    it('AC3: Prisons failure hides the photo and shows the Prisons message', () => {
      const html = render(
        baseContext({
          prisonsUnavailable: true,
          personPhotoSrc: undefined,
        }),
      )

      expect(html).toContain('data-qa="headerErrors"')
      expect(html).toContain('Photos and throughcare information are currently unavailable.')
      expect(html).not.toContain('Risk information from the ARNS service is currently unavailable.')
      expect(html).not.toContain("data-qa='personPhoto'")
      expect(html).toContain("data-qa='riskBadges'")
    })

    it('AC4: both ARNS and Prisons failing shows both messages, Photos first then ARNS', () => {
      const html = render(
        baseContext({
          arnsUnavailable: true,
          prisonsUnavailable: true,
          riskData: null,
          risksWidget: toRoshWidget(null),
          personPhotoSrc: undefined,
        }),
      )

      expect(html).toContain('data-qa="headerErrors"')
      expect(html).toContain('Photos and throughcare information are currently unavailable.')
      expect(html).toContain('Risk information from the ARNS service is currently unavailable.')
      expect(html.indexOf('Photos and throughcare')).toBeLessThan(html.indexOf('Risk information from the ARNS'))
      expect(html).not.toContain("data-qa='personPhoto'")
      expect(html).not.toContain("data-qa='riskBadges'")
    })

    it('AC5: the error summary appears above the header content', () => {
      const html = render(
        baseContext({
          arnsUnavailable: true,
          riskData: null,
          risksWidget: toRoshWidget(null),
        }),
      )

      expect(html.indexOf('data-qa="headerErrors"')).toBeLessThan(html.indexOf("data-qa='personName'"))
    })
  })

  describe('legacy header (enablePersonHeader: false)', () => {
    const legacyContext = (overrides: Record<string, unknown> = {}) =>
      baseContext({ flags: { enablePersonHeader: false, enableSupervisionPackagePoPHeader: false }, ...overrides })

    it('AC baseline: shows the risk badges, no error summary, when everything succeeds', () => {
      const html = render(legacyContext())

      expect(html).not.toContain('data-qa="headerErrors"')
      expect(html).toContain('govuk-tag')
    })

    it('never shows the error summary, even when arnsUnavailable/prisonsUnavailable are set, because this feature is gated behind enablePersonHeader', () => {
      const html = render(
        legacyContext({
          arnsUnavailable: true,
          prisonsUnavailable: true,
          riskData: null,
          risksWidget: toRoshWidget(null),
        }),
      )

      expect(html).not.toContain('data-qa="headerErrors"')
      expect(html).not.toContain('Risk information from the ARNS service is currently unavailable.')
      expect(html).not.toContain('Photos and throughcare information are currently unavailable.')
    })
  })
})
