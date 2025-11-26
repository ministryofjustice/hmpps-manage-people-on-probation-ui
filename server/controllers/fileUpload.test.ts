import { Request } from 'express'
import controllers from '.'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { mockAppResponse } from './mocks'
import { FileUploadResponse } from '../@types'
import MasApiClient from '../data/masApiClient'

const token = { access_token: 'token-1', expires_in: 300 }
const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>

jest.mock('../data/tokenStore/redisTokenStore')

jest.mock('../data/hmppsAuthClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSystemClientToken: jest.fn().mockImplementation(() => Promise.resolve('token-1')),
    }
  })
})

const patchDocumentsSpy = jest
  .spyOn(MasApiClient.prototype, 'patchDocuments')
  .mockImplementation(() => Promise.resolve(200))

tokenStore.getToken.mockResolvedValue(token.access_token)

const id = '1234'
const crn = 'X000001'
const originalname = 'mock-file.pdf'
const size = 1234567
const req = {
  files: [{ originalname, size, buffer: 'mock-buffer' }],
  body: { id, crn },
} as unknown as Request

describe('fileUpload controller', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })
  describe('postUploadFile', () => {
    describe('Uploaded file is invalid type', () => {
      const mockRes = mockAppResponse({
        id,
        crn,
        fileErrorStatus: 415,
      })
      const statusSpy = jest.spyOn(mockRes, 'status')
      const jsonSpy = jest.spyOn(mockRes, 'json')
      beforeEach(async () => {
        await controllers.fileUpload.postUploadFile(hmppsAuthClient)(req, mockRes)
      })
      it('should return the correct response', () => {
        const expectedResponse: FileUploadResponse = {
          file: {
            id,
            name: originalname,
            size,
          },
          error: {
            message: 'The selected file must be a PDF or Word document',
          },
        }
        expect(statusSpy).toHaveBeenCalledWith(415)
        expect(jsonSpy).toHaveBeenCalledWith(expectedResponse)
      })
    })
    describe('Uploaded file is invalid file size', () => {
      const mockRes = mockAppResponse({
        id,
        crn,
        fileErrorStatus: 413,
      })
      const statusSpy = jest.spyOn(mockRes, 'status')
      const jsonSpy = jest.spyOn(mockRes, 'json')
      beforeEach(async () => {
        await controllers.fileUpload.postUploadFile(hmppsAuthClient)(req, mockRes)
      })
      it('should return the correct response', () => {
        const expectedResponse: FileUploadResponse = {
          file: {
            id,
            name: originalname,
            size,
          },
          error: {
            message: 'The selected file must be 5mb or under',
          },
        }
        expect(statusSpy).toHaveBeenCalledWith(413)
        expect(jsonSpy).toHaveBeenCalledWith(expectedResponse)
      })
    })
    describe('Uploaded file is valid', () => {
      const mockRes = mockAppResponse()
      const statusSpy = jest.spyOn(mockRes, 'status')
      const jsonSpy = jest.spyOn(mockRes, 'json')
      beforeEach(async () => {
        await controllers.fileUpload.postUploadFile(hmppsAuthClient)(req, mockRes)
      })
      it('should upload the document', () => {
        expect(patchDocumentsSpy).toHaveBeenCalledWith(crn, id, (req.files as Express.Multer.File[])[0])
      })
      it('should return the correct response', () => {
        const expectedResponse: FileUploadResponse = {
          file: {
            id,
            name: originalname,
            size,
          },
          success: {
            messageHtml: originalname,
            messageText: originalname,
          },
        }
        expect(statusSpy).toHaveBeenCalledWith(200)
        expect(jsonSpy).toHaveBeenCalledWith(expectedResponse)
      })
    })
  })
  describe('postDeleteFile', () => {
    const mockRes = mockAppResponse()
    const jsonSpy = jest.spyOn(mockRes, 'json')
    beforeEach(async () => {
      await controllers.fileUpload.postDeleteFile(hmppsAuthClient)(req, mockRes)
    })
    it('should return the correct response', () => {
      expect(jsonSpy).toHaveBeenCalledWith({ success: true })
    })
  })
})
