import { HmppsAuthClient } from '../data'
import { Route } from '../@types'
import ESupervisionClient from '../data/eSupervisionClient'

export const getCheckinOffenderDetails = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { crn } = req.params
    const enableESuperVision = res.locals?.flags?.enableESuperVision ?? false
    if (enableESuperVision) {
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const eSupervisionClient = new ESupervisionClient(token)
      res.locals.offenderCheckinsByCRNResponse = await eSupervisionClient.getOffenderCheckinsByCRN(crn)
    }
  }
}
