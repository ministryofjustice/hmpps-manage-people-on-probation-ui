import { Route } from '../../@types'
import { appointmentOutcomesValidation } from '../../properties'
import { urlToRenderPath } from '../../utils/urlToRenderPath'
import { validateWithSpec } from '../../utils/validationUtils'
import { LocalParams } from '../../models/Appointments'

const appointmentOutcomes: Route<void> = (req, res, next) => {
  let errorMessages = res?.locals?.errorMessages || {}
  let render = res?.locals?.renderPath || urlToRenderPath(req, res)
  const { params, body } = req
  const { crn, id, contactId } = params as Record<string, string>
  const baseUrl = req.url.split('?')[0]

  const localParams: LocalParams = {
    crn,
    id,
    body,
    contactId,
  }

  const validateOutcome = (): void => {
    if (!baseUrl.includes(`case/${crn}/record-an-outcome`)) return

    render = 'pages/appointment-outcomes/outcome'

    errorMessages = {
      ...errorMessages,
      ...validateWithSpec(
        req,
        appointmentOutcomesValidation({
          crn,
          id,
          contactId,
          page: 'outcome',
        }),
      ),
    }
  }

  validateOutcome()

  if (Object.keys(errorMessages).length) {
    res.locals.errorMessages = errorMessages
    return res.render(render, { errorMessages, ...localParams })
  }
  return next()
}

export default appointmentOutcomes
