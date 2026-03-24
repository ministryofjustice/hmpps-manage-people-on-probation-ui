import { Controller } from '../@types'
import sendAuditMessage, { SubjectType } from '../middleware/sendAuditMessage'

const routes = ['getAddContact'] as const

const addContactController: Controller<typeof routes, void> = {
  getAddContact: () => {
    return async (req, res) => {
      const { crn } = req.params
      await sendAuditMessage(res, 'ADD_MAS_CONTACT', crn, SubjectType.CRN)
      return res.render('pages/add-contact', {
        crn,
      })
    }
  },
}

export default addContactController
