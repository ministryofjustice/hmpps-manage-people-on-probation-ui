import { ActivityLogFilters, Route } from '../../@types'
import { activityLogValidation } from '../../properties'
import { validateWithSpec } from '../../utils/validationUtils'

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
      req.session.activityLogFilters = req.body as ActivityLogFilters
      req.session.activityLogFilters.compliance = complianceFilters
      const view = req?.query?.view ?? req?.body?.view
      if (view && view !== 'compact') {
        return res.status(404).render('pages/error', { message: 'Page not found' })
      }
      const query = view ? `error=true&view=${view}` : `error=true`
      return res.redirect(`${url}?${query}`)
    }
  }
  return next()
}

export default activityLog
