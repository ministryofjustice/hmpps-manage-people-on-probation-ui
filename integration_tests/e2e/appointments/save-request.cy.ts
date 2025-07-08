import {
  completeAttendancePage,
  completeCYAPage,
  completeDateTimePage,
  completeLocationPage,
  completeNotePage,
  completeRepeatingPage,
  completeSentencePage,
  completeTypePage,
} from './imports'

import AppointmentConfirmationPage from '../../pages/appointments/confirmation.page'

describe('End-to-end form and save backend request body', () => {
  it('Submits the form and saves request body from backend', () => {
    completeTypePage()
    completeSentencePage()
    completeAttendancePage()
    completeLocationPage()
    completeDateTimePage()
    completeRepeatingPage()
    completeNotePage()
    completeCYAPage()

    // Wait for the backend to receive and send the request
    const confirmPage = new AppointmentConfirmationPage()

    confirmPage.getPanel().should('be.visible')

    // Fetch the backend-saved request body
    cy.request('/case/arrange-appointment/request').then(res => {
      cy.writeFile('cypress/fixtures/saved-request.json', res.body)
    })
  })
})
