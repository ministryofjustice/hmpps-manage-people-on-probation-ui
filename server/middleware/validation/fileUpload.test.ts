import { Request } from 'express'
import validation from '.'
import { mockAppResponse } from '../../controllers/mocks'

describe('middleware/validation/fileUpload', () => {
  const nextSpy = jest.fn()
  afterEach(() => {
    jest.clearAllMocks()
  })
  describe('Invalid file type', () => {
    const req = {
      files: [{ originalname: 'mock-file.png', mimetype: 'application/png', size: 1234, buffer: 'mock-buffer' }],
    } as unknown as Request
    const res = mockAppResponse()
    beforeEach(async () => {
      validation.fileUpload(req, res, nextSpy)
    })
    it('should set the 415 as the locals file error status', () => {
      expect(res.locals.fileErrorStatus).toEqual(415)
    })
    it('should return next()', () => {
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })
  describe('Invalid file size', () => {
    const req = {
      files: [{ originalname: 'mock-file.pdf', mimetype: 'application/pdf', size: 5242881, buffer: 'mock-buffer' }],
    } as unknown as Request
    const res = mockAppResponse()
    beforeEach(async () => {
      validation.fileUpload(req, res, nextSpy)
    })
    it('should set the 413 as the locals file error status', () => {
      expect(res.locals.fileErrorStatus).toEqual(413)
    })
    it('should return next()', () => {
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })
  describe('Valid file', () => {
    const req = {
      files: [{ originalname: 'mock-file.pdf', mimetype: 'application/pdf', size: 1234, buffer: 'mock-buffer' }],
    } as unknown as Request
    const res = mockAppResponse()
    beforeEach(async () => {
      validation.fileUpload(req, res, nextSpy)
    })
    it('should not set the locals file error status', () => {
      expect(res.locals.fileErrorStatus).toBeUndefined()
    })
    it('should return next()', () => {
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })
})
