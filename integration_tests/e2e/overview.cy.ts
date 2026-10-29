import Page from '../pages/page'
import OverviewPage from '../pages/overview'
import { checkPopHeader, checkRiskToStaffAlert } from './appointments/imports'

context('Overview', () => {
  const stubSupervisionPackage = (enabled: boolean) => {
    if (enabled) {
      cy.task('stubSupervisionPackageFrontendContext', { crn: 'X000001' })
    }
  }
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

  const verifyRiskAlerts = (page: OverviewPage) => {
    page.getElementData('riskToProbationStaffAlert').should('contain.text', 'Caroline may be a risk to probation staff')
  }

  const verifyPersonalDetails = (page: OverviewPage) => {
    page.getCardHeader('personalDetails').should('contain.text', 'Personal details')
    page.getRowData('personalDetails', 'name', 'Value').should('contain.text', 'Caroline Wolff')
    page.getRowData('personalDetails', 'preferredName', 'Value').should('contain.text', 'Caz')
    page.getRowData('personalDetails', 'preferredGender', 'Value').should('contain.text', 'Female')
    page.getRowData('personalDetails', 'dateOfBirthAndAge', 'Value').should('contain.text', '9 January 2002')
    cy.get('[data-qa="dateOfDeathAndAgeLabel"]').should('not.exist')
    cy.get('[data-qa="dateOfDeathAndAgeValue"]').should('not.exist')
    page.getRowData('personalDetails', 'contactNumber', 'Value').should('contain.text', '07989654824')
  }

  const verifySentences = (page: OverviewPage) => {
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
  }

  const verifyPersonalCircumstances = (page: OverviewPage) => {
    page
      .getAccordionHeader('personalCircumstances')
      .should('contain.text', 'Addresses, disabilities and personal circumstances')
    page.openAccordion('personalCircumstances')
    page
      .getAccordionHeader('personalCircumstances')
      .find('a')
      .should('contain.text', 'View all personal details')
      .should('have.attr', 'href', '/case/X000001/personal-details')

    const addressValue = page.getRowData('personalCircumstances', 'mainAddress', 'Value')
    addressValue
      .should('contain.text', 'No fixed address')
      .and('contain.text', 'Type of address')
      .and('contain.text', 'Householder (Owner - freehold or leasehold) (verified)')
      .and('contain.text', 'Start date')
      .and('contain.text', '14 March 2023')
      .and('contain.text', 'Notes')
    addressValue
      .find('.app-note')
      .should('have.length', 3)
      .eq(0)
      .should('contain.text', 'Comment added by Tom Brady on 29 October 2024')
      .find('a')
      .should('contain.text', 'View full note')
      .should('have.attr', 'href', '/case/X000001/personal-details/main-address/note/0')

    const otherAddressesValue = page.getRowData('personalCircumstances', 'otherAddresses', 'Value')
    otherAddressesValue
      .should('contain.text', '1 other address')
      .and('contain.text', '1 previous address')
      .find('a')
      .should('contain.text', 'View all addresses')
      .and('have.attr', 'href', '/case/X000001/personal-details/addresses')

    page
      .getRowData('personalCircumstances', 'currentCircumstances', 'Value')
      .should('contain.text', 'Committed/ Transferred to Crown: Life imprisonment (Adult)')
    page.getRowData('personalCircumstances', 'disabilities', 'Value').should('contain.text', 'Dyslexia')
    page.getRowData('personalCircumstances', 'adjustments', 'Value').should('contain.text', 'Special Furniture')
  }

  const verifyRisks = (page: OverviewPage) => {
    page.getAccordionHeader('risk').should('contain.text', 'Risk')
    page.openAccordion('risk')
    page
      .getAccordionHeader('risk')
      .find('a')
      .should('contain.text', 'View all risk information')
      .should('have.attr', 'href', '/case/X000001/risk')
    page
      .getRowData('risk', 'rosh', 'Label')
      .should('contain.text', 'Risk of serious harm (ROSH) in the community')
      .should('contain.text', 'Last updated 24 January 2024')
    page.getRowData('risk', 'rosh', 'Value').should('contain.text', 'Risk of serious harm VERY HIGH')
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

    cy.get('[data-qa="riskFlagsValue"] dt span')
      .eq(0)
      .should('contain.text', 'High')
      .should('have.class', 'risk-badge--high')

    cy.get('[data-qa="riskFlagsValue"] ul').eq(0).should('contain.text', 'Risk to public')

    cy.get('[data-qa="riskFlagsValue"] dt span')
      .eq(1)
      .should('contain.text', 'Medium')
      .should('have.class', 'risk-badge--medium')

    cy.get('[data-qa="riskFlagsValue"] ul').eq(1).should('contain.text', 'Domestic Abuse Perpetrator')

    cy.get('[data-qa="riskFlagsValue"] dt span')
      .eq(2)
      .should('contain.text', 'Low')
      .should('have.class', 'risk-badge--low')

    cy.get('[data-qa="riskFlagsValue"] ul').eq(2).should('contain.text', 'Risk to Known Adult')

    cy.get('[data-qa="riskFlagsValue"] dt span')
      .eq(3)
      .should('contain.text', 'Information only')
      .should('have.class', 'risk-badge')

    cy.get('[data-qa="riskFlagsValue"] ul').eq(3).should('contain.text', 'Domestic Abuse Perpetrator')
  }

  const verifyActivityAndCompliance = (page: OverviewPage) => {
    page.getAccordionHeader('activityAndCompliance').should('contain.text', 'Activity and compliance')
    page.openAccordion('activityAndCompliance')
    page
      .getAccordionHeader('activityAndCompliance')
      .find('a')
      .should('contain.text', 'View all compliance information')
      .should('have.attr', 'href', '/case/X000001/compliance')
    page
      .getRowData('activityAndCompliance', 'previousOrders', 'Value')
      .should('contain.text', '1 previous orders (No breaches on previous orders)')
    page
      .getRowData('activityAndCompliance', 'activityLog', 'Value')
      .should('contain.text', '2 without a recorded outcome')
    page
      .getRowData('activityAndCompliance', 'activityLog', 'Value')
      .should('contain.text', '2 national standard appointments')
  }

  const cases: Array<{
    title: string
    setup?: () => void
    url: string
    visitOptions?: Partial<Cypress.VisitOptions>
    assertions: (page: OverviewPage) => void
  }> = [
    {
      title:
        'Overview page is rendered with a supervision package and appointments card when enableNewOverview is false',
      setup: () => stubSupervisionPackage(true),
      url: '/case/X000001',
      assertions: page => {
        cy.get('.supervision-package').should('exist')
        page.getCardHeader('schedule').should('exist')
      },
    },
    {
      title: 'Overview page is rendered when enableNewOverview is true',
      setup: () => {
        cy.task('stubFeatureFlag', { key: 'enableNewOverview', enabled: true })
        stubSupervisionPackage(true)
      },
      url: '/case/X000001',
      assertions: page => {
        page.headerCrn().should('contain.text', 'X000001')
        page.headerName().should('contain.text', 'Caroline Wolff')
        page.pageHeading().should('contain.text', 'Overview')
        page.headerTier().should('contain.text', 'Tier: B2').and('have.attr', 'href')
        verifyTabs(page)
        checkPopHeader()
        verifyRiskAlerts(page)
        cy.get('.supervision-package').should('exist')
        page.getCardHeader('schedule').should('not.exist')
        verifyPersonalDetails(page)
        verifySentences(page)
        verifyPersonalCircumstances(page)
        verifyRisks(page)
        verifyActivityAndCompliance(page)

        const expected = {
          name: 'Wolff, Caroline',
          crn: 'X000001',
          dob: '18 August 1979',
          tierScore: 'B2',
          sentence: '12 month Community order',
        }

        cy.window()
          .its('localStorage')
          .invoke('getItem', 'recentCases')
          .then(result => {
            const [recentCase] = JSON.parse(result)
            expect(recentCase).to.include(expected)
          })
      },
    },
    {
      title: 'Appointments card is rendered if no supervision package when enableNewOverview is true',
      setup: () => cy.task('stubFeatureFlag', { key: 'enableNewOverview', enabled: true }),
      url: '/case/X778160',
      assertions: page => {
        cy.get('.supervision-package').should('not.exist')
        page.getCardHeader('schedule').should('exist')
      },
    },
    {
      title: 'Supervision package renders a blank tier with a Missing tag when the tier score is MISSING',
      setup: () => {
        stubSupervisionPackage(true)
        cy.task('stubTierDetails', { crn: 'X000001', tierScore: 'MISSING', provisional: false })
      },
      url: '/case/X000001',
      assertions: () => {
        cy.get('.supervision-package .app-tier-header h4')
          .should('have.attr', 'aria-label', 'Tier Missing')
          .find('span[aria-hidden="true"]')
          .invoke('text')
          .then(text => expect(text.trim()).to.eq('Tier'))
        cy.get('.supervision-package .app-tier-header').should('not.contain.text', 'MISSING')
        cy.get('.supervision-package__tier-tag')
          .should('have.length', 1)
          .and('contain.text', 'Missing')
          .and('have.class', 'govuk-tag--red')
      },
    },
    {
      title: 'Supervision package renders the tier score with a Provisional tag when the calculation is provisional',
      setup: () => {
        stubSupervisionPackage(true)
        cy.task('stubTierDetails', { crn: 'X000001', tierScore: 'B2', provisional: true })
      },
      url: '/case/X000001',
      assertions: () => {
        cy.get('.supervision-package .app-tier-header h4').should('have.attr', 'aria-label', 'Tier B2 Provisional')
        cy.get('.supervision-package .app-tier-header').should('contain.text', 'Tier B2')
        cy.get('.supervision-package__tier-tag')
          .should('have.length', 1)
          .and('contain.text', 'Provisional')
          .and('have.class', 'govuk-tag--orange')
      },
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
      title: 'Overview page with medium risk to staff is rendered',
      url: '/case/X000001',
      visitOptions: { failOnStatusCode: false },
      assertions: () => checkRiskToStaffAlert('X000001', 'Caroline', 'medium'),
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
      assertions: page => {
        page.getElementData('licencesEMDILink').should('not.exist')
        page.getElementData('requirementsEMDILink').should('not.exist')
        cy.get(`[data-qa=errors]`).should('contain.text', 'Electronic monitoring data is currently unavailable.')
      },
    },
    {
      title: 'Overview page is rendered with licence conditions',
      url: '/case/X778160',
      assertions: page => {
        page
          .getRowData('sentence1234567', 'licenceConditions', 'Value')
          .should('contain.text', 'Location Monitoring')
          .and('contain.text', 'View GPS location monitoring data')
        page
          .getRowData('sentence7654321', 'requirements', 'Value')
          .should('contain.text', 'Location Monitoring')
          .and('contain.text', 'View GPS location monitoring data')
      },
    },
  ]

  beforeEach(() => {
    cy.task('resetMocks')
  })

  it('Overview page is rendered when enableNewOverview is false', () => {
    cy.visit('/case/X000001')
    const page = Page.verifyOnPage(OverviewPage)
    page.headerCrn().should('contain.text', 'X000001')
    page.headerName().should('contain.text', 'Caroline Wolff')
    page.pageHeading().should('contain.text', 'Overview')
    page.headerTier().should('contain.text', 'Tier: B2').and('have.attr', 'href')
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
      .should('contain.text', '1 prior breach on current order')
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
      .find('span')
      .should('contain.text', 'High')
      .should('have.attr', 'class', 'govuk-!-font-weight-bold rosh--high')

    cy.get('[data-qa="riskFlagsValue"] ul').eq(0).should('contain.text', 'Risk to public')

    cy.get('[data-qa="riskFlagsValue"] dt')
      .eq(1)
      .find('span')
      .should('contain.text', 'Medium')
      .should('have.attr', 'class', 'govuk-!-font-weight-bold rosh--medium')

    cy.get('[data-qa="riskFlagsValue"] ul').eq(1).should('contain.text', 'Domestic Abuse Perpetrator')

    cy.get('[data-qa="riskFlagsValue"] dt')
      .eq(2)
      .find('span')
      .should('contain.text', 'Low')
      .should('have.attr', 'class', 'govuk-!-font-weight-bold rosh--low')

    cy.get('[data-qa="riskFlagsValue"] ul').eq(2).should('contain.text', 'Risk to Known Adult')

    cy.get('[data-qa="riskFlagsValue"] dt')
      .eq(3)
      .find('span')
      .should('contain.text', 'Information only')
      .should('have.attr', 'class', 'govuk-!-font-weight-bold')

    cy.get('[data-qa="riskFlagsValue"] ul').eq(3).should('contain.text', 'Domestic Abuse Perpetrator')
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
