import {
  hasRestrictedCustodyStatus,
  isRecalled,
  isUnlawfullyAtLarge,
} from '@ministryofjustice/hmpps-mpop-frontend-components-lib'
import PrisonerSearchApiClient, { Prisoner } from '../data/prisonerSearchApiClient'
import logger from '../../logger'
import { PersonalDetails } from '../data/model/personalDetails'
import { SupervisionPackage } from '../models/SupervisionPackage'

export const PERSON_STATUS_TAGS = {
  DECEASED: 'Deceased',
  IN_CUSTODY: 'In custody',
  RECALLED: 'Recalled',
  RECALLED_IN_CUSTODY: 'In custody - recalled',
  UNLAWFULLY_AT_LARGE: 'Unlawfully at large',
  RECALLED_UNLAWFULLY_AT_LARGE: 'Recalled - Unlawfully at large',
  IN_BREACH: 'In breach',
} as const

export async function getStatusTag(
  personalDetails: PersonalDetails,
  supervisionPackage: SupervisionPackage,
  prisoner?: Prisoner,
): Promise<string | undefined> {
  if (personalDetails?.dateOfDeath !== undefined) {
    return PERSON_STATUS_TAGS.DECEASED
  }

  const statusTagForPersonInCustody = await getStatusTagForPersonInCustody(prisoner)

  if (statusTagForPersonInCustody !== undefined) {
    return statusTagForPersonInCustody
  }
  // determine from community sentence
  if (supervisionPackage?.outcome === 'success') {
    // There will always be one active primary sentence
    const activePrimarySentence = supervisionPackage?.context?.sentences?.find(sentence => sentence.isPrimarySentence)

    if (!activePrimarySentence) {
      return undefined
    }

    if (isUnlawfullyAtLarge(activePrimarySentence)) {
      return PERSON_STATUS_TAGS.UNLAWFULLY_AT_LARGE
    }

    if (activePrimarySentence.inBreach) {
      return PERSON_STATUS_TAGS.IN_BREACH
    }

    if (isRecalled(activePrimarySentence)) {
      return PERSON_STATUS_TAGS.RECALLED
    }

    if (hasRestrictedCustodyStatus(activePrimarySentence)) {
      return PERSON_STATUS_TAGS.IN_CUSTODY
    }
  }
  return undefined
}

export async function getStatusTagForPersonInCustody(prisoner?: Prisoner): Promise<string> {
  if (prisoner?.legalStatus === 'DEAD') {
    return PERSON_STATUS_TAGS.DECEASED
  }

  // Person is not in prison care - let the community logic handle the status
  if (prisoner?.inOutStatus?.includes('INACTIVE')) {
    return undefined
  }

  if (prisoner?.lastMovementReasonCode === 'UAL') {
    return prisoner?.recall ? PERSON_STATUS_TAGS.RECALLED_UNLAWFULLY_AT_LARGE : PERSON_STATUS_TAGS.UNLAWFULLY_AT_LARGE
  }

  if (prisoner?.status === 'ACTIVE IN' || prisoner?.status === 'ACTIVE OUT') {
    return prisoner?.recall ? PERSON_STATUS_TAGS.RECALLED_IN_CUSTODY : PERSON_STATUS_TAGS.IN_CUSTODY
  }

  if (prisoner?.recall) {
    return PERSON_STATUS_TAGS.RECALLED
  }

  return undefined
}

export async function getPrisonerDetails(token: string, nomisNumber: string, crn: string): Promise<Prisoner | null> {
  const prisonerSearchApiClient = new PrisonerSearchApiClient(token)

  try {
    return await prisonerSearchApiClient.getPrisonerDetails(nomisNumber)
  } catch (e) {
    logger.error(`Failed to get prisoner details for NOMS number: ${nomisNumber} CRN: ${crn}`, e)
    return undefined
  }
}
