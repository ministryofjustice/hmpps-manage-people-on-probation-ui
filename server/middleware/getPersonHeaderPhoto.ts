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
  cachedDetails?: Partial<PersonalDetailsSession>
}

export interface PersonHeaderPhoto {
  personPhotoSrc?: string
  photoUnavailable: boolean
}

const isPersonHeaderPhotoEnabled = (res: AppResponse): boolean =>
  Boolean(res.locals.flags?.enablePersonHeader && res.locals.flags?.enablePersonHeaderPhoto)

const getCheckInPhoto = async ({
  res,
  mpopComponents,
  getToken,
  crn,
}: PersonHeaderPhotoOptions): Promise<{ photoUrl: string | null; failed: boolean }> => {
  if (res.locals.checkInPhoto?.crn !== crn) {
    const { photoUrl, error } = await mpopComponents.getCheckInPhotoUrl(await getToken(), crn)
    if (error) {
      logger.error(error, `Failed to get the online check-in photo for CRN ${crn}`)
    }
    res.locals.checkInPhoto = { crn, photoUrl, failed: Boolean(error) }
  }
  return res.locals.checkInPhoto
}

export const getPersonHeaderPhoto = async (options: PersonHeaderPhotoOptions): Promise<PersonHeaderPhoto> => {
  const { res, mpopComponents, getToken, noms, cachedDetails } = options
  if (!isPersonHeaderPhotoEnabled(res)) {
    return { personPhotoSrc: undefined, photoUnavailable: false }
  }

  const checkInPhoto = res.locals.flags?.enableESUPCheckInPhotosForSearch
    ? await getCheckInPhoto(options)
    : { photoUrl: null, failed: false }

  let hasPrisonPhoto = Boolean(cachedDetails?.personPhotoSrc)
  let prisonPhotoFailed = false
  if (!checkInPhoto.photoUrl && noms && cachedDetails?.personPhotoSrc === undefined) {
    const { hasPhoto, error } = await mpopComponents.hasPersonPhoto(await getToken(), noms)
    hasPrisonPhoto = hasPhoto
    prisonPhotoFailed = Boolean(error)
    if (cachedDetails?.overview && !prisonPhotoFailed) {
      cachedDetails.personPhotoSrc = hasPhoto ? personPhotoHref(noms) : null
    }
  }

  const personPhotoSrc = toPersonPhotoSrc({
    checkInPhotoUrl: checkInPhoto.photoUrl,
    noms,
    hasPrisonPhoto,
    prisonPhotoHref: personPhotoHref,
  })

  return {
    personPhotoSrc,
    photoUnavailable: !personPhotoSrc && (checkInPhoto.failed || prisonPhotoFailed),
  }
}
