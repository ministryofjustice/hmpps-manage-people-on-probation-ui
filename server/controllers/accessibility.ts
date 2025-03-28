import { Controller } from '../@types'

const routes = ['getAccessibility'] as const

const accessibilityController: Controller<typeof routes> = {
  getAccessibility: () => {
    return async (_req, res) => res.render('pages/accessibility')
  },
}

export default accessibilityController
