import Page from '../pages/page'
import RiskPage from '../pages/risk'
import RemovedRiskPage from '../pages/removedRisk'
import RemovedRiskDetailPage from '../pages/removedRiskDetail'
import RiskDetailPage from '../pages/riskDetail'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import mockRiskData from '../../wiremock/mappings/X000001-risk.json'
import { RiskFlag } from '../../server/data/model/risk'
import { dateWithYear, toSentenceCase } from '../../server/utils'
import { checkPopHeader } from './appointments/imports'

const mockRiskFlags: RiskFlag[] = mockRiskData.mappings.find(
  (mapping: any) => mapping.request.urlPattern === '/mas/risk-flags/X000001',
).response.jsonBody.riskFlags

const checkRiskPageView = (page: RiskPage, sanIndicator = false) => {
  const headingLevel = !sanIndicator ? '3' : '4'
  page.getElementData('rsr').should('exist')
  page.getElementData('rsr').get(`h${headingLevel}`).should('contain.text', 'RSR (risk of serious recidivism)')

  page.getElementData('ogrs').should('exist')
  page.getElementData('ogrs').get(`h${headingLevel}`).should('contain.text', 'OGRS (offender group reconviction scale)')
  page.getElementData('ogrs-1yr').should('have.text', '3%')
  page.getElementData('ogrs-2yr').should('have.text', '6%')
  page.getElementData('ogrs-level').should('have.text', 'Low')

  page.getElementData('ovp').should('exist')
  page.getElementData('ovp').get(`h${headingLevel}`).should('contain.text', 'OVP (OASys violent predictor score)')
  page.getElementData('ovp-1yr').should('have.text', '4%')
  page.getElementData('ovp-2yr').should('have.text', '10.2%')
  page.getElementData('ovp-level').should('have.text', 'Medium')

  page.getElementData('ogp').should('exist')
  page.getElementData('ogp').get(`h${headingLevel}`).should('contain.text', 'OGP (OASys general predictor score)')
  page.getElementData('ogp-1yr').should('have.text', '5%')
  page.getElementData('ogp-2yr').should('have.text', '28.8%')
  page.getElementData('ogp-level').should('have.text', 'High')

  page.getElementData('riskFlagsCard').should('exist')
  for (let i = 0; i < mockRiskFlags.length; i += 1) {
    const index = i + 1
    const { level, description, riskNotes, createdDate, nextReviewDate } = mockRiskFlags[i]
    page.getRowData('riskFlags', `risk${index}Level`, 'Value').should('contain.text', toSentenceCase(level))
    const classes = level !== 'INFORMATION_ONLY' ? ` rosh--${level.toLowerCase()}` : ''
    page
      .getElementData(`risk${index}LevelValue`)
      .find('span')
      .should('have.attr', 'class', `govuk-!-font-weight-bold${classes}`)
    page.getRowData('riskFlags', `risk${index}Description`, 'Value').should('contain.text', description)
    page
      .getElementData(`risk${index}DescriptionValue`)
      .find('a')
      .should('have.attr', 'href', `/case/X000001/risk/flag/${index}`)
    page.getRowData('riskFlags', `risk${index}DateAdded`, 'Value').should('contain.text', dateWithYear(createdDate))
    page
      .getRowData('riskFlags', `risk${index}NextReviewDate`, 'Value')
      .should('contain.text', dateWithYear(nextReviewDate))
    if (level === 'HIGH') {
      page.getRowData('riskFlags', `risk${index}NextReviewDate`, 'Value').should('contain.text', 'Overdue')
    }
  }
  page.assertPageElementAtIndexWithin('[data-qa=riskFlagsCard]', 0, 'td', 2, 'No notes')
  page.assertPageElementAtIndexWithin('[data-qa=riskFlagsCard]', 0, 'td', 7, 'Risk Notes 1')

  page
    .getElementData('viewRemovedRiskFlagsLink')
    .should('contain.text', 'View removed risk flags (3)')
    .should('have.attr', 'href', '/case/X000001/risk/removed-risk-flags')

  page.getCardHeader('riskFlags').should('contain.text', 'NDelius risk flags')
  page
    .getElementData('addRiskFlagLink')
    .should('contain.text', 'Add a risk flag in NDelius (opens in new tab)')
    .parent()
    .should(
      'have.attr',
      'href',
      'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=RegisterSummary&CRN=X000001',
    )

  page.getElementData('opd').should('exist')
  page.getElementData('opd').get(`h${headingLevel}`).should('contain.text', 'Offender personality disorder (OPD)')

  page.getElementData('mappa-heading').should('contain.text', 'Cat 0/').should('contain.text', 'Level 2')

  page.getElementData('riskToLabelValue1').should('contain.text', 'Children')
  page.getElementData('riskToLabelValue2').should('contain.text', 'Staff')
  page.getElementData('riskToLabelValue3').should('contain.text', 'Known adult')
  page.getElementData('riskToLabelValue4').should('contain.text', 'Public')
  page.getElementData('riskToLabelValue5').should('contain.text', 'Prisoners')

  page.getElementData('riskToCommunityValue1').should('contain.text', 'Low')
  page.getElementData('riskToCommunityValue2').should('contain.text', 'Very high')
  page.getElementData('riskToCommunityValue3').should('contain.text', 'Medium')
  page.getElementData('riskToCommunityValue4').should('contain.text', 'High')
  page.getElementData('riskToCommunityValue5').should('contain.text', 'N/A')

  page.getElementData('riskToCustodyValue1').should('contain.text', 'Low')
  page.getElementData('riskToCustodyValue2').should('contain.text', 'Low')
  page.getElementData('riskToCustodyValue3').should('contain.text', 'Low')
  page.getElementData('riskToCustodyValue4').should('contain.text', 'Very high')
  page.getElementData('riskToCustodyValue5').should('contain.text', 'Low')

  if (!sanIndicator) {
    page.getElementData('criminogenicNeeds').find('h3').should('contain.text', 'Criminogenic needs')
    page
      .getElementData('oasysViewRiskAssessmentLink')
      .should('contain.text', 'View the full risk assessment on OASys (opens in new tab).')
      .should('have.attr', 'target', '_blank')
      .should('have.attr', 'href', 'https://oasys-dummy-url')
    page.getElementData('highScoringNeedsValue').should('contain.text', 'Relationships')
    page.getElementData('lowScoringNeedsValue').should('contain.text', 'Accommodation')
    page.getElementData('noScoreNeedsValue').should('contain.text', 'Emotional wellbeing')
    page.getInsetText().should('contain.text', 'Last updated (OASys): 24 January 2024')
    page.getElementData('osp').should('exist')
    page.getElementData('riskFlagsCard').then($riskFlagsCard => {
      page.getElementData('opd').then($opd => {
        // Check risk flags card is before opd
        expect(Cypress.$($riskFlagsCard).index()).to.be.lessThan(Cypress.$($opd).index())
      })
    })
    page.getElementData('oasysScoreHistory').should('exist')
    page.getElementData('plan').should('not.exist')
  }
  if (sanIndicator) {
    page.getElementData('criminogenicNeeds').should('not.exist')
    page.getInsetText().should('not.exist')
    cy.get('h3').should('contain.text', 'Risk')
    page.getElementData('osp').should('not.exist')
    page.getElementData('riskFlagsCard').then($riskFlagsCard => {
      page.getElementData('opd').then($opd => {
        // Check risk flags card is after opd
        expect(Cypress.$($opd).index()).to.be.lessThan(Cypress.$($riskFlagsCard).index())
      })
    })
    page.getElementData('oasysScoreHistory').should('not.exist')
    page.getElementData('plan').should('exist')
    page.getElementData('plan').get('h4').should('contain.text', 'Plan')
    page.getElementData('plan').find('p').eq(0).should('contain.text', 'Last updated: 24 January 2024')
    page.getElementData('plan').find('a').should('contain.text', 'View the sentence plan (opens in new tab)')
    page.getElementData('plan').find('a').should('have.attr', 'href', '#')
  }
}

