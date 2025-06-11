import nock from 'nock'

import { HttpsAgent } from 'agentkeepalive'
import { HttpError } from 'http-errors'
import { AgentConfig, type ApiConfig } from '../config'
import RestClient from './restClient'
import { isValidHost, isValidPath } from '../utils'
import logger from '../../logger'
import { ErrorSummary } from './model/common'

jest.mock('../utils', () => {
  const actualUtils = jest.requireActual('../utils')
  return {
    ...actualUtils,
    isValidPath: jest.fn(),
    isValidHost: jest.fn(),
  }
})

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

describe.each(['get', 'patch', 'post', 'put', 'delete'] as const)('Method: %s', method => {
  jest.clearAllMocks()
  mockedIsValidHost.mockReturnValue(true)
  mockedIsValidPath.mockReturnValue(true)

  it('should return response body', async () => {
    nock('http://localhost:8080', {
      reqheaders: { authorization: 'Bearer token-1' },
    })
      [method]('/api/test')
      .reply(200, { success: true })

    const result = await restClient[method]({
      path: '/test',
    })

    expect(nock.isDone()).toBe(true)

    expect(result).toStrictEqual({
      success: true,
    })
  })

  it('should return raw response body', async () => {
    nock('http://localhost:8080', {
      reqheaders: { authorization: 'Bearer token-1' },
    })
      [method]('/api/test')
      .reply(200, { success: true })

    const result = await restClient[method]({
      path: '/test',
      headers: { header1: 'headerValue1' },
      raw: true,
    })

    expect(nock.isDone()).toBe(true)

    expect(result).toMatchObject({
      req: { method: method.toUpperCase() },
      status: 200,
      text: '{"success":true}',
    })
  })

  if (method === 'get' || method === 'delete') {
    it('should retry by default', async () => {
      nock('http://localhost:8080', {
        reqheaders: { authorization: 'Bearer token-1' },
      })
        [method]('/api/test')
        .reply(500)
        [method]('/api/test')
        .reply(500)
        [method]('/api/test')
        .reply(500)

      await expect(
        restClient[method]({
          path: '/test',
          headers: { header1: 'headerValue1' },
        }),
      ).rejects.toThrow('Internal Server Error')

      expect(nock.isDone()).toBe(true)
    })
    if (method === 'get') {
      it('should handle 500s if configured to do so', async () => {
        nock('http://localhost:8080', {
          reqheaders: { authorization: 'Bearer token-1' },
        })
          [method]('/api/test')
          .reply(500, { code: 500, message: 'An error' })
          [method]('/api/test')
          .reply(500)
          [method]('/api/test')
          .reply(500)

        const response = await restClient[method]<ErrorSummary>({
          path: `/test`,
          handle500: true,
          errorMessageFor500: 'A 500 error',
          headers: { header1: 'headerValue1' },
        })
        expect(response.errors[0].text).toEqual('A 500 error')
        expect(nock.isDone()).toBe(true)
      })
      //          // .reply((uri, body, callback) => {
      //           //
      //           //
      //           //   // callback(null, [500, 'Error body'])
      //           // })
      it('should handle 404s if configured to do so', async () => {
        nock('http://localhost:8080', {
          reqheaders: { authorization: 'Bearer token-1' },
        })
          [method]('/api/test')
          .reply(404)

        const response = await restClient[method]<ErrorSummary>({
          path: `/test`,
          handle404: true,
          errorMessageFor500: 'A 404 error',
          headers: { header1: 'headerValue1' },
        })
        expect(response).toEqual(null)
        expect(nock.isDone()).toBe(true)
      })
      it('should handle 401s if configured to do so', async () => {
        nock('http://localhost:8080', {
          reqheaders: { authorization: 'Bearer token-1' },
        })
          [method]('/api/test')
          .reply(401)

        const response = await restClient[method]<ErrorSummary>({
          path: `/test`,
          handle401: true,
          errorMessageFor500: 'A 401 error',
          headers: { header1: 'headerValue1' },
        })
        expect(response.errors[0].text).toEqual('A 401 error')
        expect(nock.isDone()).toBe(true)
      })
    }
    it('should log any errors if found', async () => {
      nock('http://localhost:8080', {
        reqheaders: { authorization: 'Bearer token-1' },
      })
        [method]('/api/test')
        .reply(500, (uri, body, callback) => {
          return callback(new Error('This is a test error'), [500, 'Error body'])
        })
      await expect(
        restClient[method]<ErrorSummary>({
          path: `/test`,
          handle500: true,
          errorMessageFor500: 'A 500 error',
          headers: { header1: 'headerValue1' },
        }),
      ).rejects.toThrow('This is a test error')
      expect(nock.isDone()).toBe(true)
    })
  } else {
    it('should handle 404s for put or ppst if configured to do so', async () => {
      nock('http://localhost:8080', {
        reqheaders: { authorization: 'Bearer token-1' },
      })
        [method]('/api/test')
        .reply(404)

      const response = await restClient[method]<ErrorSummary>({
        path: `/test`,
        handle404: true,
        errorMessageFor500: 'A 404 error',
        headers: { header1: 'headerValue1' },
      })
      expect(response).toEqual(null)
      expect(nock.isDone()).toBe(true)
    })
    it('should not retry by default', async () => {
      nock('http://localhost:8080', {
        reqheaders: { authorization: 'Bearer token-1' },
      })
        [method]('/api/test')
        .reply(500)

      await expect(
        restClient[method]({
          path: '/test',
          headers: { header1: 'headerValue1' },
        }),
      ).rejects.toThrow('Internal Server Error')

      expect(nock.isDone()).toBe(true)
    })
    it('should retry if configured to do so', async () => {
      nock('http://localhost:8080', {
        reqheaders: { authorization: 'Bearer token-1' },
      })
        [method]('/api/test')
        .reply(500)
        [method]('/api/test')
        .reply(500)
        [method]('/api/test')
        .reply(500)

      await expect(
        restClient[method]({
          path: '/test',
          headers: { header1: 'headerValue1' },
          retry: true,
        }),
      ).rejects.toThrow('Internal Server Error')

      expect(nock.isDone()).toBe(true)
    })
    it('should log any errors if found for post', async () => {
      nock('http://localhost:8080', {
        reqheaders: { authorization: 'Bearer token-1' },
      })
        [method]('/api/test')
        .reply(500, (uri, body, callback) => {
          return callback(new Error('This is a test error'), [500, 'Error body'])
        })
      await expect(
        restClient[method]<ErrorSummary>({
          path: `/test`,
          retry: true,
          handle500: true,
          errorMessageFor500: 'A 500 error',
          headers: { header1: 'headerValue1' },
        }),
      ).rejects.toThrow('This is a test error')
      expect(nock.isDone()).toBe(true)
    })
  }

  it('can recover through retries', async () => {
    nock('http://localhost:8080', {
      reqheaders: { authorization: 'Bearer token-1' },
    })
      [method]('/api/test')
      .reply(500)
      [method]('/api/test')
      .reply(500)
      [method]('/api/test')
      .reply(200, { success: true })

    const result = await restClient[method]({
      path: '/test',
      headers: { header1: 'headerValue1' },
      retry: true,
    })

    expect(result).toStrictEqual({ success: true })
    expect(nock.isDone()).toBe(true)
  })
})

