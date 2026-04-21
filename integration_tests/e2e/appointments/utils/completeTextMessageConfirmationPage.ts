import TextMessageConfirmationPage from '../../../pages/appointments/text-message-confirmation.page'
import { uuid, crn } from '../imports/common'

export const completeTextMessageConfirmationPage = ({ _crn = null, _uuid = uuid, index = 2 } = {}) => {
  const suffix = index > 1 ? `-${index}` : ''
  const textMessageConfirmPage = new TextMessageConfirmationPage()
  textMessageConfirmPage
    .getSmsOptIn()
    .find(`#appointments-${_crn || crn}-${_uuid}-smsOptIn${suffix}`)
    .click()
  textMessageConfirmPage.getSubmitBtn().click()
}
