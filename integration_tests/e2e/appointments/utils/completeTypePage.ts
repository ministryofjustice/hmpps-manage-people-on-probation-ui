import AppointmentTypePage from '../../../pages/appointments/type.page'

export const completeTypePage = (index = 1, hasVisor = false) => {
  const typePage = new AppointmentTypePage()
  typePage.getRadio('type', index).click()
  if (hasVisor) {
    typePage.getRadio('visorReport', index).click()
  }
  typePage.getSubmitBtn().click()
}
