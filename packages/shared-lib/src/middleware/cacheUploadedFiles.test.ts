/* eslint-disable import/first */

jest.mock('../config', () => ({
  getConfig: jest.fn(),
}))

jest.mock('../logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}))

jest.mock('uuid', () => ({
  v4: jest.fn(),
}))

import httpMocks from 'node-mocks-http'
import { cacheUploadedFiles } from '.'
import { AppResponse } from '../models/Locals'
import { getConfig } from '../config'

const mockConfig: any = {
  apis: {
    masApi: {
      url: 'https://mas-api-dummy-url',
      timeout: {
        response: 10000,
        deadline: 10000,
      },
      agent: {},
    },
  },
}

const mockGetConfig = getConfig as jest.MockedFunction<typeof getConfig>

describe('middleware/cacheUploadedFiles', () => {
  const nextSpy = jest.fn()
  beforeEach(() => {
    jest.clearAllMocks()
  })
  describe('multiple files added', () => {
    const fileName1 = 'mock-file-1.pdf'
    const fileName2 = 'mock-file-2.png'
    const errorMessage = 'File type needs to be pdf or word'
    const mockReq = httpMocks.createRequest({
      body: {
        filesAdded_filename: [fileName1, fileName2],
        filesAdded_message: ['', errorMessage],
        filesAdded_error: ['false', 'true'],
      },
      params: {
        contactId: '6',
      },
      session: {
        cache: {
          activityLog: [],
        },
      },
    })
    const mockRes = {
      locals: {
        flags: {
          enableDeleteAppointmentFile: true,
        },
      },
    } as unknown as AppResponse
    beforeEach(() => {
      mockGetConfig.mockReturnValue(mockConfig)
      cacheUploadedFiles(mockReq, mockRes, nextSpy)
    })
    it('should add the uploadedFiles cache to the session', () => {
      expect(mockReq.session.cache).toEqual({
        activityLog: [],
        uploadedFiles: [
          {
            id: '6',
            fileName: fileName1,
            originalName: fileName1,
            deleteButton: {
              text: 'Delete',
            },
            message: {
              html: `<span class="moj-multi-file-upload__success"><span class="moj-multi-file-upload__message-text moj-multi-file-upload__message-text--with-icon"><svg class="moj-banner__icon" fill="currentColor" role="presentation" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25" height="25" width="25"><path d="M25,6.2L8.7,23.2L0,14.1l4-4.2l4.7,4.9L21,2L25,6.2z"></path></svg>${fileName1}</span><strong class="moj-multi-file-upload__message-status"><string class="govuk-tag govuk-tag--grey">Uploaded</string></strong></span>
        <input type="hidden" name="filesAdded_filename" value="${fileName1}">
        <input type="hidden" name="filesAdded_message" value="">
        <input type="hidden" name="filesAdded_error" value="false">
        `,
            },
          },
          {
            id: '6',
            fileName: fileName2,
            originalName: fileName2,
            deleteButton: {
              text: 'Delete',
            },
            message: {
              html: `<span class="moj-multi-file-upload__error"><span class="moj-multi-file-upload__message-text moj-multi-file-upload__message-text--with-icon"><svg class="moj-banner__icon" fill="currentColor" role="presentation" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25" height="25" width="25"><path d="M13.6,15.4h-2.3v-4.5h2.3V15.4z M13.6,19.8h-2.3v-2.2h2.3V19.8z M0,23.2h25L12.5,2L0,23.2z"></path></svg>File type needs to be pdf or word</span><strong class="moj-multi-file-upload__message-status"><string class="govuk-tag govuk-tag--red">Upload failed</string></strong></span>
         <input type="hidden" name="filesAdded_filename" value="${fileName2}">
        <input type="hidden" name="filesAdded_message" value="${errorMessage}">
        <input type="hidden" name="filesAdded_error" value="true">
        `,
            },
          },
        ],
      })
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('single file added', () => {
    const fileName = 'mock-file.pdf'
    const mockReq = httpMocks.createRequest({
      body: {
        filesAdded_filename: fileName,
        filesAdded_message: '',
        filesAdded_error: 'false',
      },
      params: {
        contactId: '6',
      },
      session: {
        cache: {
          activityLog: [],
        },
      },
    })
    const mockRes = {
      locals: {
        flags: {
          enableDeleteAppointmentFile: false,
        },
      },
    } as unknown as AppResponse
    beforeEach(() => {
      mockGetConfig.mockReturnValue(mockConfig)
      cacheUploadedFiles(mockReq, mockRes, nextSpy)
    })
    it('should add the uploadedFiles cache to the session', () => {
      expect(mockReq.session.cache).toEqual({
        activityLog: [],
        uploadedFiles: [
          {
            id: '6',
            fileName,
            originalName: fileName,
            deleteButton: {
              text: 'Delete',
            },
            message: {
              html: `<span class="moj-multi-file-upload__success"><span class="moj-multi-file-upload__message-text moj-multi-file-upload__message-text--with-icon"><svg class="moj-banner__icon" fill="currentColor" role="presentation" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25" height="25" width="25"><path d="M25,6.2L8.7,23.2L0,14.1l4-4.2l4.7,4.9L21,2L25,6.2z"></path></svg>${fileName}</span><strong class="moj-multi-file-upload__message-status moj-multi-file-upload__message-status--no-margin"><string class="govuk-tag govuk-tag--grey">Uploaded</string></strong></span>
        <input type="hidden" name="filesAdded_filename" value="${fileName}">
        <input type="hidden" name="filesAdded_message" value="">
        <input type="hidden" name="filesAdded_error" value="false">
        `,
            },
          },
        ],
      })
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })
})
