import httpMocks from 'node-mocks-http'
import { filterActivityLog } from './filterActivityLog'
import { categoryFilterOptions, filterOptions, hideContactsFilterOptions } from '../properties'
import { AppResponse } from '../models/Locals'
import { ActivityLogFiltersResponse } from '../models/ActivityLog'

const now = new Date()
const maxDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`
const crn = 'X000001'

interface Args {
  page?: string
  keywords?: string
  dateFrom?: string
  dateTo?: string
  compliance?: string | string[]
  category?: string | string[]
  hideContact?: string | string[]
  clearFilterKey?: string
  clearFilterValue?: string
  submit?: boolean
  errors?: boolean
  clear?: string
}

const categeoryList = [
  'appointments',
  'Approved Premises',
  'communication with other organisations',
  'communications with person on probation',
  'communications with police',
  'unpaid work',
  'enforcement',
  'Internal communications',
  'Multi-agency working',
  'Referrals and assessments',
  'safeguarding',
]

const defaultRequest: Args = {
  page: undefined,
  keywords: 'test',
  dateFrom: '21/03/2025',
  dateTo: '22/03/2025',
  compliance: ['no outcome', 'complied', 'not complied'],
  category: categeoryList,
  hideContact: ['hide NDelius system generated contacts'],
  clearFilterKey: '',
  clearFilterValue: '',
  submit: true,
  errors: false,
}

const getRequest = (args?: Args) => {
  const query = {
    ...defaultRequest,
    ...(args || {}),
  }
  const sessionErrors = query.errors
    ? {
        dateTo: 'Enter or select a to date',
      }
    : null
  return httpMocks.createRequest({
    body: {
      ...defaultRequest,
      ...(args || {}),
    },
    query,
    params: {
      crn,
    },
    url: `/case/${crn}/activity-log?keywords=test&submit=true&page=1`,
    session: {
      errors: sessionErrors,
    },
  })
}

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

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('clear is in request query params', () => {
    const req = getRequest({ submit: false, clear: 'clear' })
    it('should load the page setting the session activityLogFilters to undefined', () => {
      filterActivityLog(req, res, nextSpy)
      expect(req.session.activityLogFilters).toEqual(undefined)
    })
  })
  describe('session is cleared due to no query params at all', () => {
    const req = httpMocks.createRequest({ session: {} })
    it('should load the page setting the session activityLogFilters to undefined', () => {
      filterActivityLog(req, res, nextSpy)
      expect(req.session.activityLogFilters).toEqual(undefined)
    })
  })
  describe('submit is in request query params', () => {
    const req = getRequest({ submit: true })
    beforeEach(() => {
      filterActivityLog(req, res, nextSpy)
    })
    it('should load the page setting the session activityLogFilters to undefined', () => {
      expect(req.session.activityLogFilters).toEqual({
        clearFilterKey: '',
        clearFilterValue: '',
        compliance: ['no outcome', 'complied', 'not complied'],
        category: categeoryList,
        hideContact: ['hide NDelius system generated contacts'],
        dateFrom: '21/03/2025',
        dateTo: '22/03/2025',
        errors: false,
        keywords: 'test',
        submit: true,
      })
    })
  })
  describe('Only one compliance filter is submitted', () => {
    const req = getRequest({
      submit: true,
      keywords: '',
      dateFrom: '',
      dateTo: '',
      compliance: 'complied',
      category: 'appointments',
      hideContact: 'hide NDelius system generated contacts',
    })
    beforeEach(() => {
      filterActivityLog(req, res, nextSpy)
    })
    it('should assign the correct values to res.locals.filters', () => {
      const url = `/case/${crn}/activity-log`
      const expectedResponse: ActivityLogFiltersResponse = {
        selectedFilterItems: {
          compliance: [
            {
              text: 'Complied',
              href: `${url}?clearFilterKey=compliance&clearFilterValue=complied`,
            },
          ],
          category: [
            {
              text: 'Appointments',
              href: `${url}?clearFilterKey=category&clearFilterValue=appointments`,
            },
          ],
          hideContact: [
            {
              text: 'Hide NDelius system generated contacts',
              href: `${url}?clearFilterKey=hideContact&clearFilterValue=hide%20NDelius%20system%20generated%20contacts`,
            },
          ],
        },
        complianceOptions: filterOptions.map(({ text, value }) => ({ text, value, checked: value === 'complied' })),
        categoryOptions: categoryFilterOptions.map(({ text, value }) => ({
          text,
          value,
          checked: value === 'appointments',
        })),
        hideContactOptions: hideContactsFilterOptions.map(({ text, value }) => ({
          text,
          value,
          checked: value === 'hide NDelius system generated contacts',
        })),
        baseUrl: `/case/${crn}/activity-log`,
        keywords: req.query.keywords as string,
        compliance: [req.query.compliance] as string[],
        category: [req.query.category] as string[],
        hideContact: [req.query.hideContact] as string[],
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        maxDate,
      }
      expect(res.locals.filters).toEqual(expectedResponse)
    })
  })

  describe('All filters are completed', () => {
    const req = getRequest()
    req.session.activityLogFilters = {
      compliance: ['not complied'],
      category: ['appointments'],
      hideContact: ['hide NDelius system generated contacts'],
      dateFrom: '20/03/2025',
      dateTo: '23/03/2025',
      keywords: 'testing',
    }
    beforeEach(() => {
      filterActivityLog(req, res, nextSpy)
    })
    it('should clear session and assign the correct values to res.locals.filters', () => {
      const query = req.query as Record<string, string | string[]>
      const url = `/case/${crn}/activity-log`
      const expectedResponse: ActivityLogFiltersResponse = {
        selectedFilterItems: {
          keywords: [
            {
              text: req.query.keywords as string,
              href: `${url}?clearFilterKey=keywords`,
            },
          ],
          compliance: [
            ...(query.compliance as string[]).map((item, i) => ({
              text: filterOptions[i].text,
              href: `${url}?clearFilterKey=compliance&clearFilterValue=${item.replaceAll(' ', '%20')}`,
            })),
          ],
          category: [
            ...(query.category as string[]).map((item, i) => ({
              text: categoryFilterOptions[i].text,
              href: `${url}?clearFilterKey=category&clearFilterValue=${item.replaceAll(' ', '%20')}`,
            })),
          ],
          hideContact: [
            ...(query.hideContact as string[]).map((item, i) => ({
              text: hideContactsFilterOptions[i].text,
              href: `${url}?clearFilterKey=hideContact&clearFilterValue=${item.replaceAll(' ', '%20')}`,
            })),
          ],
          dateRange: [
            {
              text: `${req.query.dateFrom} - ${req.query.dateTo}`,
              href: `/case/X000001/activity-log?clearFilterKey=dateRange`,
            },
          ],
        },
        complianceOptions: filterOptions.map(({ text, value }) => ({ text, value, checked: true })),
        categoryOptions: categoryFilterOptions.map(({ text, value }) => ({ text, value, checked: true })),
        hideContactOptions: hideContactsFilterOptions.map(({ text, value }) => ({ text, value, checked: true })),
        baseUrl: `/case/${crn}/activity-log`,
        keywords: req.query.keywords as string,
        compliance: req.query.compliance as string[],
        category: req.query.category as string[],
        hideContact: req.query.hideContact as string[],
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
      expect(req.session.activityLogFilters.compliance).toEqual(['no outcome', 'not complied'])
    })
  })

  describe('Selected keywords filter tag is clicked', () => {
    const req = getRequest({ clearFilterKey: 'keywords', clearFilterValue: defaultRequest.keywords })
    beforeEach(() => {
      filterActivityLog(req, res, nextSpy)
    })
    it('should refresh the page with the correct url and query parameters', () => {
      expect(req.session.activityLogFilters.keywords).toEqual('')
    })
  })

  describe('Selected date range filter tag is clicked', () => {
    const req = getRequest({ clearFilterKey: 'dateRange', clearFilterValue: defaultRequest.dateFrom })
    beforeEach(() => {
      filterActivityLog(req, res, nextSpy)
    })
    it('should refresh the page with the correct url and query parameters', () => {
      expect(req.session.activityLogFilters.dateTo).toEqual('')
      expect(req.session.activityLogFilters.dateFrom).toEqual('')
    })
  })

  describe('Only date from is completed', () => {
    const req = getRequest({ errors: true, dateTo: '' })
    beforeEach(() => {
      filterActivityLog(req, res, nextSpy)
    })
    it('set res.locals.filters with the correct values', () => {
      const query = req.query as Record<string, string | string[]>
      const url = `/case/${crn}/activity-log`
      const expectedResponse: ActivityLogFiltersResponse = {
        selectedFilterItems: {
          keywords: [
            {
              text: req.query.keywords as string,
              href: `${url}?clearFilterKey=keywords`,
            },
          ],
          compliance: [
            ...(query.compliance as string[]).map((item, i) => ({
              text: filterOptions[i].text,
              href: `${url}?clearFilterKey=compliance&clearFilterValue=${item.replaceAll(' ', '%20')}`,
            })),
          ],
          category: [
            ...(query.category as string[]).map((item, i) => ({
              text: categoryFilterOptions[i].text,
              href: `${url}?clearFilterKey=category&clearFilterValue=${item.replaceAll(' ', '%20')}`,
            })),
          ],
          hideContact: [
            ...(query.hideContact as string[]).map((item, i) => ({
              text: hideContactsFilterOptions[i].text,
              href: `${url}?clearFilterKey=hideContact&clearFilterValue=${item.replaceAll(' ', '%20')}`,
            })),
          ],
        },
        complianceOptions: filterOptions.map(({ text, value }) => ({ text, value, checked: true })),
        categoryOptions: categoryFilterOptions.map(({ text, value }) => ({ text, value, checked: true })),
        hideContactOptions: hideContactsFilterOptions.map(({ text, value }) => ({ text, value, checked: true })),
        baseUrl: `/case/${crn}/activity-log`,
        keywords: req.query.keywords as string,
        compliance: req.query.compliance as string[],
        category: req.query.category as string[],
        hideContact: req.query.hideContact as string[],
        dateFrom: '',
        dateTo: '',
        maxDate,
      }
      expect(res.locals.filters).toEqual(expectedResponse)
    })
  })

  describe('Should not clear session when page already selected in query string', () => {
    const req = getRequest({ page: '0', submit: false })
    req.url = `/case/${crn}/activity-log?page=0`
    req.session.activityLogFilters = {
      compliance: ['not complied'],
      category: ['appointments'],
      hideContact: ['hide NDelius system generated contacts'],
      dateFrom: '20/03/2025',
      dateTo: '23/03/2025',
      keywords: 'testing',
    }
    beforeEach(() => {
      filterActivityLog(req, res, nextSpy)
    })
    it('should assign the correct values to res.locals.filters', () => {
      const url = `/case/${crn}/activity-log`
      const expectedResponse: ActivityLogFiltersResponse = {
        selectedFilterItems: {
          compliance: [
            {
              text: 'Not complied',
              href: `${url}?clearFilterKey=compliance&clearFilterValue=not%20complied`,
            },
          ],
          category: [
            {
              text: 'Appointments',
              href: `${url}?clearFilterKey=category&clearFilterValue=appointments`,
            },
          ],
          hideContact: [
            {
              text: 'Hide NDelius system generated contacts',
              href: `${url}?clearFilterKey=hideContact&clearFilterValue=hide%20NDelius%20system%20generated%20contacts`,
            },
          ],
          dateRange: [
            {
              text: '20/03/2025 - 23/03/2025',
              href: `${url}?clearFilterKey=dateRange`,
            },
          ],
          keywords: [
            {
              text: 'testing',
              href: `${url}?clearFilterKey=keywords`,
            },
          ],
        },
        complianceOptions: filterOptions.map(({ text, value }) => ({ text, value, checked: value === 'not complied' })),
        categoryOptions: categoryFilterOptions.map(({ text, value }) => ({
          text,
          value,
          checked: value === 'appointments',
        })),
        hideContactOptions: hideContactsFilterOptions.map(({ text, value }) => ({
          text,
          value,
          checked: value === 'hide NDelius system generated contacts',
        })),
        baseUrl: `/case/${crn}/activity-log`,
        keywords: 'testing',
        compliance: ['not complied'],
        category: ['appointments'],
        hideContact: ['hide NDelius system generated contacts'],
        dateFrom: '20/03/2025',
        dateTo: '23/03/2025',
        maxDate,
      }
      expect(res.locals.filters).toEqual(expectedResponse)
    })
  })
})
