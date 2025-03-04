import Page from '../pages/page'
import RiskPage from '../pages/risk'
import RemovedRiskPage from '../pages/removedRisk'
import RemovedRiskDetailPage from '../pages/removedRiskDetail'
import RiskDetailPage from '../pages/riskDetail'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import mockRiskData from '../../wiremock/mappings/X000001-risk.json'
import { RiskFlag } from '../../server/data/model/risk'
import { dateWithYear, toSentenceCase } from '../../server/utils/utils'

const mockRiskFlags: RiskFlag[] = mockRiskData.mappings.find(
  (mapping: any) => mapping.request.urlPattern === '/mas/risk-flags/X000001',
).response.jsonBody.riskFlags

context('Risk', () => {
  it('Risk overview page is rendered', () => {
    cy.visit('/case/X000001/risk')
    const page = Page.verifyOnPage(RiskPage)
    page.getElementData('highScoringNeedsValue').should('contain.text', 'Relationships')
    page.getElementData('lowScoringNeedsValue').should('contain.text', 'Accommodation')
    page.getElementData('noScoreNeedsValue').should('contain.text', 'Emotional wellbeing')
    page.getElementData('mappa-heading').should('contain.text', 'Cat 0/Level 2')
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

    for (let i = 0; i < mockRiskFlags.length; i += 1) {
      const index = i + 1
      const { level, description, notes, createdDate, nextReviewDate } = mockRiskFlags[i]
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
      page.getRowData('riskFlags', `risk${index}Notes`, 'Value').should('contain.text', notes)
      page.getRowData('riskFlags', `risk${index}DateAdded`, 'Value').should('contain.text', dateWithYear(createdDate))
      page
        .getRowData('riskFlags', `risk${index}NextReviewDate`, 'Value')
        .should('contain.text', dateWithYear(nextReviewDate))
      if (level === 'HIGH') {
        page.getRowData('riskFlags', `risk${index}NextReviewDate`, 'Value').should('contain.text', 'Overdue')
      }
    }
    page
      .getElementData('viewRemovedRiskFlagsLink')
      .should('contain.text', 'View removed risk flags (3)')
      .should('have.attr', 'href', '/case/X000001/risk/removed-risk-flags')
    page
      .getElementData('oasysViewRiskAssessmentLink')
      .should('contain.text', 'View the full risk assessment on OASys (opens in new tab).')
      .should('have.attr', 'target', '_blank')
      .should('have.attr', 'href', 'https://oasys-dummy-url')
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
    page.getRowData('riskFlag', 'riskFlagNotes', 'Value').should('contain.text', 'Some notes')
    page
      .getRowData('riskFlag', 'mostRecentReviewDate', 'Value')
      .should('contain.text', '12 December 2023 by Paul Smith')
    page.getRowData('riskFlag', 'createdDate', 'Value').should('contain.text', '12 December 2023 by Paul Smith')
  })
  it('Risk Detail page is rendered', () => {
    cy.visit('/case/X000001/risk/flag/2')
    const page = new RiskDetailPage()
    page.setPageTitle('Domestic Abuse Perpetrator')
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
    page.getRowData('riskFlag', 'riskFlagNotes', 'Value').should('contain.text', 'Some notes')
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
      .should('contain.text', 'View guidance on risk flags in the NDelius SharePoint')
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
    page.setPageTitle('Restraining Order')
    page.getRowData('riskFlag', 'nextReviewDate', 'Value').find('.govuk-tag--red').should('contain.text', 'Overdue')
  })
  it('Risk page is rendered with create a risk assessment on OASys link', () => {
    cy.visit('/case/X801756/risk')
    const page = new RiskDetailPage()
    page.getElementData('oasysViewRiskAssessmentLink').should('not.exist')
    page.getElementData('oasysCreateRiskAssessmentLink').should('not.exist')
  })
  it('Risk page is rendered with no OASys Layer 3 risk assessment', () => {
    cy.visit('/case/X778160/risk')
    const page = new RiskDetailPage()
    page
      .getElementData('noOasysRiskBanner')
      .should('exist')
      .find('h2')
      .should('contain.text', 'There is no OASys Layer 3 risk assessment for Alton Berge')

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
})
