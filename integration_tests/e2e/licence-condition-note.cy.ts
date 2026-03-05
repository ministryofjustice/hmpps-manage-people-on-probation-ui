import Page from '../pages/page'
import SentencePage from '../pages/sentence'
import { checkPopHeader } from './appointments/imports'

context('Sentence', () => {
  it('Licence condition note page is rendered', () => {
    cy.visit('/case/X000001/sentence/licence-condition/7007/note/0')
    checkPopHeader()
    cy.get(`[class=app-summary-card__header]`).within(() =>
      cy.get('h2').should('contain.text', 'Alcohol Monitoring (Electronic Monitoring)'),
    )

    cy.get(`[class=app-summary-card__body]`).within(() => cy.get('dt').should('have.length', 6))

    cy.get(`[class=app-summary-card__body]`).within(() => cy.get('dd').should('have.length', 6))

    cy.get(`[class=app-summary-card__body]`).within(() => cy.get('dt').eq(0).should('contain.text', 'Subtype'))
    cy.get(`[class=app-summary-card__body]`).within(() =>
      cy.get('dd').eq(0).should('contain.text', 'You must not drink any alcohol until [END DATE].'),
    )

    cy.get(`[class=app-summary-card__body]`).within(() =>
      cy.get('dt').eq(1).should('contain.text', 'Imposed (Release) date'),
    )
    cy.get(`[class=app-summary-card__body]`).within(() => cy.get('dd').eq(1).should('contain.text', '25 December 2024'))

    cy.get(`[class=app-summary-card__body]`).within(() =>
      cy.get('dt').eq(2).should('contain.text', 'Actual start date'),
    )
    cy.get(`[class=app-summary-card__body]`).within(() => cy.get('dd').eq(2).should('contain.text', '26 December 2024'))

    cy.get(`[class=app-summary-card__body]`).within(() => cy.get('dt').eq(3).should('contain.text', 'Note added by'))
    cy.get(`[class=app-summary-card__body]`).within(() => cy.get('dd').eq(3).should('contain.text', 'CVL Service'))

    cy.get(`[class=app-summary-card__body]`).within(() => cy.get('dt').eq(4).should('contain.text', 'Date added'))
    cy.get(`[class=app-summary-card__body]`).within(() => cy.get('dd').eq(4).should('contain.text', '22 April 2024'))

    cy.get(`[class=app-summary-card__body]`).within(() => cy.get('dt').eq(5).should('contain.text', 'Note'))
  })

  it('Licence condition no note ', () => {
    cy.visit('/case/X000001/sentence/licence-condition/7007/note/2')

    const page = Page.verifyOnPage(SentencePage)
    page.headerCrn().should('contain.text', 'X000001')
    page.headerName().should('contain.text', 'Caroline Wolff')
    cy.get('[data-qa=pageHeading]').eq(0).should('contain.text', 'Sentence')

    cy.get(`[class=app-summary-card__header]`).within(() => cy.get('h2').should('contain.text', 'Freedom of movement'))

    cy.get(`[class=app-summary-card__body]`).within(() => cy.get('dt').should('have.length', 1))

    cy.get(`[class=app-summary-card__body]`).within(() => cy.get('dd').should('have.length', 1))

    cy.get(`[class=app-summary-card__body]`).within(() =>
      cy.get('dt').eq(0).should('contain.text', 'Imposed (Release) date'),
    )
    cy.get(`[class=app-summary-card__body]`).within(() => cy.get('dd').eq(0).should('contain.text', '4 February 2022'))
  })

  it('Licence condition no note', () => {
    cy.visit('/case/X000001/sentence/licence-condition/7007/note/3')

    const page = Page.verifyOnPage(SentencePage)
    page.headerCrn().should('contain.text', 'X000001')
    page.headerName().should('contain.text', 'Caroline Wolff')
    cy.get('[data-qa=pageHeading]').eq(0).should('contain.text', 'Sentence')
  })
})
