import Page from '../../../pages'
import PreviousOrderPage from '../../../pages/sentence/previous-orders/previous-order'
import { monthsOrDaysElapsed } from '../../../../server/utils/utils'

context('Sentence', () => {
  it('Previous order page is rendered', () => {
    cy.visit('/case/X000001/sentence/previous-orders/3')

    const page = Page.verifyOnPage(PreviousOrderPage)
    const breadCrumbElement = '.govuk-breadcrumbs__list-item'

    page.assertTextElementAtIndex('.govuk-caption-l', 0, 'Previous orders')
    page.assertAnchorElementAtIndex(breadCrumbElement, 0, '/case')
    page.assertTextAtElementAtIndex(breadCrumbElement, 0, 'Cases')

    page.assertAnchorElementAtIndex(breadCrumbElement, 1, '/case/X000001')
    page.assertTextAtElementAtIndex(breadCrumbElement, 1, 'Caroline Wolff')

    page.assertAnchorElementAtIndex(breadCrumbElement, 2, '/case/X000001/sentence')
    page.assertTextAtElementAtIndex(breadCrumbElement, 2, 'Sentence')

    page.assertAnchorElementAtIndex(breadCrumbElement, 3, '/case/X000001/sentence/previous-orders')
    page.assertTextAtElementAtIndex(breadCrumbElement, 3, 'Previous orders')

    page.assertPageElementAtIndexWithin('section', 0, 'h2', 0, 'Offence')
    page.assertPageElementAtIndexWithin('section', 0, 'dt', 0, 'Main offence')
    page.assertPageElementAtIndexWithin('section', 0, 'dt', 1, 'Offence date')
    page.assertPageElementAtIndexWithin('section', 0, 'dt', 2, 'Notes')
    page.assertPageElementAtIndexWithin('section', 0, 'dt', 3, 'Additional offences')
    page.assertPageElementAtIndexWithin('section', 0, 'dd', 0, 'Speeding (1 count)')
    page.assertPageElementAtIndexWithin('section', 0, 'dd', 1, '20 January 2024')
    page.assertPageElementAtIndexWithin('section', 0, 'dd', 2, 'My note')
    page.assertPageElementAtIndexWithin('section', 0, 'dd', 3, 'Burglary (2 count)')

    page.assertPageElementAtIndexWithin('section', 1, 'h2', 0, 'Conviction')
    page.assertPageElementAtIndexWithin('section', 1, 'dt', 0, 'Sentencing court')
    page.assertPageElementAtIndexWithin('section', 1, 'dt', 1, 'Responsible court')
    page.assertPageElementAtIndexWithin('section', 1, 'dt', 2, 'Conviction date')
    page.assertPageElementAtIndexWithin('section', 1, 'dt', 3, 'Additional sentences')
    page.assertPageElementAtIndexWithin('section', 1, 'dd', 0, 'Hull Court')
    page.assertPageElementAtIndexWithin('section', 1, 'dd', 1, 'Birmingham Court')
    page.assertPageElementAtIndexWithin('section', 1, 'dd', 2, '20 March 2024')
    page.assertPageElementAtIndexWithin('section', 1, 'dd', 3, 'Disqualified from Driving')

    page.assertPageElementAtIndexWithin('section', 2, 'h2', 0, 'Sentence')
    page.assertPageElementAtIndexWithin('section', 2, 'dt', 0, 'Order')
    page.assertPageElementAtIndexWithin('section', 2, 'dt', 1, 'Sentence start date')
    page.assertPageElementAtIndexWithin('section', 2, 'dt', 2, 'Sentence end date')
    page.assertPageElementAtIndexWithin('section', 2, 'dt', 3, 'Terminated date')
    page.assertPageElementAtIndexWithin('section', 2, 'dt', 4, 'Termination reason')
    page.assertPageElementAtIndexWithin('section', 2, 'dt', 5, 'Court documents')
    page.assertPageElementAtIndexWithin('section', 2, 'dd', 0, '12 month community order')
    page.assertPageElementAtIndexWithin('section', 2, 'dd', 1, '1 February 2024')
    page.assertPageElementAtIndexWithin('section', 2, 'dd', 2, '1 November 2024')
    page.assertPageElementAtIndexWithin('section', 2, 'dd', 3, '31 January 2025')
    const monthsElapsed = monthsOrDaysElapsed('2024-02-01')
    page.assertPageElementAtIndexWithin('section', 2, 'dd', 4, `${monthsElapsed} elapsed (of 12 months)`)
    page.assertPageElementAtIndexWithin('section', 2, 'dd', 5, 'Pre-sentence report')
  })
})
