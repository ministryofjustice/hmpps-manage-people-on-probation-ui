import httpMocks from 'node-mocks-http'
import { MulterError } from 'multer'
import { NextFunction, Response } from 'express'
import { mockAppResponse } from '../../controllers/mocks'
import { multerErrorHandler } from './multerErrorHandler'
import { AppResponse } from '../../models/Locals'

jest.mock('multer', () => {
  class MockMulterError extends Error {
    code: string

    field?: string

    constructor(code: string, field?: string) {
      super(code)
      this.code = code
      this.field = field
    }
  }

  const multerMock = (options: any) => ({
    single: () => (req: any, res: any, multerCallback: any) => {
      // Simulate an error by calling the *multer callback*, not next()
      if (req.multerError) {
        return multerCallback(req.multerError)
      }

      // Simulate successful upload
      const file = req.file ?? {
        mimetype: 'application/pdf',
        originalname: 'file.pdf',
        buffer: Buffer.from('x'),
        size: 10,
        fieldname: 'fileUpload',
      }

      if (options.fileFilter) {
        return options.fileFilter(req, file, (error: any, accept?: boolean) => {
          if (error) {
            return multerCallback(error)
          }

          if (accept === false) {
            return multerCallback(new MockMulterError('LIMIT_UNEXPECTED_FILE', file.fieldname))
          }

          req.file = file
          return multerCallback(undefined)
        })
      }

      req.file = file

      // Success → call multer callback with no error
      return multerCallback(undefined)
    },
  })

  multerMock.memoryStorage = () => ({})
  multerMock.MulterError = MockMulterError

  return multerMock
})

describe('multerErrorHandler', () => {
  const field = 'fileUpload'
  const handler = multerErrorHandler(field)
  let next: NextFunction | jest.Mock<any, any, any>
  let res: Response<any, Record<string, any>> | AppResponse
  beforeEach(() => {
    next = jest.fn()
    res = mockAppResponse({})
  })
  const baseReq = {
    method: 'POST',
    url: '/test/path',
    originalUrl: '/test/path',
    session: {},
    params: {},
    body: {},
  }
  it('calls next when no error', () => {
    const req = httpMocks.createRequest(baseReq as any)
    handler(req, res, next)
    expect(next).toHaveBeenCalled()
  })
  it('handles LIMIT_FILE_SIZE', async () => {
    const err = new MulterError('LIMIT_FILE_SIZE')
    const req = httpMocks.createRequest({ ...baseReq, multerError: err } as any)

    await new Promise<void>(resolve => {
      handler(req, res, () => {
        resolve()
      })
    })

    expect(res.locals.errorMessages).toEqual({
      [field]: 'File size must be 5mb or under',
    })
  })

  it('handles LIMIT_UNEXPECTED_FILE', async () => {
    const err = new MulterError('LIMIT_UNEXPECTED_FILE', field)
    const req = httpMocks.createRequest({ ...baseReq, multerError: err } as any)

    await new Promise<void>(resolve => {
      handler(req, res, () => {
        resolve()
      })
    })

    expect(res.locals.errorMessages).toEqual({
      [field]: 'Only PDF, Word or JPEG files are allowed',
    })
  })

  it('sets renderPath on error', async () => {
    const err = new MulterError('LIMIT_FILE_SIZE')
    const req = httpMocks.createRequest({ ...baseReq, multerError: err } as any)

    await new Promise<void>(resolve => {
      handler(req, res, () => {
        resolve()
      })
    })

    expect(res.locals.renderPath).toBeTruthy()
  })

  describe('JPEG file validation', () => {
    it('accepts a .jpeg file', async () => {
      const req = httpMocks.createRequest({
        ...baseReq,
        file: {
          fieldname: field,
          mimetype: 'image/jpeg',
          originalname: 'image.jpeg',
          buffer: Buffer.from('x'),
          size: 10,
        },
      } as any)

      await new Promise<void>(resolve => {
        handler(req, res, () => {
          resolve()
        })
      })

      expect(res.locals.errorMessages).toBeUndefined()
    })
    it('rejects a .jpg file', async () => {
      const req = httpMocks.createRequest({
        ...baseReq,
        file: {
          fieldname: field,
          mimetype: 'image/jpeg',
          originalname: 'image.jpg',
          buffer: Buffer.from('x'),
          size: 10,
        },
      } as any)

      await new Promise<void>(resolve => {
        handler(req, res, () => {
          resolve()
        })
      })

      expect(res.locals.errorMessages).toEqual({
        [field]: 'Only PDF, Word or JPEG files are allowed',
      })
    })
  })
})
