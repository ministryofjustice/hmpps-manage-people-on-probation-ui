import { pipeline } from 'node:stream/promises'
import { MPoPComponents } from '@ministryofjustice/hmpps-mpop-frontend-components-lib'
import { HmppsAuthClient } from '../data'
import { Route } from '../@types'

export const personPhotoHref = (nomsNumber: string) => `/person-photo/${encodeURIComponent(nomsNumber)}`

export const getPersonPhoto = (
  hmppsAuthClient: HmppsAuthClient,
  mpopComponents: MPoPComponents,
): Route<Promise<void>> => {
  return async function getPersonPhotoInner(req, res) {
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const { photo } = await mpopComponents.getPersonPhoto(token, req.params.nomsNumber as string)

    if (!photo) {
      return res.redirect('/assets/images/NoPhoto@2x.png')
    }
    res.set('Cache-Control', 'private, max-age=86400')
    res.removeHeader('pragma')
    res.type('image/jpeg')
    return pipeline(photo, res)
  }
}
