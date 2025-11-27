import { unflattenBracketKeys } from '../utils'
import { HmppsAuthClient } from '../data'
import { Route } from '../@types'
import { autoStoreSessionData } from './autoStoreSessionData'

export const autoStoreMultipartFormSessionData = (_hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    // Transform multipart flat body into expected structure
    req.body = unflattenBracketKeys(req.body ?? {})

    return autoStoreSessionData(_hmppsAuthClient)(req, res, next)
  }
}

export default autoStoreMultipartFormSessionData
