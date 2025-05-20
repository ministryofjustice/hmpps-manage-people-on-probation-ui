import { Document } from '../data/model/documents'

export const highlightText = (text: string, object: Document[]): Document[] => {
  if (!text) {
    return object
  }

  return object.map(doc => {
    return highlightDoc(text, doc)
  })
}

function highlightDoc(text: string, doc: Document): Document {
  let pos = doc.name.toUpperCase().indexOf(text.toUpperCase())
  let filenameHighlighted: string
  if (pos !== -1) {
    const str = doc.name.substring(pos, pos + text.length)
    filenameHighlighted = doc.name.replaceAll(str, `<span class="govuk-tag--yellow">${str}</span>`)
  }

  if (!filenameHighlighted) {
    filenameHighlighted = doc.name
    text.split(/\s+/).forEach(word => {
      pos = filenameHighlighted.toUpperCase().indexOf(word.toUpperCase())
      if (pos !== -1) {
        const str = filenameHighlighted.substring(pos, pos + word.length)
        filenameHighlighted = filenameHighlighted.replaceAll(str, `<span class="govuk-tag--yellow">${str}</span>`)
      }
    })
  }
  if (filenameHighlighted !== doc.name) {
    return {
      ...doc,
      filenameHighlighted,
    }
  }
  return doc
}
