import { type Controller } from '@ministryofjustice/manage-people-on-probation-shared-lib'

const routes = ['getAccessibility'] as const

const accessibilityController: Controller<typeof routes, void> = {
  getAccessibility: () => {
    return async (_req, res) => res.render('pages/accessibility')
  },
}

export default accessibilityController
