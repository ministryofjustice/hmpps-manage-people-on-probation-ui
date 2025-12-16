import httpMocks, { RequestOptions } from 'node-mocks-http'
import validation from '.'
import { mockAppResponse } from '../../controllers/mocks'

const crn = 'X000001'
const id = '1'
const checkInUrl = `case/${crn}/appointments/${id}/check-in`
const identityUrl = `${checkInUrl}/review/identity`
const notesUrl = `${checkInUrl}/review/notes`
const expiredUrl = `${checkInUrl}/review/expired`
const viewUrl = `${checkInUrl}/view`

const reqBase = {
  method: 'POST',
  params: {
    crn,
    id,
  },
  query: {},
  session: {},
  body: {},
} as RequestOptions
const req = httpMocks.createRequest(reqBase)
const res = mockAppResponse({
  filters: {
    dateFrom: '',
    dateTo: '',
    keywords: '',
  },
})
const next = jest.fn()

describe('/controllers/arrangeAppointmentController', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })
  it('validation passes for identity page', async () => {
    const esupervision = {
      [crn]: {
        [id]: {
          checkins: {
            manualIdCheck: 'NO_MATCH',
          },
        },
      },
    }
    const reqBaseIdentity = {
      ...reqBase,
      url: identityUrl,
      session: {
        data: {
          esupervision,
        },
      },
      body: {
        esupervision,
      },
    } as RequestOptions
    const reqIdentity = httpMocks.createRequest(reqBaseIdentity)
    validation.checkInReview(reqIdentity, res, next)
    expect(next).toHaveBeenCalled()
  })
  it('validation fails if no option selected', async () => {
    const reqBaseIdentity = {
      ...reqBase,
      url: identityUrl,
      session: {
        data: {},
      },
      body: {
        esupervision: {},
      },
    } as RequestOptions
    const reqIdentity = httpMocks.createRequest(reqBaseIdentity)
    validation.checkInReview(reqIdentity, res, next)
    expect(res.render).toHaveBeenCalled()
  })
  it('validation passes for expired page', async () => {
    const esupervision = {
      [crn]: {
        [id]: {
          checkins: {
            note: 'note',
          },
        },
      },
    }
    const reqBaseExpired = {
      ...reqBase,
      url: expiredUrl,
      session: {
        data: {
          esupervision,
        },
      },
      body: {
        esupervision,
      },
    } as RequestOptions
    const reqExpired = httpMocks.createRequest(reqBaseExpired)
    validation.checkInReview(reqExpired, res, next)
    // expect(next).toHaveBeenCalled()
  })
  it('validation fails if no option selected', async () => {
    const reqBaseExpired = {
      ...reqBase,
      url: expiredUrl,
      session: {
        data: {},
      },
      body: {
        esupervision: {},
      },
    } as RequestOptions
    const reqExpired = httpMocks.createRequest(reqBaseExpired)
    validation.checkInReview(reqExpired, res, next)
    expect(res.render).toHaveBeenCalled()
  })
  it('validation passes for view page', async () => {
    const esupervision = {
      [crn]: {
        [id]: {
          checkins: {
            note: 'note',
          },
        },
      },
    }
    const reqBaseView = {
      ...reqBase,
      url: viewUrl,
      session: {
        data: {
          esupervision,
        },
      },
      body: {
        esupervision,
      },
    } as RequestOptions
    const reqView = httpMocks.createRequest(reqBaseView)
    validation.checkInReview(reqView, res, next)
    // expect(next).toHaveBeenCalled()
  })
  it('validation fails if no option selected', async () => {
    const reqBaseView = {
      ...reqBase,
      url: viewUrl,
      session: {
        data: {},
      },
      body: {
        esupervision: {},
      },
    } as RequestOptions
    const reqView = httpMocks.createRequest(reqBaseView)
    validation.checkInReview(reqView, res, next)
    expect(res.render).toHaveBeenCalled()
  })
})
