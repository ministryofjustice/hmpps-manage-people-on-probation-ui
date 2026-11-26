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
  personPhotoSrc: '/person-photo/G9566GQ',
  arnsUnavailable: false,
  photoUnavailable: false,
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
      expect(html).not.toContain('Photo is currently unavailable.')
      expect(html).not.toContain("data-qa='riskBadges'")
      expect(html).toContain("data-qa='personPhoto'")
    })

    it('photo failure hides the photo and shows the photo message', () => {
      const html = render(
        baseContext({
          photoUnavailable: true,
          personPhotoSrc: undefined,
        }),
      )

      expect(html).toContain('data-qa="headerErrors"')
      expect(html).toContain('Photo is currently unavailable.')
      expect(html).not.toContain('Risk information from the ARNS service is currently unavailable.')
      expect(html).not.toContain("data-qa='personPhoto'")
      expect(html).toContain("data-qa='riskBadges'")
    })

    it('several failures show every message as a list, in order', () => {
      const html = render(
        baseContext({
          statusUnavailable: true,
          arnsUnavailable: true,
          photoUnavailable: true,
          throughcareUnavailable: 'some',
          riskData: null,
          risksWidget: toRoshWidget(null),
          personPhotoSrc: undefined,
        }),
      )

      expect(html).toContain('data-qa="headerErrors"')
      const messages = [
        'Risk information from the ARNS service is currently unavailable.',
        'Photo is currently unavailable.',
        'Status information is currently unavailable.',
        'Some throughcare information is currently unavailable.',
      ]
      const positions = messages.map(message => html.indexOf(message))
      expect(positions.every(position => position > -1)).toBe(true)
      expect([...positions].sort((a, b) => a - b)).toEqual(positions)
      expect(html).toContain('govuk-list--bullet')
      expect(html).not.toContain("data-qa='personPhoto'")
      expect(html).not.toContain("data-qa='riskBadges'")
    })

    it('status failure shows the status message', () => {
      const html = render(baseContext({ statusUnavailable: true }))

      expect(html).toContain('Status information is currently unavailable.')
      expect(html).not.toContain('govuk-list--bullet')
    })

    it.each([
      ['some', 'Some throughcare information is currently unavailable.'],
      ['all', 'Throughcare information is currently unavailable.'],
    ])('throughcare %s unavailable shows its message', (throughcareUnavailable, message) => {
      const html = render(baseContext({ throughcareUnavailable }))

      expect(html).toContain(message)
    })

    it('AC5: the error summary appears above the header content', () => {
      const html = render(
        baseContext({
          arnsUnavailable: true,
          riskData: null,
          risksWidget: toRoshWidget(null),
        }),
      )

      const personNameIndex = html.search(/data-qa=["']personName["']/)
      expect(personNameIndex).toBeGreaterThan(-1)
      expect(html.indexOf('data-qa="headerErrors"')).toBeLessThan(personNameIndex)
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

    it('never shows the error summary, even when arnsUnavailable/photoUnavailable are set, because this feature is gated behind enablePersonHeader', () => {
      const html = render(
        legacyContext({
          arnsUnavailable: true,
          photoUnavailable: true,
          riskData: null,
          risksWidget: toRoshWidget(null),
        }),
      )

      expect(html).not.toContain('data-qa="headerErrors"')
      expect(html).not.toContain('Risk information from the ARNS service is currently unavailable.')
      expect(html).not.toContain('Photo is currently unavailable.')
    })
  })
})
