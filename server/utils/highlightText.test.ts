import { Document } from '../data/model/documents'
import { highlightText } from './highlightText'

describe('utils/highlightText', () => {
  const doc: Document = {
    name: 'test',
    alfrescoId: '1',
    docLevel: '1',
    tableName: 'tableName',
    createdAt: '2025/01/01',
    lastUpdatedAt: '2025/01/01',
    author: 'Test',
    description: 'Test',
  }
  const docs = [
    { ...doc, name: 'Hello World' },
    { ...doc, name: 'Hi world there' },
    { ...doc, name: 'The world is round' },
    { ...doc, name: 'Very worldly' },
  ]
  const expected = [
    { ...doc, name: 'Hello World', filenameHighlighted: 'Hello <span class="govuk-tag--yellow">World</span>' },
    {
      ...doc,
      name: 'Hi world there',
      filenameHighlighted:
        '<span class="govuk-tag--yellow">Hi</span> <span class="govuk-tag--yellow">world</span> <span class="govuk-tag--yellow">there</span>',
    },
    {
      ...doc,
      name: 'The world is round',
      filenameHighlighted: 'The <span class="govuk-tag--yellow">world</span> is round',
    },
    { ...doc, name: 'Very worldly', filenameHighlighted: 'Very <span class="govuk-tag--yellow">world</span>ly' },
  ]

  it('should highlight the word in the filename within the list of documents', () => {
    expect(highlightText('hi there world', docs)).toEqual(expected)
  })
  it('should return the original list if text is not defined ', () => {
    expect(highlightText(undefined, docs)).toEqual(docs)
  })
  it('should return the original list if text is null', () => {
    expect(highlightText(null, docs)).toEqual(docs)
  })
  it('should return the original list if text is empty', () => {
    expect(highlightText('', docs)).toEqual(docs)
  })
  it('should return the original list if text is not found', () => {
    expect(highlightText('not', docs)).toEqual(docs)
  })
})
