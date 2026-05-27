export const crn = 'X778160'
export const appointmentId = '6'

export const loadPage = () => {
  cy.visit(`/case/${crn}/appointments/appointment/${appointmentId}/manage`, { failOnStatusCode: false })
}
