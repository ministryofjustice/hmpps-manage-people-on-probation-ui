import httpMocks from 'node-mocks-http'
import { filterActivityLog } from './filterActivityLog'
import { ActivityLogFiltersResponse, AppResponse } from '../@types'
import { filterOptions } from '../properties'

const now = new Date()
const maxDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`
const crn = 'X000001'

interface Args {
  keywords?: string
  dateFrom?: string
  dateTo?: string
  compliance?: string | string[]
  clearFilterKey?: string
  clearFilterValue?: string
  submit?: boolean
  errors?: boolean
}

const defaultRequest: Args = {
  keywords: 'test',
  dateFrom: '21/03/2025',
  dateTo: '22/03/2025',
  compliance: ['no outcome', 'complied', 'not complied'],
  clearFilterKey: '',
  clearFilterValue: '',
  submit: false,
  errors: false,
}

const getRequest = (args?: Args) => {
  const query = {
    ...defaultRequest,
    ...(args || {}),
  }
  const sessionErrors = query.errors
    ? {
        errorList: [{ text: 'Enter or select a to date', href: '#dateTo' }],
        errorMessages: { dateTo: { text: 'Enter or select a to date' } },
      }
    : null
  const req = httpMocks.createRequest({
    query,
    params: {
      crn,
    },
    url: `/case/${crn}/activity-log?keywords=test&submit=true&page=1`,
    session: {
      errors: sessionErrors,
    },
  })
  return req
}

const getComplianceQuery = (compliance: string[]) =>
  compliance.map(item => `${item.replace(' ', '%20')}`).join('&compliance=')

describe('/middleware/filterActivityLog()', () => {
  const res = {
    locals: {
      user: {
        username: 'user-1',
      },
    },
    redirect: jest.fn().mockReturnThis(),
  } as unknown as AppResponse
  const nextSpy = jest.fn()
  const redirectSpy = jest.spyOn(res, 'redirect')

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('submit is in request query params', () => {
    const req = getRequest({ submit: true })
    beforeEach(() => {
      filterActivityLog(req, res, nextSpy)
    })
    it('should refresh the page removing the submit query param from the url', () => {
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/activity-log?keywords=test`)
    })
  })
  describe('Only one compliance filter is submitted', () => {
    const req = getRequest({ keywords: '', dateFrom: '', dateTo: '', compliance: 'complied' })
    beforeEach(() => {
      filterActivityLog(req, res, nextSpy)
    })
    it('should assign the correct values to res.locals.filters', () => {
      const query = req.query as Record<string, string | string[]>
      const url = `/case/${crn}/activity-log?compliance=complied`
      const expectedResponse: ActivityLogFiltersResponse = {
        errors: req.session.errors,
        selectedFilterItems: {
          compliance: [
            {
              text: 'Complied',
              href: `${url}&clearFilterKey=compliance&clearFilterValue=complied`,
            },
          ],
        },
        complianceOptions: filterOptions.map(({ text, value }) => ({ text, value, checked: value === 'complied' })),
        baseUrl: `/case/${crn}/activity-log`,
        queryStr: `compliance=complied`,
        queryStrPrefix: '?',
        queryStrSuffix: '&',
        keywords: req.query.keywords as string,
        compliance: [req.query.compliance] as string[],
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        maxDate,
      }
      expect(res.locals.filters).toEqual(expectedResponse)
    })
  })

  describe('All filters are completed', () => {
    const req = getRequest()
    beforeEach(() => {
      filterActivityLog(req, res, nextSpy)
    })
    it('should assign the correct values to res.locals.filters', () => {
      const query = req.query as Record<string, string | string[]>
      const url = `/case/${crn}/activity-log?keywords=${query.keywords}&dateFrom=${query.dateFrom}&dateTo=${query.dateTo}&compliance=${getComplianceQuery(query.compliance as string[])}`
      const expectedResponse: ActivityLogFiltersResponse = {
        errors: req.session.errors,
        selectedFilterItems: {
          keywords: [
            {
              text: req.query.keywords as string,
              href: `${url}&clearFilterKey=keywords&clearFilterValue=${query.keywords}`,
            },
          ],
          compliance: [
            ...(query.compliance as string[]).map((item, i) => ({
              text: filterOptions[i].text,
              href: `${url}&clearFilterKey=compliance&clearFilterValue=${item.replace(' ', '%20')}`,
            })),
          ],
          dateRange: [
            {
              text: `${req.query.dateFrom} - ${req.query.dateTo}`,
              href: `/case/X000001/activity-log?keywords=${query.keywords}&dateFrom=${query.dateFrom}&dateTo=${query.dateTo}&compliance=${getComplianceQuery(query.compliance as string[])}&clearFilterKey=dateRange&clearFilterValue=${query.dateFrom}`,
            },
          ],
        },
        complianceOptions: filterOptions.map(({ text, value }) => ({ text, value, checked: true })),
        baseUrl: `/case/${crn}/activity-log`,
        queryStr: `keywords=${query.keywords}&dateFrom=${query.dateFrom}&dateTo=${query.dateTo}&compliance=${getComplianceQuery(query.compliance as string[])}`,
        queryStrPrefix: '?',
        queryStrSuffix: '&',
        keywords: req.query.keywords as string,
        compliance: req.query.compliance as string[],
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        maxDate,
      }
      expect(res.locals.filters).toEqual(expectedResponse)
    })
  })

  describe('Selected compliance filter tag is clicked', () => {
    const req = getRequest({ clearFilterKey: 'compliance', clearFilterValue: defaultRequest.compliance[1] })
    beforeEach(() => {
      filterActivityLog(req, res, nextSpy)
    })
    it('should refresh the page', () => {
      const query = req.query as Record<string, string | string[]>
      expect(redirectSpy).toHaveBeenCalledWith(
        `/case/${crn}/activity-log?keywords=test&dateFrom=${query.dateFrom}&dateTo=${query.dateTo}&compliance=${getComplianceQuery((query.compliance as string[]).filter((_item, i) => i !== 1))}`,
      )
    })
  })

  describe('Selected keywords filter tag is clicked', () => {
    const req = getRequest({ clearFilterKey: 'keywords', clearFilterValue: defaultRequest.keywords })
    beforeEach(() => {
      filterActivityLog(req, res, nextSpy)
    })
    it('should refresh the page with the correct url and query parameters', () => {
      const query = req.query as Record<string, string | string[]>
      expect(redirectSpy).toHaveBeenCalledWith(
        `/case/${crn}/activity-log?dateFrom=${query.dateFrom}&dateTo=${query.dateTo}&compliance=${getComplianceQuery(query.compliance as string[])}`,
      )
    })
  })

  describe('Selected date range filter tag is clicked', () => {
    const req = getRequest({ clearFilterKey: 'dateRange', clearFilterValue: defaultRequest.dateFrom })
    beforeEach(() => {
      filterActivityLog(req, res, nextSpy)
    })
    it('should refresh the page with the correct url and query parameters', () => {
      const query = req.query as Record<string, string | string[]>
      expect(redirectSpy).toHaveBeenCalledWith(
        `/case/${crn}/activity-log?keywords=${query.keywords}&compliance=${getComplianceQuery(query.compliance as string[])}`,
      )
    })
  })

  describe('Only date from is completed', () => {
    const req = getRequest({ errors: true, dateTo: '' })
    beforeEach(() => {
      filterActivityLog(req, res, nextSpy)
    })
    it('set res.locals.filters with the correct values', () => {
      const query = req.query as Record<string, string | string[]>
      const url = `/case/${crn}/activity-log?keywords=${query.keywords}&dateFrom=${query.dateFrom}&compliance=${getComplianceQuery(query.compliance as string[])}`
      const expectedResponse: ActivityLogFiltersResponse = {
        errors: req.session.errors,
        selectedFilterItems: {
          keywords: [
            {
              text: req.query.keywords as string,
              href: `${url}&clearFilterKey=keywords&clearFilterValue=${query.keywords}`,
            },
          ],
          compliance: [
            ...(query.compliance as string[]).map((item, i) => ({
              text: filterOptions[i].text,
              href: `${url}&clearFilterKey=compliance&clearFilterValue=${item.replace(' ', '%20')}`,
            })),
          ],
        },
        complianceOptions: filterOptions.map(({ text, value }) => ({ text, value, checked: true })),
        baseUrl: `/case/${crn}/activity-log`,
        queryStr: `keywords=${query.keywords}&dateFrom=${query.dateFrom}&compliance=${getComplianceQuery(query.compliance as string[])}`,
        queryStrPrefix: '?',
        queryStrSuffix: '&',
        keywords: req.query.keywords as string,
        compliance: req.query.compliance as string[],
        dateFrom: '',
        dateTo: '',
        maxDate,
      }
      expect(res.locals.filters).toEqual(expectedResponse)
    })
  })
})
