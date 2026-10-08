import httpMocks from 'node-mocks-http'
import { getOasysLink } from './getOasysLink'
import { AppResponse } from '../models/Locals'
import config from '../config'

const buildReq = () => httpMocks.createRequest()

const buildRes = (): AppResponse => ({ locals: {} }) as unknown as AppResponse

describe('getOasysLink middleware', () => {
  it('sets oasysLink on res.locals and calls next()', () => {
    const res = buildRes()
    const nextSpy = jest.fn()

    getOasysLink()(buildReq(), res, nextSpy)

    expect(res.locals.oasysLink).toEqual(config.oaSys.link)
    expect(nextSpy).toHaveBeenCalled()
  })
})
