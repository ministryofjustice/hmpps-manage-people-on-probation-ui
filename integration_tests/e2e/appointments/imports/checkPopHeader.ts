import { DateTime } from 'luxon'

export const checkPopHeader = ({
  name = 'Caroline Wolff',
  appointments = false,
  headerCrn = 'X000001',
  tierLinkEnabled = true,
  ogrs4 = false,
} = {}) => {
  if (!ogrs4) {
    cy.clock(DateTime.now().toMillis())
    cy.get('h1').should('contain.text', name)
    cy.get('[data-qa="crn"]').should('contain.text', headerCrn)
    cy.get('[data-qa="headerDateOfBirthValue"]').should('contain.text', '18 August 1979')
    cy.get('[data-qa="headerDateOfBirthAge"]').should('contain.text', '46')
    if (tierLinkEnabled) {
      cy.get('[data-qa="tierLink"]')
        .should('contain.text', appointments ? 'A3' : 'B2')
        .should('have.attr', 'href', `https://tier-dev.hmpps.service.justice.gov.uk/case/${headerCrn}`)
      cy.get('[data-qa="tierValue"]').should('not.exist')
    } else {
      cy.get('[data-qa="tierValue"]').should('contain.text', appointments ? 'A3' : 'B2')
      cy.get('[data-qa="tierLink"]').should('not.exist')
    }
    cy.get('[data-test-id=nameAndBand')
      .should('contain.text', 'RSR')
      .should('contain.text', 'LOW')
      .get('[data-test-id=score')
      .should('contain.text', '0.05%')
      .get('[data-test-id=staticOrDynamic')
      .should('contain.text', 'Dynamic')
  } else {
    cy.get('[data-test-id=nameAndBand')
      .should('contain.text', 'Combined serious reoffending predictor')
      .should('contain.text', 'LOW')
      .get('[data-test-id=score')
      .should('contain.text', '0.28%')
      .get('[data-test-id=staticOrDynamic')
      .should('contain.text', 'Dynamic')
  }
}
