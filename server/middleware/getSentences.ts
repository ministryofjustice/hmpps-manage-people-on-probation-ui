import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import { Sentences } from '../data/model/sentenceDetails'

export const getSentences = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async function getSentencesInner(req, res, next) {
    const number = (req?.query?.number as string) || ''
    const { crn } = req.params as Record<string, string>
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const includeRarRequirements = false
    const response: Sentences = await masClient.getSentences(crn, number, includeRarRequirements)
    const { sentences } = response
    req.session.data = {
      ...(req?.session?.data ?? {}),
      sentences: {
        ...(req?.session?.data?.sentences ?? {}),
        [crn]: response.sentences,
      },
    }
    res.locals.sentences = sentences
    return next()
  }
}
