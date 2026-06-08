import Page from '../../pages/page'

export interface ExpectedOption<TPage extends Page> {
  value: string
  text: string
  hint?: string
  RedirectPage?: Constructor<TPage>
  redirectPageName?: string
  redirectPageTitle?: string
}

export type Journey = 'MANAGE' | 'RESCHEDULE' | 'ARRANGE'

type Constructor<T = any> = new (...args: any[]) => T

export const checkOptions = <TPage extends Page>(options: ExpectedOption<TPage>[], radioGroupIndex = 0): void => {
  options.forEach(({ value, text, hint }, index) => {
    cy.get('[data-module="govuk-radios"]')
      .eq(radioGroupIndex)
      .find('.govuk-radios__item')
      .eq(index)
      .find('label')
      .should('contain.text', text)
    if (hint) {
      cy.get('[data-module="govuk-radios"]')
        .eq(radioGroupIndex)
        .find('.govuk-radios__item')
        .eq(index)
        .find('.govuk-hint')
        .should('contain.text', hint)
    }
    cy.get('[data-module="govuk-radios"]')
      .eq(radioGroupIndex)
      .find(`.govuk-radios__input[value=${value}]`)
      .should('exist')
  })
}

export const checkOptionRedirectsToCorrectPage = <TPage extends Page, TArgs extends Record<string, any>>(
  options: ExpectedOption<TPage>[],
  loadPageFunc: (args: any) => void,
  args: TArgs = {} as TArgs,
): void => {
  options.forEach(({ value, RedirectPage, redirectPageTitle }) => {
    loadPageFunc(args)
    const outcomePage = new args.Page()
    cy.get(`.govuk-radios__input[value=${value}]`).click()
    outcomePage.getSubmitBtn().click()
    const page = new RedirectPage()
    page.checkPageTitle(redirectPageTitle)
  })
}

export const checkBreachOrRecallWarningBanner = <TArgs extends Record<string, any>>(
  loadPageFunc: (args: any) => void,
  args: TArgs = {} as TArgs,
): void => {
  describe('Breach warning banner', () => {
    it('should show when sentence type is COMMUNITY and there is an active breach', () => {
      cy.task('stubCompliance')
      loadPageFunc(args)
      const page = new args.Page()
      page.getBreachOrRecallWarning().find('h2').should('contain.text', 'There is a live breach for this sentence')
      page
        .getBreachOrRecallWarning()
        .find('span')
        .should('contain.text', 'The breach for 12 month community order was initiated on 15 January 2024.')
    })
    it('should not show when sentence type is COMMUNITY and there is no active breach', () => {
      cy.task('stubAppointment', { eventId: '2501192724', type: 'COMMUNITY' })
      cy.task('stubCompliance', { activeBreach: false })
      loadPageFunc(args)
      const page = new args.Page()
      page.getBreachOrRecallWarning().should('not.exist')
    })
  })

  describe('Recall warning banner', () => {
    beforeEach(() => {
      cy.task('resetMocks')
    })
    it('should show when sentence type is CUSTODY and there is an active recall', () => {
      cy.task('stubCompliance', { activeBreach: false, activeRecall: true })
      loadPageFunc({ ...args, sentenceType: 'CUSTODY' })
      const page = new args.Page()
      page
        .getBreachOrRecallWarning({ type: 'recall' })
        .find('h2')
        .should('contain.text', 'There is a live recall for this sentence')
      page
        .getBreachOrRecallWarning({ type: 'recall' })
        .find('span')
        .should('contain.text', 'The recall for 12 month community order was initiated on 15 January 2024.')
    })
    it('should not show when sentence type is CUSTODY and there is no active recall', () => {
      cy.task('stubAppointment', { eventId: '2501192724', type: 'COMMUNITY' })
      cy.task('stubCompliance', { activeBreach: false, activeRecall: false })
      loadPageFunc(args)
      const page = new args.Page()
      page.getBreachOrRecallWarning({ type: 'recall' }).should('not.exist')
    })
  })
}
