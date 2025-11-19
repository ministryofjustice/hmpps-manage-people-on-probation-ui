import Page from '../pages/page'
import OverviewPage from '../pages/overview'

context('Overview', () => {
  beforeEach(() => {
    cy.task('resetMocks')
  })
  it('Overview page is rendered', () => {
    cy.visit('/case/X000001')
    const page = Page.verifyOnPage(OverviewPage)
    page.headerCrn().should('contain.text', 'X000001')
    page.headerName().should('contain.text', 'Caroline Wolff')
    page.pageHeading().should('contain.text', 'Overview')
    page.assertRiskTags()
    page.getTab('overview').should('contain.text', 'Overview')
    page.getTab('personalDetails').should('contain.text', 'Personal details')
    page.getTab('risk').should('contain.text', 'Risk')
    page.getTab('sentence').should('contain.text', 'Sentence')
    page.getTab('activityLog').should('contain.text', 'Activity log')
    page.getTab('compliance').should('contain.text', 'Compliance')
    page.getCardHeader('schedule').should('contain.text', 'Appointments')

    page
      .getAppointmentsLink('X000001')
      .should('exist')
      .invoke('text')
      .then(text => {
        const normalized = text.replace(/\s+/g, ' ').trim()
        expect(normalized).to.include('You need to record an outcome for 5 appointments')
      })

    page
      .getRowData('schedule', 'nextAppointment', 'Value')
      .should('contain.text', 'Saturday 9 March at 2:59pm (Initial appointment - in office (NS))')
    page.getRowData('personalDetails', 'name', 'Value').should('contain.text', 'Caroline Wolff')
    page.getRowData('personalDetails', 'preferredName', 'Value').should('contain.text', 'Caz')
    page.getRowData('personalDetails', 'preferredGender', 'Value').should('contain.text', 'Female')
    page.getRowData('personalDetails', 'dateOfBirthAndAge', 'Value').should('contain.text', '9 January 2002')
    page.getRowData('personalDetails', 'contactNumber', 'Value').should('contain.text', '07989654824')
    page
      .getRowData('personalDetails', 'currentCircumstances', 'Value')
      .should('contain.text', 'Committed/ Transferred to Crown: Life imprisonment (Adult)')
    page.getRowData('personalDetails', 'disabilities', 'Value').should('contain.text', 'Dyslexia')
    page.getRowData('personalDetails', 'adjustments', 'Value').should('contain.text', 'Special Furniture')
    page.getCardHeader('sentence2').should('contain.text', 'ORA Community Order')
    page
      .getRowData('sentence2', 'mainOffence', 'Value')
      .should(
        'contain.text',
        '(Having possession a picklock or other implement with intent to break into any premises - 18502)',
      )
    page.getRowData('sentence2', 'order', 'Value').should('contain.text', 'ORA Community Order')
    page.getRowData('sentence2', 'requirements', 'Value').should('contain.text', '10 of 10 RAR days completed')
    page.getCardHeader('sentence3').should('contain.text', '12 month Community order')
    page
      .getRowData('sentence3', 'mainOffence', 'Value')
      .should('contain.text', 'Breach of Restraining Order (Protection from Harassment Act 1997) - 00831')
    page.getRowData('sentence3', 'order', 'Value').should('contain.text', '12 month Community order')
    page.getRowData('sentence3', 'requirements', 'Value').should('contain.text', '16 of 20 RAR days completed')
    page
      .getRowData('activityAndCompliance', 'previousOrders', 'Value')
      .should('contain.text', '1 previous orders (No breaches on previous orders)')
    page
      .getRowData('activityAndCompliance', 'compliance', 'Value')
      .should('contain.text', '2 without a recorded outcome')
    page
      .getRowData('activityAndCompliance', 'activityLog', 'Value')
      .should('contain.text', '2 national standard appointments')

    page.getCardHeader('risk').should('contain.text', 'Risk')
    page
      .getCardHeader('risk')
      .find('a')
      .should('contain.text', 'View all risk details')
      .should('have.attr', 'href', 'X000001/risk')
    page
      .getRowData('risk', 'rosh', 'Label')
      .should('contain.text', 'Risk of serious harm (ROSH) in the community')
      .should('contain.text', 'Last updated 24 January 2024')
    page.getRowData('risk', 'rosh', 'Value').find('.govuk-tag--red').should('contain.text', 'HIGH RISK OF SERIOUS HARM')
    page
      .getRowData('risk', 'mappa', 'Label')
      .should('contain.text', 'MAPPA')
      .should('contain.text', 'Last updated (NDelius): 8 October 2024')
    page.getRowData('risk', 'mappa', 'Value').should('contain.text', 'Cat 2/Level 3')
    page.getRowData('risk', 'criminogenicNeeds', 'Label').should('contain.text', 'Criminogenic needs')
    cy.get('[data-qa="criminogenicNeedsValue"] dt').eq(0).should('contain.text', 'Severe')
    cy.get('[data-qa="criminogenicNeedsValue"]')
      .find('ul')
      .eq(0)
      .should('contain.text', 'Relationships')
      .should('contain.text', 'Lifestyle and Associates')
      .should('contain.text', 'Thinking and Behaviour')
    cy.get('[data-qa="criminogenicNeedsValue"] dt').eq(1).should('contain.text', 'Standard')
    cy.get('[data-qa="criminogenicNeedsValue"]')
      .find('ul')
      .eq(1)
      .should('contain.text', 'Accommodation')
      .should('contain.text', 'Education, Training and Employability')
      .should('contain.text', 'Drug Misuse')
      .should('contain.text', 'Alcohol Misuse')
      .should('contain.text', 'Attitudes')
    cy.get('[data-qa="criminogenicNeedsValue"] dt').eq(2).should('contain.text', 'Areas without a need score')
    cy.get('[data-qa="criminogenicNeedsValue"]').find('ul').eq(2).should('contain.text', 'Emotional wellbeing')

    page.getRowData('risk', 'riskFlags', 'Label').should('contain.text', 'NDelius risk flags')
    cy.get('[data-qa="riskFlagsValue"] dt')
      .eq(0)
      .should('contain.text', 'Medium')
      .should('have.attr', 'class', 'govuk-!-font-weight-bold rosh--medium')
    cy.get('[data-qa="riskFlagsValue"]').find('ul').eq(0).should('contain.text', 'Risk to Staff')
    cy.get('[data-qa="riskFlagsValue"] dt')
      .eq(1)
      .should('contain.text', 'Low')
      .should('have.attr', 'class', 'govuk-!-font-weight-bold rosh--low')
    cy.get('[data-qa="riskFlagsValue"]').find('ul').eq(1).should('contain.text', 'Risk to Known Adult')

    cy.get('[data-qa="riskFlagsValue"] dt')
      .eq(2)
      .should('contain.text', 'Information only')
      .should('have.attr', 'class', 'govuk-!-font-weight-bold')
    cy.get('[data-qa="riskFlagsValue"]').find('ul').eq(2).should('contain.text', 'Domestic Abuse Perpetrator')

    page.getElementData('overallRiskValue').should('contain.text', 'VERY HIGH RISK OF SERIOUS HARM')

    page.getAlert().should('contain.text', 'medium')

    const expected =
      '{"name":"Wolff,Caroline","crn":"X000001","dob":"9 January 2002","age":"22","tierScore":"B2","sentence":"12 month Community order"}'

    cy.window()
      .its('localStorage')
      .invoke('getItem', 'recentCases')
      .then(result => {
        const recentCase = JSON.parse(JSON.stringify(result))
        expect(expected, recentCase)
      })
  })
  it('Overview page is rendered for new san indicator assessment', () => {
    cy.task('stubSanIndicatorTrue')
    cy.visit('/case/X000001')
    const page = Page.verifyOnPage(OverviewPage)
    cy.get('[data-qa="criminogenicNeedsLabel"]').should('not.exist')
  })
  it('Overview page is rendered when riskFlag level and levelDescription is undefined', () => {
    cy.task('stubOverviewRiskFlagsNoLevel')
    cy.visit('/case/X000001')
    const page = Page.verifyOnPage(OverviewPage)
    page.headerCrn().should('contain.text', 'X000001')
    page.headerName().should('contain.text', 'Caroline Wolff')
    page.pageHeading().should('contain.text', 'Overview')
    page.assertRiskTags()
  })
  it('Risk information and tier is not provided due to 500 from ARNS and TIER', () => {
    cy.visit('/case/X000002')
    const page = Page.verifyOnPage(OverviewPage)
    page.headerCrn().should('contain.text', 'X000002')
    page.headerName().should('contain.text', 'Caroline Wolff')
    page.pageHeading().should('contain.text', 'Overview')
    page.getTab('overview').should('contain.text', 'Overview')
    page.getTab('personalDetails').should('contain.text', 'Personal details')
    page.getTab('risk').should('contain.text', 'Risk')
    page.getTab('sentence').should('contain.text', 'Sentence')
    page.getTab('activityLog').should('contain.text', 'Activity log')
    page.getTab('compliance').should('contain.text', 'Compliance')
    page.getCardHeader('schedule').should('contain.text', 'Appointments')

    cy.get(`[data-qa=errors]`).should(
      'contain.text',
      'OASys is experiencing technical difficulties. It has not been possible to provide the Risk information held in OASys',
    )
    cy.get(`[data-qa=errors]`).should(
      'contain.text',
      'The tier service is experiencing technical difficulties. It has not been possible to provide tier information',
    )
    page.getRowData('risk', 'rosh', 'Value').should('contain.text', 'There is no RoSH summary.')
    page.getRowData('risk', 'mappa', 'Value').should('contain.text', 'No MAPPA data found in NDelius.')
    page.getRowData('risk', 'criminogenicNeeds', 'Value').should('contain.text', 'There is no OASys risk assessment.')
    page.getRowData('risk', 'riskFlags', 'Value').should('contain.text', 'There are no active risk flags.')
  })
  it('Overview page with pre-sentence is rendered', () => {
    cy.visit('/case/X777916')
    const page = Page.verifyOnPage(OverviewPage)
    page.getCardHeader('sentence11').should('contain.text', 'Pre-Sentence')
    page.getRowData('sentence11', 'order', 'Value').should('contain.text', 'No order details')
    page.getRowData('sentence11', 'requirements', 'Value').should('contain.text', 'No requirements details')
  })

  it('Overview page with very high risk to staff is rendered', () => {
    cy.visit('/case/X778160')
    const page = Page.verifyOnPage(OverviewPage)
    page.getAlert().should('contain.text', 'is very high risk to staff')
  })
})
