import PrisonerSearchApiClient, { Prisoner } from '../data/prisonerSearchApiClient'
import logger from '../../logger'

export function getPersonStatusTag(prisoner: Prisoner): string | undefined {
  if (prisoner?.legalStatus === 'DEAD') {
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

export async function getPrisonerDetails(token: string, nomsNumber: string): Promise<Prisoner | null> {
  const prisonerSearchApiClient = new PrisonerSearchApiClient(token)

  try {
    return await prisonerSearchApiClient.getPrisonerDetails(nomsNumber)
  } catch (e) {
    logger.error(`Failed to get prisoner details for NOMS number: ${nomsNumber}`, e)
    return undefined
  }
}
