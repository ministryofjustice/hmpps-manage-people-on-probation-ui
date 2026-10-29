import * as cheerio from 'cheerio'
import { createNunjucksTestEnv } from '../../testutils/nunjucksTestEnv'
import { RiskScore } from '../../data/model/risk'
import { Overview, PersonalDetails } from '../../data/model/overview'
import { normaliseText } from '../../testutils/normaliseText'

const crn = 'X000001'

const overview: Partial<Overview> = {
  personalDetails: {
    name: {
      forename: 'Lucian',
      surname: 'Smith',
    },
  } as PersonalDetails,
}

const render = (input: Record<string, unknown>) => {
  const env = createNunjucksTestEnv()
  return env.render('partials/_risk-alert.njk', input)
}

describe('Risk inset', () => {
  it(`renders nothing when there are no risks`, () => {
    const html = render({ crn, overview })

    expect(html).toEqual('')
  })

  it('renders a risk to probation staff alert for a risk to probation staff flag', () => {
    const html = render({ crn, overview, riskToProbationStaff: { id: 'probation-staff-risk-id' } })
    const $ = cheerio.load(html)
    const $alert = $('.govuk-inset-text')

    expect($alert).toHaveLength(1)
    expect($alert.attr('class')).toContain(`risk-alert--high`)
    expect(normaliseText($alert.text())).toBe(`Lucian is a risk to probation staff`)
    expect($alert.find('a').attr('href')).toContain(`/case/X000001/risk/flag/probation-staff-risk-id`)
  })

  it('renders nothing for a low risk to staff', () => {
    const html = render({ crn, overview, riskToStaff: { id: 'low-id', level: null } })

    expect(html).toEqual('')
  })

  it.each(['VERY_HIGH', 'HIGH', 'MEDIUM'])(
    'renders maybe risk to probation staff and risk to staff alerts for a %s risk to staff flag',
    (level: RiskScore) => {
      const expectedClass = level.replace('_', '-').toLowerCase()
      const expectedText = level.replace('_', ' ').toLowerCase()
      const html = render({
        crn,
        overview,
        riskToStaff: { id: `id-${expectedClass}`, level },
      })
      const $ = cheerio.load(html)
      const $alerts = $('.govuk-inset-text')

      expect($alerts).toHaveLength(2)

      expect($alerts.eq(0).attr('class')).toContain(`risk-alert--medium`)
      expect(normaliseText($alerts.eq(0).text())).toBe(`Lucian may be a risk to probation staff`)
      expect($alerts.eq(0).find('a')).toHaveLength(0)

      expect($alerts.eq(1).attr('class')).toContain(`risk-alert--${expectedClass}`)
      expect(normaliseText($alerts.eq(1).text())).toBe(`Lucian is a ${expectedText} risk to staff`)
      expect($alerts.eq(1).find('a').attr('href')).toContain(`/case/X000001/risk/flag/id-${expectedClass}`)
    },
  )

  it.each(['VERY_HIGH', 'HIGH', 'MEDIUM'])(
    'renders a risk to probation staff and risk to staff alerts for a %s risk to staff flag',
    (level: RiskScore) => {
      const expectedClass = level.replace('_', '-').toLowerCase()
      const expectedText = level.replace('_', ' ').toLowerCase()
      const html = render({
        crn,
        overview,
        riskToProbationStaff: { id: 'probation-staff-risk-id' },
        riskToStaff: { id: `id-${expectedClass}`, level },
      })
      const $ = cheerio.load(html)
      const $alerts = $('.govuk-inset-text')

      expect($alerts).toHaveLength(2)

      expect($alerts.eq(0).attr('class')).toContain(`risk-alert--high`)
      expect(normaliseText($alerts.eq(0).text())).toBe(`Lucian is a risk to probation staff`)
      expect($alerts.eq(0).find('a').attr('href')).toContain(`/case/X000001/risk/flag/probation-staff-risk-id`)

      expect($alerts.eq(1).attr('class')).toContain(`risk-alert--${expectedClass}`)
      expect(normaliseText($alerts.eq(1).text())).toBe(`Lucian is a ${expectedText} risk to staff`)
      expect($alerts.eq(1).find('a').attr('href')).toContain(`/case/X000001/risk/flag/id-${expectedClass}`)
    },
  )

  it('renders the alerts with the personForename if name is not available from overview details', () => {
    const html = render({
      crn,
      personForename: 'Jack',
      riskToStaff: { id: `id-foo`, level: 'MEDIUM' },
    })
    const $ = cheerio.load(html)
    const $alerts = $('.govuk-inset-text')

    expect(normaliseText($alerts.eq(0).text())).toBe(`Jack may be a risk to probation staff`)
    expect(normaliseText($alerts.eq(1).text())).toBe(`Jack is a medium risk to staff`)
  })
})
