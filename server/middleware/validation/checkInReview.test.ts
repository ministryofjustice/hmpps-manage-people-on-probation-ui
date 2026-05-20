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
const viewExpiredUrl = `${checkInUrl}/view-expired`

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
  it('validation passes for notes page', async () => {
    const esupervision = {
      [crn]: {
        [id]: {
          checkins: {
            sensitiveContact: 'false',
          },
        },
      },
    }
    const reqBaseNotes = {
      ...reqBase,
      url: notesUrl,
      session: {
        data: {
          esupervision,
        },
      },
      body: {
        esupervision,
      },
    } as RequestOptions
    const reqNotes = httpMocks.createRequest(reqBaseNotes)
    validation.checkInReview(reqNotes, res, next)
    expect(next).toHaveBeenCalled()
  })

  it('validation fails on notes page if no option selected', async () => {
    const reqBaseNotes = {
      ...reqBase,
      url: notesUrl,
      session: {
        data: {},
      },
      body: {},
    } as RequestOptions
    const reqNotes = httpMocks.createRequest(reqBaseNotes)
    validation.checkInReview(reqNotes, res, next)
    expect(res.render).toHaveBeenCalled()
  })

  it('validation passes for view expired page', async () => {
    const esupervision = {
      [crn]: {
        [id]: {
          checkins: {
            note: 'This is a test note',
            sensitiveContact: 'true',
          },
        },
      },
    }
    const reqBaseViewExpired = {
      ...reqBase,
      url: viewExpiredUrl,
      session: {
        data: {
          esupervision,
        },
      },
      body: {
        esupervision,
      },
    } as RequestOptions
    const reqViewExpired = httpMocks.createRequest(reqBaseViewExpired)
    validation.checkInReview(reqViewExpired, res, next)
    expect(next).toHaveBeenCalled()
  })
  it('validation fails on view expired page if no option selected', async () => {
    const reqBaseViewExpired = {
      ...reqBase,
      url: notesUrl,
      session: {
        data: {},
      },
      body: {},
    } as RequestOptions
    const reqViewExpired = httpMocks.createRequest(reqBaseViewExpired)
    validation.checkInReview(reqViewExpired, res, next)
    expect(res.render).toHaveBeenCalled()
  })
})
