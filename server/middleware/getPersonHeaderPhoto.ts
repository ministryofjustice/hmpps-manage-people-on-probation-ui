import { MPoPComponents } from '@ministryofjustice/hmpps-mpop-frontend-components-lib'
import { AppResponse } from '../models/Locals'
import { PersonalDetailsSession } from '../models/Data'
import { personPhotoHref } from './getPersonPhoto'

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

export const getPersonHeaderPhoto = async (options: PersonHeaderPhotoOptions): Promise<PersonHeaderPhoto> => {
  const { res, mpopComponents, getToken, crn, noms, cachedDetails } = options
  const { flags } = res.locals
  if (!flags?.enablePersonHeader || !flags?.enablePersonHeaderPhoto) {
    return { personPhotoSrc: undefined, photoUnavailable: false }
  }

  const cachedPhotoSrc = cachedDetails?.personPhotoSrc
  const { photo, photoUnavailable, checkInPhoto, hasPrisonPhoto } = await mpopComponents.getPersonHeaderPhoto(
    await getToken(),
    {
      crn,
      noms,
      prisonPhotoHref: personPhotoHref,
      includeCheckInPhoto: Boolean(flags.enableESUPCheckInPhotosForSearch),
      checkInPhoto: res.locals.checkInPhoto?.crn === crn ? res.locals.checkInPhoto : undefined,
      hasPrisonPhoto: cachedPhotoSrc === undefined ? undefined : Boolean(cachedPhotoSrc),
    },
  )

  if (checkInPhoto) {
    res.locals.checkInPhoto = { crn, ...checkInPhoto }
  }
  if (hasPrisonPhoto !== undefined && cachedDetails?.overview) {
    cachedDetails.personPhotoSrc = hasPrisonPhoto ? personPhotoHref(noms) : null
  }

  return { personPhotoSrc: photo, photoUnavailable }
}
