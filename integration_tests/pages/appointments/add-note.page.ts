import Page from '../page'

export default class AddNotePage extends Page {
  constructor() {
    super('Add a note (optional)')
  }

  getSensitiveInformation = () => {
    return cy.get(`[data-qa="sensitiveInformation"]`)
  }

  getPreviousNotes = () => {
    return cy.get(`[data-qa="previousNotes"]`)
  }

  getCrissButton = () => {
    return cy.get('[data-qa="crissButton"]')
  }

  getNotesTextarea = () => {
    return cy.get('textarea#notes')
  }

  getFilesAdded = () => {
    return cy.get('.moj-multi-file__uploaded-files')
  }

  getFileUploadList = () => {
    return cy.get('.moj-multi-file-upload__list')
  }

  getFileUploadingItem = (index: number, element: 'text' | 'status') => {
    return cy
      .get(
        '.moj-multi-file-upload .moj-multi-file__uploaded-files .moj-multi-file-upload__list .moj-multi-file-upload__row',
      )
      .eq(index)
      .find(`.moj-multi-file-upload__message .moj-multi-file-upload__message-${element}`)
  }

  getFileUploadListItem = (type: 'error' | 'success', element: 'text' | 'status', index: number) => {
    return cy
      .get(
        '.moj-multi-file-upload .moj-multi-file__uploaded-files .moj-multi-file-upload__list .moj-multi-file-upload__row',
      )
      .eq(index)
      .find(
        `.moj-multi-file-upload__message .moj-multi-file-upload__${type} .moj-multi-file-upload__message-${element}`,
      )
  }

  getFileUploadListItemDeleteButton = (index: number) => {
    return cy
      .get(
        '.moj-multi-file-upload .moj-multi-file__uploaded-files .moj-multi-file-upload__list .moj-multi-file-upload__row',
      )
      .eq(index)
      .find('.moj-multi-file-upload__actions button')
  }

  getChooseFilesButton = () => {
    return cy.get('.moj-multi-file-upload__dropzone label[for="file-upload-1"]')
  }
}