context('Risk', () => {
  beforeEach(() => {
    cy.task('resetMocks')
  })
  it('Risk overview page is rendered when san indicator is false', () => {
    cy.visit('/case/X000001/risk')
    const page = new RiskPage()
    page.checkPageTitle('Risk')
    checkRiskPageView(page)
  })

  it('Risk overview page is rendered when san indicator is true', () => {
    cy.task('stubSanIndicatorTrue')
    cy.visit('/case/X000001/risk')
    const page = new RiskPage()
    page.checkPageTitle('Risk and plan')
    const sanIndicator = true
    checkRiskPageView(page, sanIndicator)
  })

  it('Removed risk page is rendered', () => {
    cy.visit('/case/X000001/risk/removed-risk-flags')
    const page = Page.verifyOnPage(RemovedRiskPage)
    page.getRowData('removedRisks', 'removedRisk1', 'Value').should('contain.text', 'Restraining Order')
    page.getRowData('removedRisks', 'removedRisk2', 'Value').should('contain.text', 'Domestic Abuse Perpetrator')
    page.getRowData('removedRisks', 'removedRisk3', 'Value').should('contain.text', 'Risk to Known Adult')
  })
  it('Removed Risk Detail page is rendered', () => {
    cy.visit('/case/X000001/risk/flag/4')
    const page = Page.verifyOnPage(RemovedRiskDetailPage)
    page.getRowData('riskFlagRemoved', 'removalDate', 'Value').should('contain.text', '18 November 2022 by Paul Smith')
    page.getRowData('riskFlagRemoved', 'removalNotes', 'Value').should('contain.text', 'Some removal notes')
    page.getCardHeader('riskFlag').should('contain.text', 'Before it was removed')
    page.getRowData('riskFlag', 'riskFlagNotes', 'Value').should('contain.text', 'Risk Notes 4')
    page
      .getRowData('riskFlag', 'mostRecentReviewDate', 'Value')
      .should('contain.text', '12 December 2023 by Paul Smith')
    page.getRowData('riskFlag', 'createdDate', 'Value').should('contain.text', '12 December 2023 by Paul Smith')
    page.assertAnchorElementAtIndex('[data-qa=riskFlagRemovedCard]', 0, '/case/X000001/risk/flag/4/risk-removal-note/0')
    page.assertAnchorElementAtIndex('[data-qa=riskFlagCard]', 0, '/case/X000001/risk/flag/4/note/1')
  })
  it('Risk Detail page is rendered', () => {
    cy.visit('/case/X000001/risk/flag/2')
    const page = new RiskDetailPage()
    page.checkPageTitle('Domestic Abuse Perpetrator')
    cy.get('.govuk-caption-l').should('contain.text', 'Risk flag')
    page.getCardHeader('riskFlag').should('contain.text', 'About this flag')
    page
      .getCardHeader('riskFlag')
      .find('a')
      .should('contain.text', 'Edit risk details on NDelius (opens in a new tab)')
      .should(
        'have.attr',
        'href',
        'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=RegisterSummary&CRN=X000001',
      )
      .should('have.attr', 'target', '_blank')
    page.getRowData('riskFlag', 'riskFlagNotes', 'Label').should('contain.text', 'Notes')
    page.getRowData('riskFlag', 'riskFlagNotes', 'Value').should('contain.text', 'Risk Notes 1')
    page.getRowData('riskFlag', 'nextReviewDate', 'Label').should('contain.text', 'Next review')
    page.getRowData('riskFlag', 'nextReviewDate', 'Value').should('contain.text', '18 August 2025')
    page.getRowData('riskFlag', 'mostRecentReviewDate', 'Label').should('contain.text', 'Most recent review')
    page
      .getRowData('riskFlag', 'mostRecentReviewDate', 'Value')
      .should('contain.text', '18 December 2023 by Paul Smith')
    page.getRowData('riskFlag', 'createdDate', 'Label').should('contain.text', 'Date added')
    page.getRowData('riskFlag', 'createdDate', 'Value').should('contain.text', '18 December 2022 by Paul Smith')
    cy.get('[data-qa="riskFlagGuidanceLink"]')
      .should('contain.text', '(opens in new tab)')
      .find('a')
      .should('contain.text', 'View guidance on risk flags in the NDelius SharePoint (opens in new tab)')
      .should('have.attr', 'target', '_blank')
      .should(
        'have.attr',
        'href',
        'https://justiceuk.sharepoint.com/sites/HMPPS-HQ-NDST-ATW/Shared%20Documents/Forms/AllItems.aspx?csf=1&web=1&e=iEFxub&CID=82b28f43%2Dc021%2D465a%2Dbce3%2D11c8eb64c791&FolderCTID=0x012000789EB5A24184864D90305EEA82661286&id=%2Fsites%2FHMPPS%2DHQ%2DNDST%2DATW%2FShared%20Documents%2FNational%20Delius%20Guidance%2FNational%20Delius%20Case%20Recording%20Instructions%2FCRI019%20Registrations&sortField=Modified&isAscending=false&viewid=330f3b0b%2D9b57%2D4427%2Dad3f%2D8d5cffdc3885',
      )
  })
  it('Risk Detail page is rendered with expired review date', () => {
    cy.visit('/case/X000001/risk/flag/1')
    const page = new RiskDetailPage()
    page.checkPageTitle('Risk to Staff')
    page.getRowData('riskFlag', 'nextReviewDate', 'Value').find('.govuk-tag--red').should('contain.text', 'Overdue')
  })
  it('Risk page is rendered with create a risk assessment on OASys link', () => {
    cy.visit('/case/X801756/risk')
    const page = new RiskDetailPage()
    page.getElementData('oasysViewRiskAssessmentLink').should('exist')
    page.getElementData('oasysCreateRiskAssessmentLink').should('not.exist')
  })
  it('Risk page is rendered with no OASys Layer 3 risk assessment', () => {
    cy.visit('/case/X778160/risk')
    const page = new RiskDetailPage()
    page
      .getElementData('noOasysRiskBanner')
      .should('exist')
      .find('h3')
      .should('contain.text', 'There is no OASys Layer 3 risk assessment')

    cy.get('[data-qa="noOasysRiskBanner"]')
      .find('.govuk-notification-banner__content')
      .should('contain.text', 'We do not know:')
      .should('contain.text', 'Risk of serious harm (ROSH) in the community')
      .should('contain.text', 'Risk of serious harm to themselves')

    page
      .getElementData('noOasysRiskBanner')
      .find('a')
      .should('contain.text', 'Create a risk assessment on OASys (opens in new tab).')
      .should('have.attr', 'target', '_blank')
      .should('have.attr', 'href', 'https://oasys-dummy-url')
  })
  it('Risk flag page is rendered with a single note', () => {
    cy.visit('/case/X000001/risk/flag/3/note/0')
    const page = new RiskDetailPage()
    page.assertPageElementAtIndexWithin('[data-qa=riskFlagCard]', 0, 'dt', 0, 'Note added by')
    page.assertPageElementAtIndexWithin('[data-qa=riskFlagCard]', 0, 'dt', 1, 'Date added')
    page.assertPageElementAtIndexWithin('[data-qa=riskFlagCard]', 0, 'dt', 2, 'Note')

    page.assertPageElementAtIndexWithin('[data-qa=riskFlagCard]', 0, 'dd', 0, 'Tom Brady')
    page.assertPageElementAtIndexWithin('[data-qa=riskFlagCard]', 0, 'dd', 1, '30 October 2024')
    page.assertPageElementAtIndexWithin('[data-qa=riskFlagCard]', 0, 'dd', 2, 'Risk Notes')
  })
  it('Risk flag page is rendered with a single removal note', () => {
    cy.visit('case/X000001/risk/flag/4/risk-removal-note/0')
    const page = new RiskDetailPage()

    page.assertPageElementAtIndexWithin('[data-qa=riskFlagRemovedCard]', 0, 'dt', 0, 'Date removed')
    page.assertPageElementAtIndexWithin('[data-qa=riskFlagRemovedCard]', 0, 'dt', 1, 'Note added by')
    page.assertPageElementAtIndexWithin('[data-qa=riskFlagRemovedCard]', 0, 'dt', 2, 'Date added')
    page.assertPageElementAtIndexWithin('[data-qa=riskFlagRemovedCard]', 0, 'dt', 3, 'Note')

    page.assertPageElementAtIndexWithin('[data-qa=riskFlagRemovedCard]', 0, 'dd', 0, '18 November 2022 by Paul Smith')
    page.assertPageElementAtIndexWithin('[data-qa=riskFlagRemovedCard]', 0, 'dd', 1, 'Bruce Banner')
    page.assertPageElementAtIndexWithin('[data-qa=riskFlagRemovedCard]', 0, 'dd', 2, '30 October 2024')
    page.assertPageElementAtIndexWithin('[data-qa=riskFlagRemovedCard]', 0, 'dd', 3, 'Some removal notes')

    page.assertPageElementAtIndexWithin('[data-qa=riskFlagCard]', 0, 'dt', 0, 'Notes')
    page.assertPageElementAtIndexWithin('[data-qa=riskFlagCard]', 0, 'dt', 1, 'Most recent review')
    page.assertPageElementAtIndexWithin('[data-qa=riskFlagCard]', 0, 'dt', 2, 'Date added')

    page.assertPageElementAtIndexWithin('[data-qa=riskFlagCard]', 0, 'dd', 0, 'Risk Notes 4')
    page.assertPageElementAtIndexWithin('[data-qa=riskFlagCard]', 0, 'dd', 1, '12 December 2023 by Paul Smith')
    page.assertPageElementAtIndexWithin('[data-qa=riskFlagCard]', 0, 'dd', 2, '12 December 2022 by Paul Smith')
  })
  it('Risk flag page is rendered with a truncated note', () => {
    cy.visit('/case/X000001/risk/flag/3')
    const page = new RiskDetailPage()
    page.assertPageElementAtIndexWithin('[data-qa=riskFlagCard]', 0, 'dt', 0, 'Notes')
    page.assertPageElementAtIndexWithin('[data-qa=riskFlagCard]', 0, 'dd', 0, 'Risk Notes')
    page.assertAnchorElementAtIndexWithin('[data-qa=riskFlagCard]', 0, 1, '/case/X000001/risk/flag/3/note/0')
  })
  it('should display the pop header on the removed risk flags page', () => {
    cy.visit('/case/X000001/risk/removed-risk-flags')
    checkPopHeader()
  })
  it('should display the pop header on the individual risk flag page', () => {
    cy.visit('/case/X000001/risk/flag/4')
    checkPopHeader()
  })
})