describe('RestClient.get', () => {
  it('throws an error if apiUrl or path is invalid', async () => {
    mockedIsValidHost.mockReturnValue(false)
    mockedIsValidPath.mockReturnValue(true)
    Object.defineProperty(restClient as any, 'apiUrl', {
      value: () => 'http://invalid-url',
    })
    const warnSpy = jest.spyOn(logger, 'warn')
    await expect(restClient.get({ path: '/test' } as any)).rejects.toThrow('Invalid API URL or path')
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid API URL or path'))
  })
})

describe('RestClient.delete', () => {
  it('throws an error if apiUrl or path is invalid', async () => {
    mockedIsValidHost.mockReturnValue(false)
    mockedIsValidPath.mockReturnValue(true)
    const warnSpy = jest.spyOn(logger, 'warn')
    await expect(restClient.delete({ path: '/test' } as any)).rejects.toThrow('Invalid API URL or path')
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid API URL or path'))
  })
})

describe('RestClient.construct', () => {
  it('sets new HttpAgent', async () => {
    const agentConfig: AgentConfig = {
      timeout: 30,
    }
    const config: ApiConfig = {
      url: 'https',
      agent: agentConfig,
      timeout: {
        response: 10,
        deadline: 10,
      },
    }
    const client = new RestClient('test', config, 'token')
    expect(client.agent).toBeInstanceOf(HttpsAgent)
  })
})
