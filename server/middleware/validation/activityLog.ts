import { ActivityLogFilters, Route } from '../../@types'
import { activityLogValidation } from '../../properties'
import { validateWithSpec } from '../../utils/validationUtils'
import { renderError } from '../renderError'

const activityLog: Route<void> = (req, res, next): void => {
  let errorMessages: Record<string, string> = {}
  const { url } = req
  if (Object.keys(req.query).length === 0 && req.method === 'GET') {
    delete req.session.errorMessages
  }
  if (req.method === 'POST') {
    if (req?.session?.errorMessages) {
      delete req.session.errorMessages
    }

    const dateToIsEmpty =
      !req?.body?.dateTo || req?.body?.dateTo === undefined || (req?.body?.dateTo && req.body.dateTo.trim() === '')
    const dateFromIsEmpty =
      !req?.body?.dateFrom ||
      req?.body?.dateFrom === undefined ||
      (req?.body?.dateFrom && req.body.dateFrom.trim() === '')
    errorMessages = validateWithSpec(req.body, activityLogValidation(dateToIsEmpty, dateFromIsEmpty))

    if (Object.keys(errorMessages).length) {
      req.session.errorMessages = errorMessages
      const complianceFilters: Array<string> = req.body.compliance ? [req.body.compliance].flat() : []
      req.session.activityLogFilters = req.body as ActivityLogFilters
      req.session.activityLogFilters.compliance = complianceFilters
      const view = req?.query?.view || req?.body?.view
      if (view && view !== 'compact') {
        return renderError(404)(req, res)
      }
      const query = `error=true${view ? `&view=${view}` : ''}`
      return res.redirect(`${url}?${query}`)
    }
  }
  return next()
}

export default activityLog
