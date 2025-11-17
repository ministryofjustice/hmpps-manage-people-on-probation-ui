import { Controller } from '../@types'
import { isValidCrn } from '../utils'
import { renderError } from '../middleware'

const routes = ['getIntroPage'] as const

const checkInsController: Controller<typeof routes, void> = {
  getIntroPage: hmppsAuthClient => {
    return async (req, res) => {
      const { crn } = req.params
      if (!isValidCrn(crn)) {
        return renderError(404)(req, res)
      }
      return res.render('pages/check-in/instructions.njk', { crn })
    }
  },
}

export default checkInsController
