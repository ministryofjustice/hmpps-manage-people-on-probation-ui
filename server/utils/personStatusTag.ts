import PrisonerSearchApiClient, { Prisoner } from '../data/prisonerSearchApiClient'
import logger from '../../logger'
import { PersonalDetails } from '../data/model/personalDetails'
import { SupervisionPackage } from '../models/SupervisionPackage'

export async function getStatusTag(
  token: string,
  personalDetails: PersonalDetails,
  supervisionPackage: SupervisionPackage,
): Promise<string | undefined> {
  if (supervisionPackage?.outcome === 'success') {
    const activePrimarySentences = supervisionPackage?.context?.sentences?.filter(
      sentence => sentence.isPrimarySentence,
    )

    // custodial sentence
    if (activePrimarySentences?.filter(sentence => sentence.type.isCustodial)?.length) {
      const status = await getStatusTagForPersonInCustody(token, personalDetails)
      // As this is a custodial sentence, we can assume that the person is in custody
      return status === undefined ? 'In custody' : status
    }
    // check for breach in community sentence
    const inBreach = activePrimarySentences?.filter(sentence => sentence.inBreach)?.length > 0
    if (inBreach) {
      return 'In breach'
    }
  }
  return undefined
}

export async function getStatusTagForPersonInCustody(token: string, personalDetails: PersonalDetails): Promise<string> {
  const prisoner = await getPrisonerDetails(token, personalDetails.noms, personalDetails.crn)
  return prisoner ? determinePersonStatusTag(prisoner, personalDetails) : undefined
}

export function determinePersonStatusTag(prisoner: Prisoner, personalDetails: PersonalDetails): string | undefined {
  if (prisoner?.legalStatus === 'DEAD' || personalDetails?.dateOfDeath !== undefined) {
    return 'Deceased'
  }

  if (prisoner?.lastMovementReasonCode === 'UAL') {
    return prisoner?.recall ? 'Recalled - Unlawfully at large' : 'Unlawfully at large'
  }

  if (prisoner?.status === 'ACTIVE IN' || prisoner?.status === 'ACTIVE OUT') {
    return prisoner?.recall ? 'Recalled - In custody' : 'In custody'
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
