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
  it('renders the summary card with rosh score from ARNS source if enableNDeliusRosh feature flag is disabled', () => {
    const html = render({ risks: mockRisks, overview: mockOverview, rosh, flags: { enableNDeliusRosh: false } })
    const $ = cheerio.load(html)
    expect(
      $('.app-summary-card__body .govuk-summary-list .govuk-summary-list__row')
        .eq(0)
        .find('.govuk-summary-list__key')
        .find('span')
        .eq(1)
        .text(),
    ).toContain('Last updated 9 June 2026')
    expect(
      $('.app-summary-card__body .govuk-summary-list .govuk-summary-list__row')
        .eq(0)
        .find('.govuk-summary-list__value')
        .text(),
    ).toContain('HIGH RISK OF SERIOUS HARM')
  })
  it('renders the summary card with rosh score from NDelius source if enableNDeliusRosh feature flag is enabled', () => {
    const html = render({ risks: mockRisks, overview: mockOverview, rosh, flags: { enableNDeliusRosh: true } })
    const $ = cheerio.load(html)
    expect(
      $('.app-summary-card__body .govuk-summary-list .govuk-summary-list__row')
        .eq(0)
        .find('.govuk-summary-list__key')
        .find('span')
        .eq(1)
        .text(),
    ).toContain('Last updated 11 October 2026')
    expect(
      $('.app-summary-card__body .govuk-summary-list .govuk-summary-list__row')
        .eq(0)
        .find('.govuk-summary-list__value')
        .text(),
    ).toContain('MEDIUM RISK OF SERIOUS HARM')
  })
})
