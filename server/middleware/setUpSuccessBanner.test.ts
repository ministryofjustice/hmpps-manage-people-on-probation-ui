import httpMocks from 'node-mocks-http'
import setUpSuccessBanner from './setUpSuccessBanner'

describe('setUpSuccessBanner', () => {
  const next = jest.fn()

  afterEach(() => jest.clearAllMocks())

  it('sets showSuccessBanner and uploadFailed to false when no flash', () => {
    const req = httpMocks.createRequest()
    req.flash = jest.fn().mockReturnValue([])
    const res = httpMocks.createResponse()

    setUpSuccessBanner()(req, res, next)

    expect(res.locals.showSuccessBanner).toBe(false)
    expect(res.locals.uploadFailed).toBe(false)
    expect(next).toHaveBeenCalled()
  })

  it('sets showSuccessBanner to true and uploadFailed to false when flash is success', () => {
    const req = httpMocks.createRequest()
    req.flash = jest.fn().mockReturnValue(['success'])
    const res = httpMocks.createResponse()

    setUpSuccessBanner()(req, res, next)

    expect(res.locals.showSuccessBanner).toBe(true)
    expect(res.locals.uploadFailed).toBe(false)
    expect(next).toHaveBeenCalled()
  })

  it('sets showSuccessBanner to true and uploadFailed to true when flash is uploadFailed', () => {
    const req = httpMocks.createRequest()
    req.flash = jest.fn().mockReturnValue(['uploadFailed'])
    const res = httpMocks.createResponse()

    setUpSuccessBanner()(req, res, next)

    expect(res.locals.showSuccessBanner).toBe(true)
    expect(res.locals.uploadFailed).toBe(true)
    expect(next).toHaveBeenCalled()
  })
})
