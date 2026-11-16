import PrisonerSearchApiClient, { Prisoner } from '../data/prisonerSearchApiClient'
import logger from '../../logger'

export {
  getStatusTag,
  getStatusTagForPersonInCustody,
  PERSON_STATUS_TAGS,
} from '@ministryofjustice/hmpps-mpop-frontend-components-lib'

export async function getPrisonerDetails(token: string, nomisNumber: string, crn: string): Promise<Prisoner | null> {
  const prisonerSearchApiClient = new PrisonerSearchApiClient(token)

  try {
    return await prisonerSearchApiClient.getPrisonerDetails(nomisNumber)
  } catch (e) {
    logger.error(`Failed to get prisoner details for NOMS number: ${nomisNumber} CRN: ${crn}`, e)
    return undefined
  }
}
