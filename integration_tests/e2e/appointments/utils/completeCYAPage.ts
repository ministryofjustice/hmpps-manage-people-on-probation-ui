import AppointmentCheckYourAnswersPage from '../../../pages/appointments/check-your-answers.page'

export const completeCYAPage = () => {
  const cyaPage = new AppointmentCheckYourAnswersPage()
  cyaPage.getSubmitBtn().click()
}
