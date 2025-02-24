import Page from '../pages/page'
import CompliancePage from '../pages/compliance'

context('Compliance', () => {
  it('Compliance page is rendered', () => {
    cy.visit('/case/X000001/compliance')
    const page = Page.verifyOnPage(CompliancePage)
    page.assertRiskTags()
    cy.get('.app-compliance-panel').should('contain.text', 'Breach in progress')
    page.getCardHeader('sentence1').should('contain.text', 'ORA Community Order')
    page
      .getRowData('sentence1', 'mainOffenceDescription', 'Value')
      .should('contain.text', 'Having possession a picklock')
    page.getRowData('sentence1', 'orderDescription', 'Value').should('contain.text', 'ORA Community Order')
    page.getRowData('sentence1', 'startDate', 'Value').should('contain.text', '2 March 2020')
    page.getRowData('sentence1', 'breach', 'Value').should('contain.text', 'A breach is in progress')

    page.getCardHeader('breach1').should('contain.text', 'Breach details')
    page.getCardHeader('breach1').find('.app-summary-card__actions').should('not.exist')
    page.getRowData('breach1', 'startDate', 'Value').should('contain.text', '2 March 2020')
    page.getRowData('breach1', 'status', 'Value').should('contain.text', 'An active breach status')

    page.getCardHeader('activity1').should('contain.text', '12 of 15 RAR days completed')
    page.getRowData('activity1', 'appointments', 'Value').should('contain.text', '1 national standard appointments')
    page.getRowData('activity1', 'withoutOutcome', 'Value').should('contain.text', '3 without a recorded outcome')

    page.getRowData('activity1', 'waitingForEvidence', 'Value').should('contain.text', '1 absence waiting for evidence')
    page.getRowData('activity1', 'complied', 'Value').should('contain.text', '2 complied')
    page.getRowData('activity1', 'failureToComply', 'Value').should('contain.text', '2 failures to comply')

    page.getRowData('activity1', 'warningLetter', 'Value').should('contain.text', 'First warning letter sent')
    page.getRowData('activity1', 'acceptableAbsences', 'Value').should('contain.text', '1 acceptable absences')
    page.getRowData('activity1', 'rescheduled', 'Value').should('contain.text', '1 rescheduled')

    page.getCardHeader('sentence2').should('contain.text', 'ORA Community Order')
    page
      .getRowData('sentence2', 'mainOffenceDescription', 'Value')
      .should('contain.text', 'Another main offence - 18502')
    page.getRowData('sentence2', 'orderDescription', 'Value').should('contain.text', 'ORA Community Order')
    page.getRowData('sentence2', 'startDate', 'Value').should('contain.text', '2 March 2020')
    page.getRowData('sentence2', 'breach', 'Value').should('contain.text', 'No breaches on current order')

    page.getCardHeader('previousOrder1').should('contain.text', '12 month Community Order')
    page
      .getRowData('previousOrder1', 'mainOffenceDescription', 'Value')
      .should('contain.text', 'Common Assault and Battery')
    page
      .getRowData('previousOrder1', 'status', 'Value')
      .should('contain.text', 'Completed - Sentence/ PSS Expiry Reached')
    page.getRowData('previousOrder1', 'startDate', 'Value').should('contain.text', '12 December 1990')
    page.getRowData('previousOrder1', 'endDate', 'Value').should('contain.text', '12 December 1991')
    page.getRowData('previousOrder1', 'breaches', 'Value').should('contain.text', '2')

    page
      .getCardHeader('previousOrder1')
      .within(() => cy.get('a').invoke('attr', 'href').should('equal', '/case/X000001/sentence/previous-orders/3'))
    page
      .getCardHeader('previousOrder1')
      .within(() => cy.get('[aria-label="12 month Community Order (Ended 12 December 1991)"]').should('be.visible'))
  })
  it('Compliance page is rendered with incomplete order', () => {
    cy.visit('/case/X777916/compliance')
    const page = Page.verifyOnPage(CompliancePage)
    page
      .getRowData('sentence2', 'mainOffenceDescription', 'Value')
      .should('contain.text', 'Another main offence - 18502')
    ;[
      ['sentence2', 'mainOffenceDescription', 'Another main offence - 18502'],
      ['sentence2', 'orderDescription', 'No order details'],
      ['sentence2', 'startDate', 'No start date on current order'],
      ['sentence2', 'breach', 'No breaches on current order'],
      ['previousOrder1', 'mainOffenceDescription', 'Common Assault and Battery'],
      ['previousOrder1', 'status', 'No status on previous order'],
      ['previousOrder1', 'startDate', 'No start date on previous order'],
      ['previousOrder1', 'endDate', 'No end date on previous order'],
      ['previousOrder1', 'breaches', 'No breaches on previous order'],
    ].forEach(([card, row, value]) => {
      page.getRowData(card, row, 'Value').should('contain.text', value)
    })
  })
  it('Compliance page is rendered with multiple NSIs in progress warning message', () => {
    cy.visit('/case/X778160/compliance')
    const page = Page.verifyOnPage(CompliancePage)
    cy.get('.govuk-warning-text').should(
      'contain.html',
      'There are multiple breach NSIs in progress.<br>Check and correct any issues in NDelius.',
    )
  })
})
