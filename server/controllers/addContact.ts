import { Controller } from '../@types'

const routes = ['getAddContact', 'postAddContact'] as const

const addContactController: Controller<typeof routes, void> = {
  getAddContact: () => {
    return async (req, res) => {
      const { crn } = req.params
      return res.render('pages/contact-log/contact/contact', { crn, formValues: {} })
    }
  },
  postAddContact: () => {
    return async (req, res) => {
      const { crn } = req.params
      // TODO: Call API endpoint when available
      return res.redirect(`/case/${crn}/contact-log`)
    }
  },
}

export default addContactController
