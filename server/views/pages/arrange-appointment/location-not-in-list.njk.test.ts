import * as cheerio from 'cheerio'
import httpMocks from 'node-mocks-http'
import { AppResponse } from '../../../models/Locals'
import { createNunjucksTestEnv } from '../../../testutils/nunjucksTestEnv'

const crn = 'X000001'
const id = '31f2fd70-765d-44e8-bfcd-994fb8c43701'

type TestModel = {
  noLocations: boolean
  headerPersonName: { forename: string; surname: string }
  headerCRN: string
  crn: string
  id: string
}

const baseModel: TestModel = {
  noLocations: false,
  headerPersonName: { forename: 'Alton', surname: 'Berge' },
  headerCRN: crn,
  crn,
  id,
}

const paragraph = ($: cheerio.CheerioAPI, index: number) => $('.govuk-grid-column-two-thirds .govuk-body').eq(index)

const render = (model = {} as Partial<TestModel>) => {
  const input = {
    ...baseModel,
    ...model,
  }
  const req = httpMocks.createRequest({
    params: { crn, id },
  })
  const res = httpMocks.createResponse({
    locals: input,
  }) as AppResponse
  const env = createNunjucksTestEnv(req, res)
  return cheerio.load(env.render('pages/arrange-appointment/location-not-in-list.njk', input))
}

describe('Location not in list nunjucks render tests', () => {
  describe('when locations were found', () => {
    const $ = render()
    const backLink = `/case/${crn}/arrange-appointment/${id}/location-date-time`

    it('should display the page heading', () => {
      expect($('[data-qa=pageHeading]').text()).toEqual('Arrange an appointment in another location')
    })
    it('should display the explanatory text', () => {
      expect(paragraph($, 0).text()).toContain(
        'You can only arrange appointments from a list of locations associated with the probation practitioner’s team.',
      )
    })
    it('should display the link to the NDelius reference data form', () => {
      const $p = paragraph($, 1)
      expect($p.text()).toContain('If you think you’re missing a location, complete the')
      const $a = $p.find('a')
      expect($a.text()).toEqual('NDelius reference data - team/location form on the MoJ Technology Portal')
      expect($a.attr('href')).toContain('https://mojprod.service-now.com/moj_sp')
      expect($a.attr('target')).toEqual('_blank')
      expect($a.attr('rel')).toEqual('noopener noreferrer')
    })
    it('should display the continue on NDelius link', () => {
      const $p = paragraph($, 2)
      expect($p.text()).toContain('(opens in new tab)')
      const $a = $p.find('a')
      expect($a.text()).toEqual('Continue on NDelius')
      expect($a.attr('href')).toContain(`component=ContactList&CRN=${crn}`)
      expect($a.attr('target')).toEqual('_blank')
    })
    it('should display the cancel link back to the location page', () => {
      const $a = paragraph($, 3).find('a')
      expect($a.text()).toEqual('Cancel and return to previous screen')
      expect($a.attr('href')).toEqual(backLink)
    })
    it('should set the back link to the location page', () => {
      expect($('.govuk-back-link').attr('href')).toEqual(backLink)
    })
  })

  describe('when no locations were found', () => {
    const $ = render({ noLocations: true })
    const backLink = `/case/${crn}/arrange-appointment/${id}/type-attendance`

    it('should set the back link to the type attendance page', () => {
      expect($('.govuk-back-link').attr('href')).toEqual(backLink)
    })
    it('should set the cancel link to the type attendance page', () => {
      expect(paragraph($, 3).find('a').attr('href')).toEqual(backLink)
    })
  })
})
