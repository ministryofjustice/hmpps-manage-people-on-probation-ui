import nock from 'nock'
import { HttpsAgent } from 'agentkeepalive'
import { AgentConfig, ApiConfig } from '../types/Config'
import RestClient from './restClient'
import { isValidHost } from '../utils/isValidHost'
import { isValidPath } from '../utils/isValidPath'
import logger from '../logger'
import { ErrorSummary } from './model/common'

jest.mock('../utils/isValidHost', () => ({
  isValidHost: jest.fn(),
}))
jest.mock('../utils/isValidPath', () => ({
  isValidPath: jest.fn(),
}))

jest.mock('../logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}))

const mockedIsValidPath = isValidPath as jest.MockedFunction<typeof isValidPath>
const mockedIsValidHost = isValidHost as jest.MockedFunction<typeof isValidHost>

const restClient = new RestClient(
  'api-name',
  {
    url: 'http://localhost:8080/api',
    timeout: {
      response: 1000,
      deadline: 1000,
    },
    agent: new AgentConfig(1000),
  },
  'token-1',
)

describe.each(['get', 'post', 'put', 'delete'] as const)('Method: %s', method => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedIsValidHost.mockReturnValue(true)
    mockedIsValidPath.mockReturnValue(true)
    nock.cleanAll()
  })

  it('should return response body', async () => {
    nock('http://localhost:8080', { reqheaders: { authorization: 'Bearer token-1' } })
      [method]('/api/test')
      .reply(200, { success: true })

    const result = await restClient[method]({ path: '/test' })

    expect(result).toStrictEqual({ success: true })
    expect(nock.isDone()).toBe(true)
  })

  it('should return raw response body', async () => {
    nock('http://localhost:8080', { reqheaders: { authorization: 'Bearer token-1' } })
      [method]('/api/test')
      .reply(200, { success: true })

    const result = await restClient[method]({
      path: '/test',
      headers: { header1: 'headerValue1' },
      raw: true,
    })

    expect(result).toMatchObject({
      req: { method: method.toUpperCase() },
      status: 200,
      text: '{"success":true}',
    })
    expect(nock.isDone()).toBe(true)
  })

  if (method === 'get' || method === 'delete') {
    it('should retry by default', async () => {
      nock('http://localhost:8080', { reqheaders: { authorization: 'Bearer token-1' } })
        [method]('/api/test')
        .reply(500)
        [method]('/api/test')
        .reply(500)
        [method]('/api/test')
        .reply(500)

      await expect(restClient[method]({ path: '/test' })).rejects.toThrow('Internal Server Error')
      expect(nock.isDone()).toBe(true)
    })

    if (method === 'get') {
      it('should handle 500s if configured to do so', async () => {
        nock('http://localhost:8080', { reqheaders: { authorization: 'Bearer token-1' } })
          [method]('/api/test')
          .reply(500, { code: 500, message: 'An error' })
          [method]('/api/test')
          .reply(500)
          [method]('/api/test')
          .reply(500)

        const response = await restClient[method]<ErrorSummary>({
          path: `/test`,
          handle500: true,
          errorMessage: 'A 500 error',
        })
        expect(response.errors[0].text).toEqual('A 500 error')
        expect(nock.isDone()).toBe(true)
      })

      it('should handle 404s if configured to do so', async () => {
        nock('http://localhost:8080', { reqheaders: { authorization: 'Bearer token-1' } })
          [method]('/api/test')
          .reply(404)

        const response = await restClient[method]<ErrorSummary>({
          path: `/test`,
          handle404: true,
          errorMessage: 'A 404 error',
        })
        expect(response).toEqual(null)
        expect(nock.isDone()).toBe(true)
      })

      it('should handle 401s if configured to do so', async () => {
        nock('http://localhost:8080', { reqheaders: { authorization: 'Bearer token-1' } })
          [method]('/api/test')
          .reply(401)

        const response = await restClient[method]<ErrorSummary>({
          path: `/test`,
          handle401: true,
          errorMessage: 'A 401 error',
        })
        expect(response.errors[0].text).toEqual('A 401 error')
        expect(nock.isDone()).toBe(true)
      })
    }

    it('should log any errors if found', async () => {
      nock('http://localhost:8080', { reqheaders: { authorization: 'Bearer token-1' } })
        [method]('/api/test')
        .reply(500, (_, _body, cb) => cb(new Error('This is a test error'), [500, 'Error body']))

      await expect(restClient[method]<ErrorSummary>({ path: `/test`, handle500: true })).rejects.toThrow(
        'This is a test error',
      )
      expect(nock.isDone()).toBe(true)
    })
  } else {
    it('should handle 404s if configured to do so', async () => {
      nock('http://localhost:8080', { reqheaders: { authorization: 'Bearer token-1' } })
        [method]('/api/test')
        .reply(404)

      const response = await restClient[method]<ErrorSummary>({
        path: `/test`,
        handle404: true,
        errorMessage: 'Another 404 error',
      })
      expect(response).toEqual(null)
      expect(nock.isDone()).toBe(true)
    })

    it('should not retry by default', async () => {
      nock('http://localhost:8080', { reqheaders: { authorization: 'Bearer token-1' } })
        [method]('/api/test')
        .reply(500)

      await expect(restClient[method]({ path: '/test' })).rejects.toThrow('Internal Server Error')
      expect(nock.isDone()).toBe(true)
    })

    it('should retry if configured to do so', async () => {
      nock('http://localhost:8080', { reqheaders: { authorization: 'Bearer token-1' } })
        [method]('/api/test')
        .reply(500)
        [method]('/api/test')
        .reply(500)
        [method]('/api/test')
        .reply(500)

      await expect(restClient[method]({ path: '/test', retry: true })).rejects.toThrow('Internal Server Error')
      expect(nock.isDone()).toBe(true)
    })

    it('should log any errors if found', async () => {
      nock('http://localhost:8080', { reqheaders: { authorization: 'Bearer token-1' } })
        [method]('/api/test')
        .reply(500, (_uri, _body, cb) => cb(new Error('This is a test error'), [500, 'Error body']))

      await expect(
        restClient[method]<ErrorSummary>({
          path: `/test`,
          retry: true,
          handle500: true,
        }),
      ).rejects.toThrow('This is a test error')
      expect(nock.isDone()).toBe(true)
    })
  }

  it('can recover through retries', async () => {
    nock('http://localhost:8080', { reqheaders: { authorization: 'Bearer token-1' } })
      [method]('/api/test')
      .reply(500)
      [method]('/api/test')
      .reply(500)
      [method]('/api/test')
      .reply(200, { success: true })

    const result = await restClient[method]({ path: '/test', retry: true })
    expect(result).toStrictEqual({ success: true })
    expect(nock.isDone()).toBe(true)
  })
})

