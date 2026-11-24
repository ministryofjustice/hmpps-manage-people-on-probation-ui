import { MPoPComponents, toPersonPhotoSrc } from '@ministryofjustice/hmpps-mpop-frontend-components-lib'
import { AppResponse } from '../models/Locals'
import { PersonalDetailsSession } from '../models/Data'
import { personPhotoHref } from './getPersonPhoto'
import logger from '../../logger'

interface PersonHeaderPhotoOptions {
  res: AppResponse
  mpopComponents: MPoPComponents
  getToken: () => Promise<string>
  crn: string
  noms?: string
  cachedPhotoSrc?: string | null
  cachedDetails?: Partial<PersonalDetailsSession>
}

export interface PersonHeaderPhoto {
  personPhotoSrc?: string
  prisonsUnavailable: boolean
}

const isPersonHeaderPhotoEnabled = (res: AppResponse): boolean =>
  Boolean(res.locals.flags?.enablePersonHeader && res.locals.flags?.enablePersonHeaderPhoto)

const getCheckInPhotoUrl = async ({
  res,
  mpopComponents,
  getToken,
  crn,
}: PersonHeaderPhotoOptions): Promise<string | null> => {
  if (res.locals.checkInPhoto?.crn !== crn) {
    const { photoUrl, error } = await mpopComponents.getCheckInPhotoUrl(await getToken(), crn)
    if (error) {
      logger.error(error, `Failed to get the online check-in photo for CRN ${crn}`)
    }
    res.locals.checkInPhoto = { crn, photoUrl }
  }
  return res.locals.checkInPhoto.photoUrl
}

export const getPersonHeaderPhoto = async (options: PersonHeaderPhotoOptions): Promise<PersonHeaderPhoto> => {
  const { res, mpopComponents, getToken, noms, cachedDetails } = options
  if (!isPersonHeaderPhotoEnabled(res)) {
    return { personPhotoSrc: undefined, prisonsUnavailable: false }
  }

  const checkInPhotoUrl = res.locals.flags?.enableESUPCheckInPhotosForSearch ? await getCheckInPhotoUrl(options) : null

  let prisonPhotoSrc = options.cachedPhotoSrc
  let prisonsUnavailable = false
  if (!checkInPhotoUrl && noms && cachedDetails?.personPhotoSrc === undefined) {
    const { hasPhoto, error } = await mpopComponents.hasPersonPhoto(await getToken(), noms)
    prisonsUnavailable = Boolean(error)
    prisonPhotoSrc = hasPhoto ? personPhotoHref(noms) : null
    if (cachedDetails?.overview && !prisonsUnavailable) {
      cachedDetails.personPhotoSrc = prisonPhotoSrc
    }
  }

  return {
    personPhotoSrc: toPersonPhotoSrc({
      checkInPhotoUrl,
      noms,
      hasPrisonPhoto: Boolean(prisonPhotoSrc),
      prisonPhotoHref: personPhotoHref,
    }),
    prisonsUnavailable,
  }
}
