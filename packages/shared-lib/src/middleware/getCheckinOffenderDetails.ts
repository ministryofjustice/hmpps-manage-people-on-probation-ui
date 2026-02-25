import { HmppsAuthClient } from '../data'
import { Route } from '../types/Route'
import ESupervisionClient from '../data/eSupervisionClient'

export const getCheckinOffenderDetails = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res) => {
    const { crn } = req.params as Record<string, string>
    const enableESuperVision = res.locals?.flags?.enableESuperVision ?? false
    if (enableESuperVision) {
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const eSupervisionClient = new ESupervisionClient(token)
      res.locals.offenderCheckinsByCRNResponse = await eSupervisionClient.getOffenderCheckinsByCRN(crn)
    }
  }
}
