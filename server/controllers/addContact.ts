import { Controller } from '../@types'

const routes = ['getAddContact'] as const

const addContactController: Controller<typeof routes, void> = {
  getAddContact: () => {
    return async (req, res) => {
      const { crn } = req.params as Record<string, string>
      return res.render('pages/add-contact', {
        crn,
      })
    }
  },
}

export default addContactController
