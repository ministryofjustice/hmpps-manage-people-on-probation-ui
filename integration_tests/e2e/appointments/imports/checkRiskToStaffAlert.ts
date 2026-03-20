export const checkRiskToStaffAlert = (_crn = 'X778160', name = 'Alton', riskLevel = 'very high') => {
  cy.get('[data-qa=riskToStaffAlert]').should('be.visible')
  cy.get('[data-qa=riskToStaffAlert]').find('h2').should('contain.text', `${name} may be a risk to probation staff`)
  cy.get('[data-qa=riskToStaffAlert]')
    .find('a')
    .should('contain.text', `View ${name}'s ${riskLevel} risk to staff flag`)
    .should('have.attr', 'href', `/case/${_crn}/risk/flag/1`)
}
