import httpMocks from 'node-mocks-http'
import validation from '.'
import { mockAppResponse } from '../../controllers/mocks'

const crn = 'X000001'
const req = httpMocks.createRequest({
  method: 'POST',
  body: { dateTo: '01/12/2024' },
  params: {
    crn,
  },
  query: { page: '', view: 'other' },
  session: {
    activityLogFilters: { page: '' },
    errorMessages: [{ dateTo: 'error' }],
  },
})

const reqCompact = httpMocks.createRequest({
  method: 'POST',
  body: { dateTo: '01/12/2024', dateFrom: '' },
  params: {
    crn,
  },
  query: { page: '', view: 'compact' },
  session: {
    activityLogFilters: { page: '' },
    errorMessages: [{ dateTo: 'error' }],
  },
})

const reqNoView = httpMocks.createRequest({
  method: 'POST',
  body: { dateTo: '01/12/2024', dateFrom: '' },
  params: {
    crn,
  },
  query: { page: '' },
  session: {
    activityLogFilters: { page: '' },
    errorMessages: [{ dateTo: 'error' }],
  },
})

const getRequest = httpMocks.createRequest({
  body: { dateTo: '01/12/2024', dateFrom: '' },
  params: {
    crn,
  },
  query: { page: '' },
  session: {
    activityLogFilters: { page: '' },
    errorMessages: [{ dateTo: 'error' }],
  },
})

const reqValid = httpMocks.createRequest({
  method: 'POST',
  body: { dateTo: '01/12/2024', dateFrom: '01/11/2024' },
  params: {
    crn,
  },
  query: { page: '' },
  session: {
    activityLogFilters: { page: '', view: 'default', requirement: '' },
    errorMessages: [{ dateTo: 'error' }],
  },
})

const res = mockAppResponse({
  filters: {
    dateFrom: '',
    dateTo: '',
    keywords: '',
  },
})

describe('/controllers/activityLogController', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })
  describe('POST request', () => {
    it('POST with empty date should clear session and create new error - throws 404 due to invalid view', async () => {
      validation.activityLog(req, res)
      expect(res.status).toHaveBeenCalledWith(404)
    })
    it('POST with compact view with no date should clear session and create new error - continues to redirect', async () => {
      validation.activityLog(reqCompact, res)
      expect(res.redirect).toHaveBeenCalledWith('?error=true&view=compact')
    })
    it('POST with no view with no date should clear session and create new error - continues to redirect', async () => {
      validation.activityLog(reqNoView, res)
      expect(res.redirect).toHaveBeenCalledWith('?error=true')
    })
    it('POST with no view with valid dates should clear session and create no errors - continues to next', async () => {
      let next = false
      validation.activityLog(reqValid, res, () => {
        next = true
      })
      expect(next).toEqual(true)
    })

    it('GET continues to next', async () => {
      let next = false
      validation.activityLog(getRequest, res, () => {
        next = true
      })
      expect(next).toEqual(true)
    })
  })
})
