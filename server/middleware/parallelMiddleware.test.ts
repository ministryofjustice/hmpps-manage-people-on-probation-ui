import httpMocks from 'node-mocks-http'
import type { NextFunction, Request } from 'express'
import parallelMiddleware from './parallelMiddleware'
import { AppResponse } from '../models/Locals'

const buildReq = () => httpMocks.createRequest()

const buildRes = (): AppResponse => ({ locals: {} }) as unknown as AppResponse

const delayed =
  (key: string, ms: number, log: string[]) =>
  async (_req: Request, res: AppResponse, next: NextFunction): Promise<void> => {
    log.push(`start ${key}`)
    await new Promise(resolve => {
      setTimeout(resolve, ms)
    })
    log.push(`end ${key}`)
    ;(res.locals as unknown as Record<string, unknown>)[key] = true
    next()
  }

describe('parallelMiddleware', () => {
  it('runs middleware concurrently and calls next() once when all have finished', async () => {
    const log: string[] = []
    const res = buildRes()
    const nextSpy = jest.fn()

    await parallelMiddleware(delayed('a', 20, log), delayed('b', 10, log))(buildReq(), res, nextSpy)

    expect(log).toEqual(['start a', 'start b', 'end b', 'end a'])
    expect(res.locals).toEqual(expect.objectContaining({ a: true, b: true }))
    expect(nextSpy).toHaveBeenCalledTimes(1)
    expect(nextSpy).toHaveBeenCalledWith()
  })

  it('runs an array entry in sequence', async () => {
    const log: string[] = []
    const nextSpy = jest.fn()

    await parallelMiddleware([delayed('a', 10, log), delayed('b', 5, log)], delayed('c', 1, log))(
      buildReq(),
      buildRes(),
      nextSpy,
    )

    expect(log.indexOf('end a')).toBeLessThan(log.indexOf('start b'))
    expect(log.indexOf('start c')).toBeLessThan(log.indexOf('end a'))
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })

  it('supports synchronous middleware', async () => {
    const res = buildRes()
    const nextSpy = jest.fn()
    const sync = (_req: Request, response: AppResponse, next: NextFunction) => {
      response.locals.oasysLink = 'link'
      next()
    }

    await parallelMiddleware(sync)(buildReq(), res, nextSpy)

    expect(res.locals.oasysLink).toEqual('link')
    expect(nextSpy).toHaveBeenCalledWith()
  })

  it('passes an error given to next() on to next()', async () => {
    const error = new Error('next error')
    const nextSpy = jest.fn()

    await parallelMiddleware(delayed('a', 1, []), (_req, _res, next) => next(error))(buildReq(), buildRes(), nextSpy)

    expect(nextSpy).toHaveBeenCalledTimes(1)
    expect(nextSpy).toHaveBeenCalledWith(error)
  })

  it('passes a thrown or rejected error on to next()', async () => {
    const error = new Error('thrown error')
    const nextSpy = jest.fn()

    await parallelMiddleware(async () => {
      throw error
    })(buildReq(), buildRes(), nextSpy)

    expect(nextSpy).toHaveBeenCalledTimes(1)
    expect(nextSpy).toHaveBeenCalledWith(error)
  })
})
