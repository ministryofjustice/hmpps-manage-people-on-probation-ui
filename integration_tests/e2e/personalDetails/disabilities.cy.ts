import DisabilitiesPage from '../../pages/personalDetails/disabilities'
import Page from '../../pages/page'

context('Contact', () => {
  it('Contact page is rendered', () => {
    cy.visit('/case/X000001/personal-details/disabilities')
    const page = Page.verifyOnPage(DisabilitiesPage)
    page.assertAnchorElementAtIndexWithin(
      'p',
      1,
      0,
      'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=EqualityMonitoring&CRN=X000001',
    )

    page.assertTextAtElementAtIndex('[class=govuk-summary-list__key]', 0, 'Disability')
    page.assertTextAtElementAtIndex('[class=govuk-summary-list__key]', 1, 'Start date')
    page.assertTextAtElementAtIndex('[class=govuk-summary-list__key]', 2, 'Notes')

    page.assertTextAtElementAtIndex('[class=govuk-summary-list__value]', 0, 'Dyslexia')
    page.assertTextAtElementAtIndex('[class=govuk-summary-list__value]', 1, '3 April 2021')
    page.assertTextAtElementAtIndex('[class=govuk-summary-list__value]', 2, 'Disability Notes')
  })

  it('Contact page is rendered', () => {
    cy.visit('/case/X000001/personal-details/disability/0/note/0')
    const page = Page.verifyOnPage(DisabilitiesPage)
    page.assertAnchorElementAtIndexWithin(
      'p',
      1,
      0,
      'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=EqualityMonitoring&CRN=X000001',
    )

    page.assertTextAtElementAtIndex('[class=govuk-summary-list__key]', 0, 'Disability')
    page.assertTextAtElementAtIndex('[class=govuk-summary-list__key]', 1, 'Start date')
    page.assertTextAtElementAtIndex('[class=govuk-summary-list__key]', 2, 'Note added by')
    page.assertTextAtElementAtIndex('[class=govuk-summary-list__key]', 3, 'Date added')
    page.assertTextAtElementAtIndex('[class=govuk-summary-list__key]', 4, 'Notes')

    page.assertTextAtElementAtIndex('[class=govuk-summary-list__value]', 0, 'Condition Unknown')
    page.assertTextAtElementAtIndex('[class=govuk-summary-list__value]', 1, '3 April 2021')
    page.assertTextAtElementAtIndex('[class=govuk-summary-list__value]', 2, 'Tom Brady')
    page.assertTextAtElementAtIndex('[class=govuk-summary-list__value]', 3, '30 October 2024')
    page.assertTextAtElementAtIndex('[class=govuk-summary-list__value]', 4, 'Disability Notes')
  })
})