describe('RestClient.patch multipart', () => {
  beforeEach(() => {
    mockedIsValidHost.mockReturnValue(true)
    mockedIsValidPath.mockReturnValue(true)
    nock.cleanAll()
  })

  it('handles isMultipart with fields', async () => {
    const scope = nock('http://localhost:8080')
      .patch('/api/test')
      .reply(200, (_uri, body) => {
        const str = body.toString()
        expect(str).toContain('foo')
        expect(str).toContain('bar')
        return { ok: true }
      })

    const result = await restClient.patch({
      path: '/test',
      isMultipart: true,
      data: { fields: { foo: 'bar' } },
    })

    expect(result).toEqual({ ok: true })
    expect(scope.isDone()).toBe(true)
  })

  it('handles req.file', async () => {
    const file: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'hello.txt',
      buffer: Buffer.from('hello world'),
      mimetype: 'text/plain',
      size: 11,
      stream: null as any,
      destination: '',
      encoding: '7bit',
      filename: '',
      path: '',
    }

    const scope = nock('http://localhost:8080')
      .patch('/api/test')
      .reply(200, (_uri, body) => {
        const str = body.toString()
        expect(str).toContain('hello.txt')
        expect(str).toContain('hello world')
        return { ok: true }
      })

    const result = await restClient.patch({ path: '/test', file })
    expect(result).toEqual({ ok: true })
    expect(scope.isDone()).toBe(true)
  })

  it('handles req.files (multiple)', async () => {
    const files = [
      { fieldName: 'doc1', buffer: Buffer.from('one'), filename: 'one.txt' },
      { fieldName: 'doc2', buffer: Buffer.from('two'), filename: 'two.txt' },
    ]

    const scope = nock('http://localhost:8080')
      .patch('/api/test')
      .reply(200, (_uri, body) => {
        const str = body.toString()
        expect(str).toContain('one.txt')
        expect(str).toContain('two.txt')
        return { ok: true }
      })

    const result = await restClient.patch({
      path: '/test',
      isMultipart: true,
      data: { files },
    })

    expect(result).toEqual({ ok: true })
    expect(scope.isDone()).toBe(true)
  })
})

describe('RestClient.get', () => {
  it('throws if apiUrl or path is invalid', async () => {
    mockedIsValidHost.mockReturnValue(false)
    mockedIsValidPath.mockReturnValue(true)
    Object.defineProperty(restClient as any, 'apiUrl', { value: () => 'http://invalid-url' })
    const warnSpy = jest.spyOn(logger, 'warn')
    await expect(restClient.get({ path: '/test' } as any)).rejects.toThrow('Invalid API URL or path')
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid API URL or path'))
  })
})

describe('RestClient.delete', () => {
  it('throws if apiUrl or path is invalid', async () => {
    mockedIsValidHost.mockReturnValue(false)
    mockedIsValidPath.mockReturnValue(true)
    const warnSpy = jest.spyOn(logger, 'warn')
    await expect(restClient.delete({ path: '/test' } as any)).rejects.toThrow('Invalid API URL or path')
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid API URL or path'))
  })
})

describe('RestClient.construct', () => {
  it('sets new HttpAgent', async () => {
    const agentConfig: AgentConfig = { timeout: 30 }
    const config: ApiConfig = {
      url: 'https',
      agent: agentConfig,
      timeout: { response: 10, deadline: 10 },
    }
    const client = new RestClient('test', config, 'token')
    expect(client.agent).toBeInstanceOf(HttpsAgent)
  })
})
