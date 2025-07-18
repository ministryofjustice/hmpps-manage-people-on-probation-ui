import { HttpAgent as Agent, HttpsAgent } from 'agentkeepalive'
import crypto from 'crypto'
import fs from 'fs/promises'
import superagent, { Response } from 'superagent'
import logger from '../../logger'
import sanitiseError from '../sanitisedError'
import type { ApiConfig } from '../config'
import { restClientMetricsMiddleware } from './restClientMetricsMiddleware'
import { ErrorSummaryItem } from './model/common'
import { escapeForLog, isValidHost, isValidPath } from '../utils'

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
  fileToUpload?: Express.Multer.File
  encryptFile?: boolean
  retry?: boolean
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
        .retry(2, (err, _) => {
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
        JSON.stringify(error.response)

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
      fileToUpload,
      encryptFile = false,
      // files,
    }: RequestWithBody & {
      file?: Express.Multer.File | { fieldname: string; buffer: Buffer; originalname: string }
    },
  ): Promise<Response> {
    logger.info(escapeForLog(`${this.name} ${method.toUpperCase()}: ${path}`))

    try {
      const request = superagent[method](`${this.apiUrl()}${path}`)
        .query(query)
        .agent(this.agent)
        .use(restClientMetricsMiddleware)
        .retry(2, (err, _) => {
          if (retry === false) return false
          if (err) logger.info(`Retry handler found API error with ${err.code} ${err.message}`)
          return undefined
        })
        .auth(this.token, { type: 'bearer' })
        .set(headers)
        .responseType(responseType)
        .timeout(this.timeoutConfig())

      // If a file is included, use multipart/form-data
      // const isMultipart = files && files.length > 0
      // if (isMultipart) {
      if (fileToUpload) {
        request.type('multipart/form-data')
        if (encryptFile) {
          try {
            const key = crypto.randomBytes(32) // 256 bits for AES-256
            const iv = crypto.randomBytes(12) // 96 bits recommended for GCM
            const encyptedBuffer = await this.encryptFileToBuffer(key, iv, fileToUpload.path)
            const { filename } = fileToUpload
            request.field('iv', iv.toString('hex'))
            request.attach('file', encyptedBuffer, filename)
          } catch (error) {
            logger.info('Upload failed:', error)
          }
        } else {
          // Attach the raw file
          const { fieldname, buffer, originalname } = fileToUpload
          request.attach(fieldname, buffer, originalname)
          /*
      
        For multifile
 
        for (const file of files) {
          if ('fieldname' in file && file.buffer) {
            request.attach(file.fieldname, file.buffer, file.originalname)
          } else if ('fieldname' in file && file.file) {
            request.attach(file.fieldname, file.file, file.originalname)
          }
        }
        */
        }

        // Add other form fields (req.body)
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            request.field(key, typeof value === 'string' ? value : JSON.stringify(value))
          }
        })
      } else {
        // Send regular JSON body if no file
        request.send(data)
      }

      const result = await request
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

  async encryptFileToBuffer(key: Buffer, iv: Buffer, filePath: string) {
    const plainText = await fs.readFile(filePath)
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
    const encrypted = Buffer.concat([cipher.update(plainText), cipher.final()])
    const authTag = cipher.getAuthTag()
    return Buffer.concat([encrypted, authTag])
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
        .retry(2, (err, _) => {
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
