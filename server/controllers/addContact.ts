import { Controller } from '../@types'
import sendAuditMessage, { SubjectType } from '../middleware/sendAuditMessage'

const addContactController: Controller<readonly ['getAddContact'], void> = {
  getAddContact: () => {
    return async function getAddContact(req, res) {
      const { crn } = req.params as Record<string, string>
      await sendAuditMessage(res, 'ADD_MAS_CONTACT', crn, SubjectType.CRN)
      return res.render('pages/add-contact', {
        crn,
      })
    }
  },
}

export default addContactController
