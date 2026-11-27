import { MPoPComponents } from '@ministryofjustice/hmpps-mpop-frontend-components-lib'
import { HmppsAuthClient } from '../data'
import { Route } from '../@types'

export const getPersonPhoto = (
  hmppsAuthClient: HmppsAuthClient,
  mpopComponents: MPoPComponents,
): Route<Promise<void>> => {
  return async function getPersonPhotoInner(req, res) {
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    await mpopComponents.sendPersonPhoto(token, req.params.nomsNumber as string, res)
  }
}
