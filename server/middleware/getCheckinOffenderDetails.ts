import { HmppsAuthClient } from '../data'
import { Route } from '../@types'

import ESupervisionClient from '../data/eSupervisionClient'
import { OffenderCheckinsByCRNResponse } from '../data/model/esupervision'

export const getCheckinOffenderDetails = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { crn } = req.params
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const eSupervisionClient = new ESupervisionClient(token)
    const offenderCheckinsByCRNResponse: OffenderCheckinsByCRNResponse =
      await eSupervisionClient.getOffenderCheckinsByCRN(crn)
    if (offenderCheckinsByCRNResponse?.status === 'VERIFIED') {
      res.locals.offenderCheckinsByCRNResponse = offenderCheckinsByCRNResponse
    }
    return next()
  }
}
