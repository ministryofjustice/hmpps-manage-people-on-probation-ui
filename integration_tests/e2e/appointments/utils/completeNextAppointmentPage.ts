import { AppointmentSessionSelection } from '../../../../server/models/Appointments'
import ArrangeAnotherAppointmentPage from '../../../pages/appointments/arrange-another-appointment.page'
import AppointmentCheckYourAnswersPage from '../../../pages/appointments/check-your-answers.page'
import AppointmentConfirmationPage from '../../../pages/appointments/confirmation.page'
import NextAppointmentPage from '../../../pages/appointments/next-appointment.page'
import { getUuid } from './common'
import { completeAddNotePage } from './completeAddNotePage'
import { completeLocationDateTimePage } from './completeLocationDateTimePage'
import { completeOutcome } from './completeOutcome'
import { completeSentencePage } from './completeSentencePage'
import { completeSupportingInformationPage } from './completeSupportingInformationPage'
import { completeTextMessageConfirmationPage } from './completeTextMessageConfirmationPage'
import { completeTypePage } from './completeTypePage'

export const completeNextAppointmentPage = ({
  value = 'NO',
  dateInPast = true,
  crn = 'X000001',
}: { value?: AppointmentSessionSelection; dateInPast?: boolean; crn?: string } = {}) => {
  const nextAppointmentPage = new NextAppointmentPage()
  let arrangeAnotherAppointmentPage: ArrangeAnotherAppointmentPage
  let checkYourAnswersPage: AppointmentCheckYourAnswersPage
  let confirmationPage: AppointmentConfirmationPage
  cy.get(`input[value=${value}]`).click()
  nextAppointmentPage.getSubmitBtn().click()
  if (['KEEP_TYPE', 'CHANGE_TYPE'].includes(value)) {
    if (value === 'KEEP_TYPE') {
      arrangeAnotherAppointmentPage = new ArrangeAnotherAppointmentPage()
      arrangeAnotherAppointmentPage.getSubmitBtn().click()
    }
    getUuid(2).then(uuid => {
      if (value === 'CHANGE_TYPE') {
        completeSentencePage({ loadPage: false, crnOverride: crn, uuidOverride: uuid })
        completeTypePage()
      }
      if (['KEEP_TYPE', 'CHANGE_TYPE'].includes(value)) {
        completeLocationDateTimePage({ dateInPast, crnOverride: crn, uuidOveride: uuid })
      }
      if (!dateInPast) {
        completeTextMessageConfirmationPage({ _crn: crn, _uuid: uuid, index: 1 })
        completeSupportingInformationPage({ crnOverride: crn, uuidOveride: uuid })
      } else {
        completeOutcome()
        completeAddNotePage({ crnOverride: crn, idOverride: uuid })
      }
    })
    checkYourAnswersPage = new AppointmentCheckYourAnswersPage()
    checkYourAnswersPage.getSubmitBtn().click()
    confirmationPage = new AppointmentConfirmationPage()
    confirmationPage.getSubmitBtn().click()
  }
}
