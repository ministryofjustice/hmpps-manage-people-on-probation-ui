import { HmppsAuthClient } from '../../data'
import MasApiClient from '../../data/masApiClient'
import { SentenceCompliance } from '../../data/model/compliance'

export const getBreach = async (
  hmppsAuthClient: HmppsAuthClient,
  username: string,
  crn: string,
  selectedSentence: number,
): Promise<SentenceCompliance | null> => {
  if (!Number.isFinite(Number(selectedSentence))) {
    return null
  }

  try {
    const token = await hmppsAuthClient.getSystemClientToken(username)
    const masClient = new MasApiClient(token)
    const [compliance, popSentences] = await Promise.all([
      masClient.getPersonCompliance(crn),
      masClient.getSentences(crn),
    ])

    const sentence = popSentences.sentences.find(({ id }) => String(id) === String(selectedSentence))

    if (!sentence) {
      return null
    }

    return (
      compliance.currentSentences.find(
        currentSentence =>
          currentSentence.activeBreach && String(currentSentence.eventNumber) === String(sentence.eventNumber),
      ) ?? null
    )
  } catch (error) {
    return null
  }
}
