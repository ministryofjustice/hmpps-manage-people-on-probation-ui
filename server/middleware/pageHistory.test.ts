import httpMocks from 'node-mocks-http'
import { mockAppResponse } from '../controllers/mocks'
import { pageHistory } from './pageHistory'

const crn = 'X000001'
const contactId = '1234'
const uuid = '5678'

const nextSpy = jest.fn()
const res = mockAppResponse()

describe('middleware/pageHistory', () => {
  it('should create a new history session if non exists', () => {
    const req = httpMocks.createRequest({
      url: `/case/${crn}/appointments/appointment/${contactId}/manage`,
      session: {},
    })
    pageHistory(req, res, nextSpy)
    expect(res.locals.backLink).toEqual(null)
    expect(req.session.pageHistory).toEqual([req.url])
  })
  it('should incremenent the current request url if url is not in session', () => {
    const history = [`/case/${crn}/appointments`, `/case/${crn}/appointments/appointment/${contactId}/manage`]
    const req = httpMocks.createRequest({
      url: `/case/${crn}/appointments/appointment/${contactId}/attend-comply`,
      session: {
        pageHistory: history,
      },
    })
    pageHistory(req, res, nextSpy)
    expect(res.locals.backLink).toEqual(history.at(-1))
    expect(req.session.pageHistory).toEqual([...history, req.url])
  })
  it('should reset the history back to last occurance of the request url if already in session', () => {
    const history = [
      `/case/${crn}/appointments`,
      `/case/${crn}/appointments/appointment/${contactId}/manage`,
      `/case/${crn}/appointments/appointment/${contactId}/attend-comply`,
      `/case/${crn}/appointments/appointment/${contactId}/add-note`,
    ]
    const req = httpMocks.createRequest({
      url: `/case/${crn}/appointments/appointment/${contactId}/manage`,
      session: {
        pageHistory: history,
      },
    })
    pageHistory(req, res, nextSpy)
    expect(res.locals.backLink).toEqual(history[0])
    expect(req.session.pageHistory).toEqual(history.slice(0, 2))
  })
  it('should not update history if request url is last url in session', () => {
    const history = [`/case/${crn}/appointments`, `/case/${crn}/appointments/appointment/${contactId}/manage`]
    const req = httpMocks.createRequest({
      url: `/case/${crn}/appointments/appointment/${contactId}/manage`,
      session: {
        pageHistory: history,
      },
    })
    pageHistory(req, res, nextSpy)
    expect(res.locals.backLink).toEqual(history[0])
    expect(req.session.pageHistory).toEqual(history)
  })
  it('should not update history if history has one entry and is current request url', () => {
    const history = [`/case/${crn}/appointments`]
    const req = httpMocks.createRequest({
      url: `/case/${crn}/appointments`,
      session: {
        pageHistory: history,
      },
    })
    pageHistory(req, res, nextSpy)
    expect(res.locals.backLink).toEqual(null)
    expect(req.session.pageHistory).toEqual(history)
  })
  it('should set the correct session and back link if clicking back through page history', () => {
    const history = [
      `/case/${crn}/appointments`,
      `/case/${crn}/appointments/appointment/${contactId}/manage`,
      `/case/${crn}/appointments/appointment/${contactId}/next-appointment`,
      `/case/${crn}/arrange-appointment/${uuid}/sentence`,
      `/case/${crn}/arrange-appointment/${uuid}/type`,
    ]
    for (let i = history.length - 1; i > 0; i -= 1) {
      const req = httpMocks.createRequest({
        url: history[i],
        session: {
          pageHistory: history.slice(0, i + 1),
        },
      })
      pageHistory(req, res, nextSpy)
      expect(res.locals.backLink).toEqual(history[i - 1])
      expect(req.session.pageHistory).toEqual(history.slice(0, i + 1))
    }
  })
})
