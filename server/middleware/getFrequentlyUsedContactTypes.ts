import { Request } from 'express'
import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { AppResponse } from '../models/Locals'
import { ContactType } from '../data/model/contacts'

const ALLOWED_FREQUENT_CODES = ['CM3A', 'CM3B', 'CMOA', 'CMOB', 'C326', 'C204', 'CT3A', 'CT3B', 'CTOA', 'CTOB']

/**
 * Middleware function to fetch frequent contact types from MasApiClient.
 * This version filters and orders the contact types to match the UI design exactly.
 */
export const getFrequentContactTypes = async (
  req: Request,
  res: AppResponse,
  hmppsAuthClient: HmppsAuthClient,
): Promise<ContactType[]> => {
  const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
  const masClient = new MasApiClient(token)
  const response = await masClient.getFrequentContactTypes()
  const allContactTypes: ContactType[] = Array.isArray(response) ? response : (response as any)?.contactTypes || []

  /**
   * Instead of a simple filter, we map over our ordered ALLOWED_FREQUENT_CODES array.
   * This guarantees the output array follows the sequence defined in ALLOWED_FREQUENT_CODES.
   */
  return ALLOWED_FREQUENT_CODES.map(code => allContactTypes.find(contact => contact.code === code)).filter(
    contact => contact !== undefined,
  ) as ContactType[]
}
