import { riskLevelLabel } from '../../../../server/utils'

export const checkRiskToStaffAlert = (
  _crn = 'X778160',
  name = 'Alton',
  riskLevel?: string,
  probationStaff?: boolean,
) => {
  cy.get('[data-qa=riskToStaffAlert]').should('be.visible')
  if (!probationStaff) {
    cy.get('[data-qa=riskToStaffAlert]').find('h2').should('contain.text', `${name} may be a risk to probation staff`)
  } else {
    cy.get('[data-qa=riskToStaffAlert]').find('h2').should('contain.text', `${name} is a risk to probation staff`)
    cy.get('[data-qa=riskToStaffAlert]')
      .find('a')
      .eq(0)
      .should('contain.text', `View ${name}'s risk to probation staff flag`)
      .should('have.attr', 'href')
      .and('match', new RegExp(`/case/${_crn}/risk/flag/`))
  }
  if (riskLevel) {
    cy.get('[data-qa=riskToStaffAlert]')
      .find('a')
      .eq(probationStaff ? 1 : 0)
      .should('contain.text', `View ${name}'s ${riskLevel} risk to staff flag`)
      .should('have.attr', 'href')
      .and('match', new RegExp(`/case/${_crn}/risk/flag/`))
  }
}
