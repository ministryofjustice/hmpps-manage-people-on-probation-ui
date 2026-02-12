import { Controller } from '../@types'

const routes = ['getAddContact'] as const

const addContactController: Controller<typeof routes, void> = {
  getAddContact: () => {
    return async (req, res) => {
      const { crn } = req.params
      return res.render('pages/contact-log/contact/contact', {
        crn,
      })
    }
  },
}

export default addContactController
