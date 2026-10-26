import * as cheerio from 'cheerio'
import { createNunjucksTestEnv } from '../../testutils/nunjucksTestEnv'
import { Overview } from '../../data/model/overview'
import { RiskSummary, RoshBadgeLevel } from '../../data/model/risk'

const rosh: { level?: RoshBadgeLevel; assessedOn?: string } = {
  level: 'MEDIUM',
  assessedOn: '2026-10-11',
}

const mockOverview: Partial<Overview> = {
  registrations: [
    'Risk to Children',
    'Risk to Known Adult',
    'Risk to Prisoner',
    'Risk to Public',
    'Risk to Staff',
    'Medium RoSH',
  ],
  mappa: {
    level: 3,
    category: 2,
    categoryDescription: 'X2 Desc',
    startDate: '2024-12-12',
    reviewDate: '2024-12-13',
  },
}

const mockRisks: Partial<RiskSummary> = {
  riskToSelf: {
    suicide: { risk: 'DK' },
    selfHarm: { risk: 'DK' },
    custody: { risk: 'DK' },
    hostelSetting: { risk: 'DK' },
    vulnerability: { risk: 'DK' },
  },
  summary: {
    overallRiskLevel: 'HIGH',
  },
  assessedOn: '2026-06-09',
}

const render = (input: Record<string, unknown>) => {
  const env = createNunjucksTestEnv()
  return env.render('partials/_overview-risk-summary-card.njk', input)
}

describe('partials/_overview-risk-summary-card.njk', () => {
  it('renders the summary card with rosh score from ARNS source if enableNDeliusRoshOverviewPage feature flag is disabled', () => {
    const html = render({
      risks: mockRisks,
      overview: mockOverview,
      rosh,
      flags: { enableNewOverview: true, enableNDeliusRoshOverviewPage: false },
    })
    const $ = cheerio.load(html)
    expect(
      $('.govuk-summary-list .govuk-summary-list__row')
        .eq(0)
        .find('.govuk-summary-list__key')
        .find('span')
        .eq(1)
        .text(),
    ).toContain('Last updated 9 June 2026')
    expect($('.govuk-summary-list .govuk-summary-list__row').eq(0).find('[data-qa="roshValue"]').text()).toContain(
      'Risk of serious harm HIGH',
    )
  })

  it('renders the summary card when no rosh score exists', () => {
    const html = render({
      risks: mockRisks,
      overview: mockOverview,
      rosh: { ...rosh, level: null },
      flags: { enableNewOverview: true, enableNDeliusRoshOverviewPage: true },
    })
    const $ = cheerio.load(html)
    expect(
      $('.govuk-summary-list .govuk-summary-list__row').eq(0).find('.govuk-summary-list__key').text(),
    ).not.toContain('Last updated')
    expect(
      $('.govuk-summary-list .govuk-summary-list__row')
        .eq(0)
        .find('.govuk-summary-list__value')
        .find('[data-qa=overallRiskValue]'),
    ).toHaveLength(0)
    expect($('.govuk-summary-list .govuk-summary-list__row').eq(0).find('.govuk-summary-list__value').text()).toContain(
      'There is no ROSH summary.',
    )
  })

  it.each([
    ['LOW', 'LOW', 'arns-badge-base--low'],
    ['MEDIUM', 'MEDIUM', 'arns-badge-base--medium'],
    ['HIGH', 'HIGH', 'arns-badge-base--high'],
    ['VERY HIGH', 'VERY HIGH', 'arns-badge-base--very-high'],
  ])(
    'renders the summary card with %s rosh score from NDelius source if enableNDeliusRoshOverviewPage feature flag is enabled',
    (level: RoshBadgeLevel, expectedLevel: RoshBadgeLevel, expectedClass: string) => {
      const html = render({
        risks: mockRisks,
        overview: mockOverview,
        rosh: { ...rosh, level },
        flags: { enableNewOverview: true, enableNDeliusRoshOverviewPage: true },
      })
      const $ = cheerio.load(html)
      expect(
        $('.govuk-summary-list .govuk-summary-list__row')
          .eq(0)
          .find('.govuk-summary-list__key')
          .find('span')
          .eq(1)
          .text(),
      ).toContain('Last updated 11 October 2026')
      expect(
        $('.govuk-summary-list .govuk-summary-list__row')
          .eq(0)
          .find('.govuk-summary-list__value')
          .find('[data-badge-base]')
          .hasClass(expectedClass),
      ).toBe(true)
      expect(
        $('.govuk-summary-list .govuk-summary-list__row')
          .eq(0)
          .find('.govuk-summary-list__value')
          .find('[data-qa=roshValue]')
          .text(),
      ).toContain(`Risk of serious harm ${expectedLevel}`)
    },
  )

  describe('when enableNewOverview is disabled', () => {
    it.each([
      ['LOW', 'LOW', 'govuk-tag--green'],
      ['MEDIUM', 'MEDIUM', 'govuk-tag--yellow'],
      ['HIGH', 'HIGH', 'govuk-tag--red'],
      ['VERY HIGH', 'VERY HIGH', 'govuk-tag--red'],
    ])(
      'renders the %s rosh score in the old style in a table',
      (level: RoshBadgeLevel, expectedLevel: RoshBadgeLevel, expectedClass: string) => {
        const html = render({
          risks: mockRisks,
          overview: mockOverview,
          rosh: { ...rosh, level },
          flags: { enableNewOverview: false, enableNDeliusRoshOverviewPage: true },
        })
        const $ = cheerio.load(html)

        expect(
          $('.govuk-summary-list .govuk-summary-list__row')
            .eq(0)
            .find('.govuk-summary-list__value')
            .find('table')
            .find('[data-qa=overallRiskValue]')
            .hasClass(expectedClass),
        ).toBe(true)
        expect(
          $('.govuk-summary-list .govuk-summary-list__row')
            .eq(0)
            .find('.govuk-summary-list__value')
            .find('table')
            .find('[data-qa=overallRiskValue]')
            .text(),
        ).toContain(`${expectedLevel} RISK OF SERIOUS HARM`)
      },
    )
  })
})
