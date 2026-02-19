import { NextFunction, Request } from 'express'
import { AppResponse } from '../models/Locals'
import { FileCache } from '../@types'

export const cacheUploadedFiles = (req: Request, res: AppResponse, next: NextFunction): void => {
  const raw = req.body
  const enableDelete = res?.locals?.flags?.enableDeleteAppointmentFile === true
  let filesAdded = []
  if (raw?.filesAdded_filename) {
    if (Array.isArray(raw.filesAdded_filename)) {
      filesAdded = raw.filesAdded_filename.map((filename: string, i: number) => ({
        filename,
        message: raw.filesAdded_message[i],
        error: raw.filesAdded_error[i] === 'true',
      }))
    } else {
      filesAdded = [
        { filename: raw.filesAdded_filename, message: raw.filesAdded_message, error: raw.filesAdded_error === 'true' },
      ]
    }
  }
  const { contactId: id } = req.params as Record<string, string>
  const uploadedFiles: FileCache[] = []

  for (const file of filesAdded) {
    const { filename, message } = file
    const fileCache: FileCache = {
      id,
      fileName: filename,
      originalName: filename,
      deleteButton: { text: 'Delete' },
    }
    if (file.error) {
      fileCache.message = {
        html: `<span class="moj-multi-file-upload__error"><span class="moj-multi-file-upload__message-text moj-multi-file-upload__message-text--with-icon"><svg class="moj-banner__icon" fill="currentColor" role="presentation" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25" height="25" width="25"><path d="M13.6,15.4h-2.3v-4.5h2.3V15.4z M13.6,19.8h-2.3v-2.2h2.3V19.8z M0,23.2h25L12.5,2L0,23.2z"></path></svg>${message}</span><strong class="moj-multi-file-upload__message-status${!enableDelete ? ' moj-multi-file-upload__message-status--no-margin' : ''}"><string class="govuk-tag govuk-tag--red">Upload failed</string></strong></span>
         <input type="hidden" name="filesAdded_filename" value="${filename}">
        <input type="hidden" name="filesAdded_message" value="${message}">
        <input type="hidden" name="filesAdded_error" value="true">
        `,
      }
    } else {
      fileCache.message = {
        html: `<span class="moj-multi-file-upload__success"><span class="moj-multi-file-upload__message-text moj-multi-file-upload__message-text--with-icon"><svg class="moj-banner__icon" fill="currentColor" role="presentation" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25" height="25" width="25"><path d="M25,6.2L8.7,23.2L0,14.1l4-4.2l4.7,4.9L21,2L25,6.2z"></path></svg>${filename}</span><strong class="moj-multi-file-upload__message-status${!enableDelete ? ' moj-multi-file-upload__message-status--no-margin' : ''}"><string class="govuk-tag govuk-tag--grey">Uploaded</string></strong></span>
        <input type="hidden" name="filesAdded_filename" value="${filename}">
        <input type="hidden" name="filesAdded_message" value="">
        <input type="hidden" name="filesAdded_error" value="false">
        `,
      }
    }
    uploadedFiles.push(fileCache)
  }
  req.session.cache = {
    ...(req?.session?.cache ?? {}),
    uploadedFiles,
  }
  return next()
}
