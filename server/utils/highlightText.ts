import { Document } from '../data/model/documents'

export const highlightText = (text: string, object: Document[]): Document[] => {
  if (!text) {
    return object
  }
  return object.map(doc => {
    const pos = doc.name.toUpperCase().indexOf(text.toUpperCase())
    if (pos === -1) {
      return doc
    }
    const str = doc.name.substring(pos, pos + text.length)
    const filenameHighlighted = doc.name.replace(str, `<span class="govuk-tag--yellow">${str}</span>`)
    return {
      ...doc,
      filenameHighlighted,
    }
  })
}
