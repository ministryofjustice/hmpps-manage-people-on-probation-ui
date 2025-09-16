import Page from '../pages/page'
import SentencePage from '../pages/sentence'

context('Sentence', () => {
  it('Sentence page is rendered', () => {
    cy.visit('/case/X000001/sentence')
    const page = Page.verifyOnPage(SentencePage)
    page.headerCrn().should('contain.text', 'X000001')
    page.headerName().should('contain.text', 'Caroline Wolff')
    page.assertRiskTags()
    page.getTab('overview').should('contain.text', 'Overview')
    page.getTab('personalDetails').should('contain.text', 'Personal details')
    page.getTab('risk').should('contain.text', 'Risk')
    page.getTab('sentence').should('contain.text', 'Sentence')
    page.getTab('activityLog').should('contain.text', 'Activity log')
    page.getTab('compliance').should('contain.text', 'Compliance')

    page.assertAnchorElementAtIndex(
      '[class="moj-side-navigation__item moj-side-navigation__item--active"]',
      0,
      '/case/X000001/sentence?number=3',
    )

    page.assertAnchorElementAtIndex('[class="moj-side-navigation__item"]', 0, '/case/X000001/sentence?number=1')

    page.assertAnchorElementAtIndex(
      '[class="moj-side-navigation__item"]',
      1,
      '/case/X000001/sentence/probation-history',
    )

    page.getCardHeader('offence').should('contain.text', 'Offence')
    page.getCardHeader('conviction').should('contain.text', 'Conviction')
    page.getCardHeader('sentence').should('contain.text', 'Sentence')
    page.getRowData('offence', 'mainOffence', 'Label').should('contain.text', 'Main offence')
    page.getRowData('offence', 'mainOffence', 'Value').should('contain.text', 'Murder (3 count)')
    page.getRowData('offence', 'dateOfOffence', 'Label').should('contain.text', 'Offence date')
    page.getRowData('offence', 'dateOfOffence', 'Value').should('contain.text', '20 March 2024')
    page.getRowData('offence', 'offenceNotes', 'Label').should('contain.text', 'Notes')
    page.getRowData('offence', 'offenceNotes', 'Value').should('contain.text', 'overview')
    page.getRowData('offence', 'additionalOffences', 'Label').should('contain.text', 'Additional offences')
    page.getRowData('offence', 'additionalOffences', 'Value').should('contain.text', 'Burglary (2 count)')
    page.getRowData('offence', 'additionalOffences', 'Value').should('contain.text', 'Assault (1 count)')
    page.getRowData('conviction', 'sentencingCourt', 'Label').should('contain.text', 'Sentencing court')
    page.getRowData('conviction', 'sentencingCourt', 'Value').should('contain.text', 'Hull Court')
    page.getRowData('conviction', 'responsibleCourt', 'Label').should('contain.text', 'Responsible court')
    page.getRowData('conviction', 'responsibleCourt', 'Value').should('contain.text', 'Birmingham Court')
    page.getRowData('conviction', 'convictionDate', 'Label').should('contain.text', 'Conviction date')
    page.getRowData('conviction', 'convictionDate', 'Value').should('contain.text', '20 March 2024')
    page.getRowData('conviction', 'additionalSentences', 'Label').should('contain.text', 'Additional sentences')
    page.getRowData('conviction', 'additionalSentences', 'Value').should('contain.text', '20 March 2024')
    page.getRowData('sentence', 'orderDescription', 'Label').should('contain.text', 'Order')
    page.getRowData('sentence', 'orderDescription', 'Value').should('contain.text', 'Default Sentence Type')
    page.getRowData('sentence', 'orderEventNumber', 'Label').should('contain.text', 'NDelius event number')
    page.getRowData('sentence', 'orderEventNumber', 'Value').should('contain.text', '3')
    page.getRowData('sentence', 'orderStartDate', 'Label').should('contain.text', 'Sentence start date')
    page.getRowData('sentence', 'orderStartDate', 'Value').should('contain.text', '19 March 2024')
    page.getRowData('sentence', 'orderReleaseDate', 'Label').should('contain.text', 'Date released on licence')
    page.getRowData('sentence', 'orderReleaseDate', 'Value').should('contain.text', 'No release date details')
    page.getRowData('sentence', 'orderEndDate', 'Label').should('contain.text', 'Expected sentence end date')
    page.getRowData('sentence', 'orderEndDate', 'Value').should('contain.text', '19 March 2025')
    page.getRowData('sentence', 'orderTimeElapsed', 'Label').should('contain.text', 'Time elapsed')
    cy.get('[data-qa="orderTimeElapsedValue"]')
      .invoke('text')
      .should('match', /\d+ months elapsed \(of 12 months\)/)

    page.getRowData('sentence', 'licenceConditions', 'Label').should('contain.text', 'Licence conditions')
    page.getLicenceConditionsSummaryLink(0).should('contain.text', 'Alcohol Monitoring (Electronic Monitoring)').click()
    page.getLicenceConditionsLabel(0, 0, 'key').should('contain.text', 'Subtype')
    page
      .getLicenceConditionsLabel(0, 0, 'value')
      .should('contain.text', 'You must not drink any alcohol until [END DATE].')
    page.getLicenceConditionsLabel(0, 1, 'key').should('contain.text', 'Imposed (Release) date')
    page.getLicenceConditionsLabel(0, 1, 'value').should('contain.text', '25 December 2024')
    page.getLicenceConditionsLabel(0, 2, 'key').should('contain.text', 'Actual start date')
    page.getLicenceConditionsLabel(0, 2, 'value').should('contain.text', '26 December 2024')
    page.getLicenceConditionsLabel(0, 3, 'key').should('contain.text', 'Notes')
    page.getLicenceConditionsLabel(0, 3, 'value').should('contain.text', 'Licence Condition created automatically')
    page.getLicenceConditionsSummaryLink(0).click()
    page.getLicenceConditionsSummaryLink(1).should('contain.text', 'Freedom of movement').click()
    page.getLicenceConditionsLabel(1, 0, 'key').should('contain.text', 'Imposed (Release) date')
    page.getLicenceConditionsLabel(1, 0, 'value').should('contain.text', '4 February 2022')
    page.getLicenceConditionsLabel(1, 1, 'key').should('contain.text', 'Notes')
    page.getLicenceConditionsLabel(1, 1, 'value').should('contain.text', 'Not to go to a football game')
    page.getLicenceConditionsSummaryLink(1).click()
    page.getLicenceConditionsSummaryLink(2).should('contain.text', 'Residence at a specific place').click()
    page.getLicenceConditionsLabel(2, 0, 'key').should('contain.text', 'Subtype')
    page.getLicenceConditionsLabel(2, 0, 'value').should('contain.text', 'Bespoke Condition (See Notes)')
    page.getLicenceConditionsLabel(2, 1, 'key').should('contain.text', 'Imposed (Release) date')
    page.getLicenceConditionsLabel(2, 1, 'value').should('contain.text', '3 October 2024')
    page.getLicenceConditionsLabel(2, 2, 'key').should('contain.text', 'Actual start date')
    page.getLicenceConditionsLabel(2, 2, 'value').should('contain.text', '15 November 2023')
    page.getLicenceConditionsLabel(2, 3, 'key').should('contain.text', 'Notes')
    page.getLicenceConditionsLabel(2, 3, 'value').should('contain.text', 'James must reside at his')
    page.getLicenceConditionsSummaryLink(2).click()
    page
      .getRowData('sentence', 'courtDocuments', 'Value')
      .within(() => cy.get('ul > li').its('length').should('equal', 3))

    page
      .getRowData('sentence', 'courtDocuments', 'Value')
      .within(() =>
        cy
          .get('ul > li:first')
          .within(() =>
            cy
              .get('a')
              .invoke('attr', 'href')
              .should(
                'equal',
                '/case/X000001/personal-details/documents/4d74f43c-5b42-4317-852e-56c7d29b610b/download',
              ),
          ),
      )
    page
      .getRowData('sentence', 'courtDocuments', 'Value')
      .within(() => cy.get('ul > li:first').should('contain.text', 'Pre-sentence report'))
    page
      .getRowDataIndex('sentence', 'courtDocuments', 'Value', 0)
      .within(() => cy.get('ul > li:first').should('contain.text', 'Last updated 3 Apr 2024'))

    page.getRowData('sentence', 'courtDocuments', 'Value').within(() =>
      cy
        .get('ul > li')
        .eq(1)
        .within(() =>
          cy
            .get('a')
            .invoke('attr', 'href')
            .should('equal', '/case/X000001/personal-details/documents/6037becb-0d0c-44e1-8727-193f22df0494/download'),
        ),
    )
    page
      .getRowData('sentence', 'courtDocuments', 'Value')
      .within(() => cy.get('ul > li').eq(1).should('contain.text', 'CPS Pack'))
    page
      .getRowData('sentence', 'courtDocuments', 'Value')
      .within(() => cy.get('ul > li').eq(1).should('contain.text', 'Last updated 1 Apr 2024'))

    page.getRowData('sentence', 'courtDocuments', 'Value').within(() =>
      cy
        .get('ul > li')
        .eq(2)
        .within(() =>
          cy
            .get('a')
            .invoke('attr', 'href')
            .should('equal', '/case/X000001/personal-details/documents/d072ed9a-999f-4333-a116-a871a845aeb3/download'),
        ),
    )
    page
      .getRowData('sentence', 'courtDocuments', 'Value')
      .within(() => cy.get('ul > li').eq(2).should('contain.text', 'Previous convictions'))
    page
      .getRowData('sentence', 'courtDocuments', 'Value')
      .within(() => cy.get('ul > li').eq(2).should('contain.text', 'Unavailable'))
  })

  it('Sentence page is rendered via query parameter', () => {
    cy.visit('/case/X000001/sentence?number=1')
    const page = Page.verifyOnPage(SentencePage)

    page.assertAnchorElementAtIndex(
      '[class="moj-side-navigation__item moj-side-navigation__item--active"]',
      0,
      '/case/X000001/sentence?number=1',
    )

    page.assertAnchorElementAtIndex('[class="moj-side-navigation__item"]', 0, '/case/X000001/sentence?number=3')

    page.assertAnchorElementAtIndex(
      '[class="moj-side-navigation__item"]',
      1,
      '/case/X000001/sentence/probation-history',
    )

    page
      .getCardHeader('offence')
      .within(() => cy.get('.govuk-summary-list__value').eq(2).should('contain.text', 'No notes'))

    page
      .getCardHeader('offence')
      .within(() => cy.get('.govuk-summary-list__value').eq(3).should('contain.text', 'No additional offences'))

    page
      .getCardHeader('conviction')
      .within(() => cy.get('.govuk-summary-list__value').eq(0).should('contain.text', 'No court details'))

    page
      .getCardHeader('conviction')
      .within(() => cy.get('.govuk-summary-list__value').eq(1).should('contain.text', 'No court details'))

    page
      .getCardHeader('conviction')
      .within(() => cy.get('.govuk-summary-list__value').eq(2).should('contain.text', 'No conviction date'))

    page
      .getCardHeader('sentence')
      .within(() => cy.get('.govuk-summary-list__value').eq(3).should('contain.text', '1 November 2024'))
  })

  it('Sentence page is rendered with probation history information', () => {
    cy.visit('/case/X000001/sentence/probation-history')
    const page = Page.verifyOnPage(SentencePage)

    page.assertAnchorElementAtIndex(
      '[class="moj-side-navigation__item moj-side-navigation__item--active"]',
      0,
      '/case/X000001/sentence/probation-history',
    )

    page.assertAnchorElementAtIndex('[class="moj-side-navigation__item"]', 0, '/case/X000001/sentence?number=3')

    page.assertAnchorElementAtIndex('[class="moj-side-navigation__item"]', 1, '/case/X000001/sentence?number=1')

    page.getCardElement('probationHistory', '.govuk-summary-list__key', 0).should('contain.text', 'Previous orders')

    page.getCardElement('probationHistory', '.govuk-summary-list__key', 1).should('contain.text', 'Previous breaches')

    page
      .getCardElement('probationHistory', '.govuk-summary-list__key', 2)
      .should('contain.text', 'Previous staff contacts')

    page
      .getCardElement('probationHistory', '.govuk-summary-list__value', 1)
      .should('contain.text', '2 previous breaches')

    page
      .getCardHeader('probationHistory')
      .within(() => cy.get('a').invoke('attr', 'href').should('equal', '/case/X000001/sentence/previous-orders'))
    page.getCardHeader('probationHistory').within(() => cy.get('a').eq(1).should('contain.text', '3 previous contacts'))
    page
      .getCardHeader('probationHistory')
      .within(() =>
        cy
          .get('a')
          .eq(1)
          .invoke('attr', 'href')
          .should('equal', '/case/X000001/sentence/probation-history/staff-contacts/#previous'),
      )
  })
  it('Sentence page is loaded with no active sentence', () => {
    cy.visit('/case/X000001/sentence?activeSentence=false')
    const page = Page.verifyOnPage(SentencePage)
    page.activeSideNavItem().should('contain.text', 'No active sentence')
    page.noActiveSentence().find('h4').should('contain.text', 'No active sentence')
    page.noActiveSentence().find('p').should('contain.text', 'This person does not have any active sentences.')
    cy.get('[data-qa="sentenceCard"]').should('not.exist')
    cy.get('[data-qa="convictionCard"]').should('not.exist')
    cy.get('[data-qa="offenceCard"]').should('not.exist')
  })

  it('Sentence page is rendered with requirements', () => {
    cy.visit('/case/X000001/sentence?number=1')
    const page = Page.verifyOnPage(SentencePage)

    cy.get(`[data-qa="sentenceCard"]`).within(() => cy.get('dt').eq(6).should('contain.text', 'Requirements'))
    cy.get(`[data-qa="requirementsValue"]`).within(() =>
      cy.get('details').eq(0).should('contain.text', '3 of 12 RAR days completed'),
    )
    cy.get(`[data-qa="requirementsValue"]`).within(() =>
      cy.get('details').eq(1).should('contain.text', 'Curfew (Electronic Monitored)'),
    )
    cy.get(`[data-qa="requirementsValue"]`).within(() =>
      cy.get('details').eq(2).should('contain.text', 'Unpaid Work - Regular'),
    )
    cy.get(`[data-qa="requirementsValue"] `).within(() => cy.get('details').eq(1).click())
    page.getRequirementLabel(2, 1).should('contain.text', 'Length')
    page.getRequirementValue(2, 1).should('contain.text', '10 hours')
    page.getRequirementLabel(2, 2).should('contain.text', 'Start date')
    page.getRequirementValue(2, 2).should('contain.text', '12 January 2024')
    page.getRequirementLabel(2, 3).should('contain.text', 'End date')
    page.getRequirementValue(2, 3).should('contain.text', '9 January 2024')
    page.getRequirementLabel(2, 4).should('contain.text', 'Result')
    page.getRequirementValue(2, 4).should('contain.text', 'Expired (Normal)')
    page.getRequirementLabel(2, 5).should('contain.text', 'Notes')
    page.getRequirementValue(2, 5).should('contain.text', 'curfew notes')
    page
      .getRequirementValue(2, 5)
      .find('p:nth-of-type(2)')
      .should('contain.text', 'Comment added by Jon Jones on 21 August 2024')
    page.getRequirementValue(2, 5).find('a').should('not.exist')

    cy.get(`[data-qa="requirementsValue"] `).within(() => cy.get('details').eq(0).click())
    page.getRequirementLabel(1, 1).should('contain.text', 'Length of RAR')
    page.getRequirementValue(1, 1).should('contain.text', '12 days')
    page.getRequirementLabel(1, 2).should('contain.text', 'Completed RAR')
    page.getRequirementValue(1, 2).should('contain.text', '3 days')
    page.getRequirementLabel(1, 3).should('contain.text', 'Start date')
    page.getRequirementValue(1, 3).should('contain.text', '12 April 2024')
    page.getRequirementLabel(1, 4).should('contain.text', 'Notes')
    page.getRequirementValue(1, 4).should('contain.text', 'Requirement created automatically')
    page.getRequirementValue(1, 4).should('not.contain.text', '123456')
    page.getRequirementValue(1, 4).find('a').should('contain.text', 'View full note')
    page
      .getRequirementValue(1, 4)
      .find('p:nth-of-type(2)')
      .should('contain.text', 'Comment added by Jon Jones on 21 August 2024')
    page.getRequirementValue(1, 4).find('a').click()
    cy.get(`[data-qa="name"]`).should('contain.text', 'Caroline Wolff')
    cy.get('.app-summary-card__header').should('contain.text', '3 of 12 RAR days completed')
  })
})
