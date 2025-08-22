import { Sentences } from '../data/model/sentenceDetails'

export const getSentenceId = (eventNumber: string, sentences: Sentences): string => {
  let eventId = ''
  for (const sentence of sentences.sentences) {
    if (eventNumber === sentence.eventNumber) {
      eventId = sentence.id.toString()
      return eventId
    }
  }
  return eventId
}
