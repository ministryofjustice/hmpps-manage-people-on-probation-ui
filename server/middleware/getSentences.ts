import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import { Sentence, Sentences } from '../data/model/sentenceDetails'

export const getSentences = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void | null>> => {
  return async (req, res, next) => {
    const number = (req?.query?.number as string) || ''
    const { crn } = req.params as Record<string, string>
    let sentences: Sentence[]
    if (!req?.session?.data?.sentences?.[crn]) {
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const includeRarRequirements = false
      const response = (await masClient.getSentences(crn, number, includeRarRequirements)) as Sentences
      sentences = response.sentences
      req.session.data = {
        ...(req?.session?.data ?? {}),
        sentences: {
          ...(req?.session?.data?.sentences ?? {}),
          [crn]: response.sentences,
        },
      }
    } else {
      sentences = req.session.data.sentences[crn]
    }
    res.locals.sentences = sentences
    if (next) {
      return next()
    }
    return null
  }
}
