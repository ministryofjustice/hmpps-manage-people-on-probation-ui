import Agent, { HttpsAgent } from 'agentkeepalive'
import superagent, { Response } from 'superagent'

import logger from '../../logger'
import type { UnsanitisedError } from '../sanitisedError'
import sanitiseError from '../sanitisedError'
import type { ApiConfig } from '../config'
import { restClientMetricsMiddleware } from './restClientMetricsMiddleware'
import { ErrorSummaryItem } from './model/common'
import { escapeForLog } from '../utils/escapeForLog'
import { isValidHost } from '../utils/isValidHost'
import { isValidPath } from '../utils/isValidPath'

interface Request {
  path: string
  query?: object | string
  headers?: Record<string, string>
  responseType?: string
  raw?: boolean
  handle404?: boolean
  handle500?: boolean
  handle401?: boolean
  errorMessageFor500?: string
}

interface RequestWithBody extends Request {
  data?: Record<string, any>
  retry?: boolean
}

interface StreamRequest {
  path?: string
  headers?: Record<string, string>
  errorLogger?: (e: UnsanitisedError) => void
}

export default class RestClient {
  agent: Agent

  constructor(
    private readonly name: string,
    private readonly config: ApiConfig,
    private readonly token: string,
  ) {
    this.agent = config.url.startsWith('https') ? new HttpsAgent(config.agent) : new Agent(config.agent)
  }

  private apiUrl() {
    return this.config.url
  }

  private timeoutConfig() {
    return this.config.timeout
  }

  async get<TResponse = unknown>({
    path,
    query = {},
    headers = {},
    responseType = '',
    raw = false,
    handle404 = false,
    handle500 = false,
    handle401 = false,
    errorMessageFor500 = '',
  }: Request): Promise<TResponse> {
    logger.info(escapeForLog(`${this.name} GET: ${path}`))

    const apiUrl = this.apiUrl()
    if (!isValidHost(apiUrl) || !isValidPath(path)) {
      logger.warn(escapeForLog(`Invalid API URL or path: apiUrl='${apiUrl}', path='${path}'`))
      throw new Error(`Invalid API URL or path`)
    }

    try {
      const result: Response = await superagent
        .get(`${this.apiUrl()}${path}`)
        .query(query)
        .agent(this.agent)
        .use(restClientMetricsMiddleware)
        .retry(2, (err, res) => {
          if (err) logger.info(`Retry handler found ${this.name} API error with ${err.code} ${err.message}`)
          return undefined // retry handler only for logging retries, not to influence retry logic
        })
        .auth(this.token, { type: 'bearer' })
        .set(headers)
        .responseType(responseType)
        .timeout(this.timeoutConfig())

      return raw ? (result as TResponse) : result.body
    } catch (error: any) {
      if (handle500 && error?.response?.status === 500) {
        const warnings: ErrorSummaryItem[] = []
        warnings.push({ text: errorMessageFor500 })
        error.response.errors = warnings
        logger.info('Handling 500')
        return error.response
      }
      if (handle404 && error?.response?.status === 404) {
        logger.info('Handling 404')
        return null
      }
      if (handle401 && error?.response?.status === 401) {
        logger.info('Handling 401s the same as 500s')
        const warnings: ErrorSummaryItem[] = []
        warnings.push({ text: errorMessageFor500 })
        error.response.errors = warnings
        return error.response
      }
      const sanitisedError = sanitiseError(error)
      logger.warn({ ...sanitisedError }, escapeForLog(`Error calling ${this.name}, path: '${path}', verb: 'GET'`))
      throw sanitisedError
    }
  }

  private async requestWithBody<Response = unknown>(
    method: 'patch' | 'post' | 'put',
    {
      path,
      query = {},
      headers = {},
      responseType = '',
      data = {},
      raw = false,
      retry = false,
      handle404 = false,
    }: RequestWithBody,
  ): Promise<Response> {
    logger.info(escapeForLog(`${this.name} ${method.toUpperCase()}: ${path}`))

    try {
      const result = await superagent[method](`${this.apiUrl()}${path}`)
        .query(query)
        .send(data)
        .agent(this.agent)
        .use(restClientMetricsMiddleware)
        .retry(2, (err, res) => {
          if (retry === false) {
            return false
          }
          if (err) logger.info(`Retry handler found API error with ${err.code} ${err.message}`)
          return undefined // retry handler only for logging retries, not to influence retry logic
        })
        .auth(this.token, { type: 'bearer' })
        .set(headers)
        .responseType(responseType)
        .timeout(this.timeoutConfig())

      return raw ? (result as Response) : result.body
    } catch (error) {
      if (handle404 && error.response?.status === 404) return null
      const sanitisedError = sanitiseError(error)
      logger.warn(
        { ...sanitisedError },
        escapeForLog(`Error calling ${this.name}, path: '${path}', verb: '${method.toUpperCase()}'`),
      )
      throw sanitisedError
    }
  }

  async patch<Response = unknown>(request: RequestWithBody): Promise<Response> {
    return this.requestWithBody('patch', request)
  }

  async post<Response = unknown>(request: RequestWithBody): Promise<Response> {
    return this.requestWithBody('post', request)
  }

  async put<Response = unknown>(request: RequestWithBody): Promise<Response> {
    return this.requestWithBody('put', request)
  }

  async delete<Response = unknown>({
    path,
    query = {},
    headers = {},
    responseType = '',
    raw = false,
  }: Request): Promise<Response> {
    logger.info(escapeForLog(`${this.name} DELETE: ${path}`))

    const apiUrl = this.apiUrl()
    if (!isValidHost(apiUrl) || !isValidPath(path)) {
      logger.warn(escapeForLog(`Invalid API URL or path: apiUrl='${apiUrl}', path='${path}'`))
      throw new Error(`Invalid API URL or path`)
    }

    try {
      const result = await superagent
        .delete(`${this.apiUrl()}${path}`)
        .query(query)
        .agent(this.agent)
        .use(restClientMetricsMiddleware)
        .retry(2, (err, res) => {
          if (err) logger.info(`Retry handler found ${this.name} API error with ${err.code} ${err.message}`)
          return undefined // retry handler only for logging retries, not to influence retry logic
        })
        .auth(this.token, { type: 'bearer' })
        .set(headers)
        .responseType(responseType)
        .timeout(this.timeoutConfig())

      return raw ? (result as Response) : result.body
    } catch (error) {
      const sanitisedError = sanitiseError(error)
      logger.warn({ ...sanitisedError }, escapeForLog(`Error calling ${this.name}, path: '${path}', verb: 'DELETE'`))
      throw sanitisedError
    }
  }
}
