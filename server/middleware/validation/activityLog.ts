import { ActivityLogFilters } from '../../models/ActivityLog'
import { activityLogValidation } from '../../properties'
import { validateWithSpec } from '../../utils/validationUtils'
import { renderError } from '../renderError'
import { Route } from '../../@types'

const activityLog: Route<void> = (req, res, next): void => {
  let errorMessages: Record<string, string> = {}
  const { url } = req
  if (Object.keys(req.query).length === 0 && req.method === 'GET') {
    delete req.session.errorMessages
  }
  function isEmpty(str: string): boolean {
    return !str || (str && str.trim() === '')
  }
  function clearSession() {
    if (req?.session?.errorMessages) {
      delete req.session.errorMessages
    }
  }

  if (req.method === 'POST') {
    clearSession()
    const dateToIsEmpty = isEmpty(req?.body?.dateTo)
    const dateFromIsEmpty = isEmpty(req?.body?.dateFrom)
    errorMessages = validateWithSpec(req.body, activityLogValidation(dateToIsEmpty, dateFromIsEmpty))

    if (Object.keys(errorMessages).length) {
      req.session.errorMessages = errorMessages
      const complianceFilters: Array<string> = req.body.compliance ? [req.body.compliance].flat() : []
      const categoryFilters: Array<string> = req.body.category ? [req.body.category].flat() : []
      const hideContactFilters: Array<string> = req.body.category ? [req.body.hideContact].flat() : []
      req.session.activityLogFilters = req.body as ActivityLogFilters
      req.session.activityLogFilters.compliance = complianceFilters
      req.session.activityLogFilters.category = categoryFilters
      req.session.activityLogFilters.hideContact = hideContactFilters
      const view = req?.query?.view ?? req?.body?.view
      if (view && view !== 'compact') {
        return renderError(404)(req, res)
      }
      const query = view ? `error=true&view=${view}` : `error=true`
      return res.redirect(`${url}?${query}`)
    }
  }
  return next()
}

export default activityLog
