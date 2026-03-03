import { HmppsAuthClient } from '../data'
import { Route } from '../@types'
import MasApiClient from '../data/masApiClient'
import { ProbationPractitioner } from '../models/CaseDetail'


export const isResponsibleOfficer = (hmppsAuthClient: HmppsAuthClient): Route<Promise<boolean>> => {
  return async (req, res) => {
    const { crn } = req.params
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const pp: ProbationPractitioner = await masClient.getProbationPractitioner(crn)
    res.locals.isResponsibleOfficer = pp?.username === res.locals.user.username
    return pp?.username === res.locals.user.username
  }
}
