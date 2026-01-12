import httpMocks from 'node-mocks-http'
import { urlToRenderPath } from './urlToRenderPath'

describe('urlToRenderPath', () => {
  it('returns res.locals.renderPath when present', () => {
    const req = httpMocks.createRequest({ url: '/test/path' })
    const res = httpMocks.createResponse()
    res.locals.renderPath = 'custom/path'
    const result = urlToRenderPath(req as any, res as any)
    expect(result).toBe('custom/path')
  })

  it('builds path using originalUrl', () => {
    const req = httpMocks.createRequest({ originalUrl: '/case/123/appointments/456/add-note' })
    const res = httpMocks.createResponse()
    const result = urlToRenderPath(req as any, res as any)
    expect(result).toBe('pages/appointments/add-note')
  })

  it('builds path using req.url when originalUrl missing', () => {
    const req = httpMocks.createRequest({ url: '/foo/bar/baz' })
    const res = httpMocks.createResponse()
    const result = urlToRenderPath(req as any, res as any)
    expect(result).toBe('pages/baz')
  })

  it('filters out indices 0,1,3', () => {
    const req = httpMocks.createRequest({ originalUrl: '/a/b/c/d/e/f' })
    const res = httpMocks.createResponse()
    const result = urlToRenderPath(req as any, res as any)
    expect(result).toBe('pages/c/e/f')
  })
})
