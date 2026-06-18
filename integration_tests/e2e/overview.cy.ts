import Page from '../pages/page'
import OverviewPage from '../pages/overview'
import { checkPopHeader, checkRiskToStaffAlert } from './appointments/imports'

context('Overview', () => {
  const disableEMDI = () => cy.task('stubDisableEMDIOverviewShowGPSData')
  const stubSupervisionPackage = (enabled: boolean) =>
    cy.task('stubFeatureFlag', { key: 'enableSupervisionPackage', enabled })
  const expectNoEMDILinks = (page: OverviewPage) => {
    page.getElementData('licencesEMDILink').should('not.exist')
    page.getElementData('requirementsEMDILink').should('not.exist')
  }
  const verifyTabs = (page: OverviewPage) => {
    page.getTab('overview').should('contain.text', 'Overview')
    page.getTab('personalDetails').should('contain.text', 'Personal details')
    page.getTab('risk').should('contain.text', 'Risk')
    page.getTab('sentence').should('contain.text', 'Sentence')
    page.getTab('activityLog').should('contain.text', 'Contacts')
    page.getTab('compliance').should('contain.text', 'Compliance')
  }

  const cases: Array<{
    title: string
    setup?: () => void
    url: string
    visitOptions?: Partial<Cypress.VisitOptions>
    assertions: (page: OverviewPage) => void
  }> = [
    {
      title: 'Overview page is rendered when enableSupervisionPackage is true',
      setup: () => stubSupervisionPackage(true),
      url: '/case/X000001',
      assertions: () => cy.get('.supervision-package').should('exist'),
    },
    {
      title: 'Overview page is rendered when enableSupervisionPackage is false',
      setup: () => stubSupervisionPackage(false),
      url: '/case/X000001',
      assertions: () => cy.get('.supervision-package').should('not.exist'),
    },
    {
      title: 'Overview page is rendered with OGRS4 risk predictor scores',
      setup: () => cy.task('stubPredictorScoresOGRS4'),
      url: '/case/X000001',
      assertions: () => checkPopHeader({ ogrs4: true }),
    },
    {
      title: 'Overview page is rendered with date of death',
      setup: () => cy.task('stubPersonalDetailsDateOfDeath'),
      url: '/case/X000001',
      assertions: () => {
        cy.get('[data-qa="dateOfBirthAndAgeValue"]')
          .invoke('text')
          .then(text => {
            const normalizedText = text.replace(/\s+/g, ' ').trim()
            expect(normalizedText).to.eq(`9 January 2002`)
          })
        cy.get('[data-qa="dateOfDeathWarning"]').should(
          'contain.text',
          'There is a date of death recorded for Caroline.',
        )
        cy.get('[data-qa="dateOfDeathAndAgeLabel"]').should('contain.text', 'Date of death')
        cy.get('[data-qa="dateOfDeathAndAgeValue"]').should('contain.text', '11 September 2024 (22 years old)')
      },
    },
    {
      title: 'Overview page is rendered for new san indicator assessment',
      setup: () => cy.task('stubSanIndicatorTrue'),
      url: '/case/X000001',
      assertions: () => {
        cy.get('[data-qa="criminogenicNeedsLabel"]').should('not.exist')
      },
    },
    {
      title: 'Overview page is rendered when riskFlag level and levelDescription is undefined',
      setup: () => cy.task('stubOverviewRiskFlagsNoLevel'),
      url: '/case/X000001',
      assertions: page => {
        page.headerCrn().should('contain.text', 'X000001')
        page.headerName().should('contain.text', 'Caroline Wolff')
        page.pageHeading().should('contain.text', 'Overview')
        page.assertRiskTags()
      },
    },
    {
      title: 'Risk information and tier is not provided due to 500 from ARNS and TIER',
      setup: disableEMDI,
      url: '/case/X000002',
      assertions: page => {
        page.headerCrn().should('contain.text', 'X000002')
        page.headerName().should('contain.text', 'Eula Schmeler')
        page.pageHeading().should('contain.text', 'Overview')
        verifyTabs(page)
        page.getCardHeader('schedule').should('contain.text', 'Appointments')

        cy.get(`[data-qa=errors]`).should(
          'contain.text',
          'OASys is experiencing technical difficulties. It has not been possible to provide the Risk information held in OASys',
        )
        cy.get(`[data-qa=errors]`).should(
          'contain.text',
          'The tier service is experiencing technical difficulties. It has not been possible to provide tier information',
        )
        page.getRowData('risk', 'rosh', 'Value').should('contain.text', 'There is no ROSH summary.')
        page.getRowData('risk', 'mappa', 'Value').should('contain.text', 'No MAPPA data found in NDelius.')
        page
          .getRowData('risk', 'criminogenicNeeds', 'Value')
          .should('contain.text', 'There is no OASys risk assessment.')
        page.getRowData('risk', 'riskFlags', 'Value').should('contain.text', 'There are no active risk flags.')
      },
    },
    {
      title: 'Overview page with pre-sentence is rendered',
      setup: disableEMDI,
      url: '/case/X777916',
      assertions: page => {
        page.getCardHeader('sentence11').should('contain.text', 'Pre-Sentence')
        page.getRowData('sentence11', 'order', 'Value').should('contain.text', 'No order details')
        page.getRowData('sentence11', 'requirements', 'Value').should('contain.text', 'Details not available')
      },
    },
    {
      title: 'Overview page with medium risk to staff is rendered',
      url: '/case/X000001',
      visitOptions: { failOnStatusCode: false },
      assertions: () => checkRiskToStaffAlert('X000001', 'Caroline', 'medium'),
    },
    {
      title: 'Overview page with risk to probation staff is rendered',
      setup: disableEMDI,
      url: '/case/X777916',
      visitOptions: { failOnStatusCode: false },
      assertions: () => checkRiskToStaffAlert('X777916', 'Wendell', 'very high', true),
    },
    {
      title: 'Overview page should not be rendered with licence conditions when EMDI API responds with 404',
      setup: () => cy.task('stubEMDIPeopleExists404Response', 'X778160'),
      url: '/case/X778160',
      assertions: expectNoEMDILinks,
    },
    {
      title: 'Overview page should not be rendered with licence conditions when EMDI API responds with 500',
      setup: () => cy.task('stubEMDIPeopleExists500Response', 'X778160'),
      url: '/case/X778160',
      assertions: expectNoEMDILinks,
    },
    {
      title: 'Overview page should not be rendered with licence conditions when flag is disabled',
      setup: disableEMDI,
      url: '/case/X778160',
      assertions: expectNoEMDILinks,
    },
    {
      title: 'Overview page is rendered with licence conditions',
      url: '/case/X778160',
      assertions: page => {
        page
          .getRowData('sentence1234567', 'licenceConditions', 'Value')
          .should('contain.text', 'Location Monitoring View GPS location monitoring data')
        page
          .getRowData('sentence7654321', 'requirements', 'Value')
          .should('contain.text', 'Location Monitoring View (GPS tagging) Trail Monitoring data')
      },
    },
  ]

  beforeEach(() => {
    cy.task('resetMocks')
  })
  it('Overview page is rendered', () => {
    cy.visit('/case/X000001')
    const page = Page.verifyOnPage(OverviewPage)
    page.headerCrn().should('contain.text', 'X000001')
    page.headerName().should('contain.text', 'Caroline Wolff')
    page.pageHeading().should('contain.text', 'Overview')
    page.getTab('overview').should('contain.text', 'Overview')
    page.getTab('personalDetails').should('contain.text', 'Personal details')
    page.getTab('risk').should('contain.text', 'Risk')
    page.getTab('sentence').should('contain.text', 'Sentence')
    page.getTab('activityLog').should('contain.text', 'Contacts')
    page.getTab('compliance').should('contain.text', 'Compliance')
    page.getCardHeader('schedule').should('contain.text', 'Appointments')
    checkPopHeader()
    page
      .getAppointmentsLink('X000001')
      .should('exist')
      .invoke('text')
      .then(text => {
        const normalized = text.replace(/\s+/g, ' ').trim()
        expect(normalized).to.include('You need to record an outcome for 2 appointments')
      })

    page
      .getRowData('schedule', 'nextAppointment', 'Value')
      .should('contain.text', 'Saturday 9 March at 2:59pm (Initial appointment - in office (NS))')
    page.getRowData('personalDetails', 'name', 'Value').should('contain.text', 'Caroline Wolff')
    page.getRowData('personalDetails', 'preferredName', 'Value').should('contain.text', 'Caz')
    page.getRowData('personalDetails', 'preferredGender', 'Value').should('contain.text', 'Female')
    page.getRowData('personalDetails', 'dateOfBirthAndAge', 'Value').should('contain.text', '9 January 2002')
    cy.get('[data-qa="dateOfDeathAndAgeLabel"]').should('not.exist')
    cy.get('[data-qa="dateOfDeathAndAgeValue"]').should('not.exist')
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
    cy.get('[data-qa="criminogenicNeedsValue"] dt').eq(0).should('contain.text', 'Need identified')
    cy.get('[data-qa="criminogenicNeedsValue"]')
      .find('ul')
      .eq(0)
      .should('contain.text', 'Relationships')
      .should('contain.text', 'Lifestyle and Associates')
      .should('contain.text', 'Accommodation')
      .should('contain.text', 'Education, Training and Employability')
      .should('contain.text', 'Drug Misuse')
      .should('contain.text', 'Alcohol Misuse')
    cy.get('[data-qa="criminogenicNeedsValue"] dt').eq(1).should('contain.text', 'No need identified')
    cy.get('[data-qa="criminogenicNeedsValue"]').find('ul').eq(1).should('contain.text', 'Emotional wellbeing')

    cy.get('[data-qa="criminogenicNeedsValue"] dt').eq(2).should('contain.text', 'Not enough information provided')
    cy.get('[data-qa="criminogenicNeedsValue"]')
      .find('ul')
      .eq(2)
      .should('contain.text', 'Thinking and Behaviour')
      .should('contain.text', 'Attitudes')

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
  
  cases.forEach(({ title, setup, url, visitOptions, assertions }) => {
    it(title, () => {
      setup?.()
      cy.visit(url, visitOptions)
      const page = Page.verifyOnPage(OverviewPage)
      assertions(page)
    })
  })
})
