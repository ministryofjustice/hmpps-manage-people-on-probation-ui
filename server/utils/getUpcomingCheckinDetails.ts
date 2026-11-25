import ESupervisionClient from '../data/eSupervisionClient'
import { EsupervisionUpcomingQuestionsResponse, OffenderStatus } from '../data/model/esupervision'
import logger from '../../logger'

export const getUpcomingCheckinDetails = async (
  token: string,
  crn: string,
  checkinStatus?: OffenderStatus | null,
): Promise<EsupervisionUpcomingQuestionsResponse | null> => {
  if (checkinStatus !== 'VERIFIED') {
    return null
  }
  try {
    const eSupervisionClient = new ESupervisionClient(token)
    const response = await eSupervisionClient.getUpcomingCheckinQuestions(crn, 'en-GB')
    return response || null
  } catch {
    logger.info(`No upcoming check in found for CRN ${crn}`)
    return null
  }
}
