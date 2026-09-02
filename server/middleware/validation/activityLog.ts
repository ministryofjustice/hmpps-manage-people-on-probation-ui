import { ActivityLogFilters } from '../../models/ActivityLog'
import { activityLogValidation } from '../../properties'
import { validateWithSpec } from '../../utils/validationUtils'
import { renderError } from '../renderError'
import { Route } from '../../@types'

const activityLog: Route<void> = (req, res, next): void => {
  let errorMessages: Record<string, string> = {}
  const { path } = req
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

  if (req.query?.submit && !req?.query?.error) {
    clearSession()
    const dateToIsEmpty = isEmpty(req?.query?.dateTo as string)
    const dateFromIsEmpty = isEmpty(req?.query?.dateFrom as string)
    errorMessages = validateWithSpec(
      { ...req, body: req.query } as typeof req,
      activityLogValidation(dateToIsEmpty, dateFromIsEmpty),
    )

    if (Object.keys(errorMessages).length) {
      req.session.errorMessages = errorMessages
      const complianceFilters: Array<string> = req.query.compliance ? ([req.query.compliance].flat() as string[]) : []
      const categoryFilters: Array<string> = req.query.category ? ([req.query.category].flat() as string[]) : []
      const hideContactFilters: Array<string> = req.query.hideContact
        ? ([req.query.hideContact].flat() as string[])
        : []
      req.session.activityLogFilters = {
        keywords: (req.query.keywords as string) ?? '',
        dateFrom: (req.query.dateFrom as string) ?? '',
        dateTo: (req.query.dateTo as string) ?? '',
        compliance: complianceFilters,
        category: categoryFilters,
        sparks: req.query.sparks ? ([req.query.sparks].flat() as string[]) : [],
        supervisionPackage: req.query.supervisionPackage ? ([req.query.supervisionPackage].flat() as string[]) : [],
        supervisionPackageAppointments: req.query.supervisionPackageAppointments
          ? ([req.query.supervisionPackageAppointments].flat() as string[])
          : [],
        hideContact: hideContactFilters,
        crn: req.params?.crn as string,
      }
      const view = req?.query?.view
      if (view && view !== 'compact') {
        return renderError(404)(req, res)
      }
      const query = view ? `error=true&view=${view}` : `error=true`
      return res.redirect(`${path}?${query}`)
    }
  }
  return next()
}

export default activityLog
