import Page from '../pages/page'
import PersonalDetailsPage from '../pages/personalDetails'
import PersonalCircumstancesPage from '../pages/personalCircumstances'
import AdjustmentsPage from '../pages/adjustments'
import { checkPopHeader } from './appointments/imports'

context('Personal Details', () => {
  beforeEach(() => {
    cy.task('resetMocks')
  })
  it('Personal Details page is rendered', () => {
    cy.visit('/case/X000001/personal-details')
    const page = Page.verifyOnPage(PersonalDetailsPage)
    page.assertRiskTags()
    page.headerCrn().should('contain.text', 'X000001')
    page.headerName().should('contain.text', 'Caroline Wolff')
    page.pageHeading().should('contain.text', 'Personal details')
    page.getTab('overview').should('contain.text', 'Overview')
    page.getTab('personalDetails').should('contain.text', 'Personal details')
    page.getTab('risk').should('contain.text', 'Risk')
    page.getTab('sentence').should('contain.text', 'Sentence')
    page.getTab('activityLog').should('contain.text', 'Contacts')
    page.getTab('compliance').should('contain.text', 'Compliance')
    page.getCardHeader('contactDetails').should('contain.text', 'Contact details')
    page.getCardHeader('personalDetails').should('contain.text', 'Personal details')
    page.getCardHeader('identityNumber').should('contain.text', 'Identity numbers')
    page.getCardHeader('staffContacts').should('contain.text', 'Staff contacts')
    page.getCardHeader('equalityMonitoring').should('contain.text', 'Equality monitoring')
    page.getRowData('contactDetails', 'telephoneNumber', 'Value').should('contain.text', '0123456999')
    page.getRowData('contactDetails', 'mobileNumber', 'Value').should('contain.text', '07783889300')
    page.getRowData('contactDetails', 'emailAddress', 'Value').should('contain.text', 'address1@gmail.com')
    page.getRowData('contactDetails', 'mainAddress', 'Value').should('contain.text', 'No fixed address')
    page.getRowData('contactDetails', 'otherAddresses', 'Value').should('contain.text', '1 other address')
    page.getRowData('contactDetails', 'contacts', 'Value').should('contain.text', 'Steve Wilson – GP (secondary)')
    page.getRowData('contactDetails', 'mainAddressNotes', 'Value').should('contain.text', 'Main Address')
    page.getElementData('telephoneNumberAction').should('exist')
    page.getElementData('mobileNumberAction').should('exist')
    page.getElementData('emailAddressAction').should('exist')
    page.getElementData('mainAddressAction').should('exist')
    page.getRowData('personalDetails', 'name', 'Value').should('contain.text', 'Caroline Wolff')
    page.getRowData('personalDetails', 'dateOfBirth', 'Value').should('contain.text', '18 August 1979')
    cy.get('[data-qa=dateOfDeathLabel]').should('not.exist')
    cy.get('[data-qa=dateOfDeathValue]').should('not.exist')
    page.getRowData('personalDetails', 'aliases', 'Value').should('contain.text', 'Jonny Smith')
    page.getRowData('personalDetails', 'previousSurname', 'Label').should('contain.text', 'Previous name')
    page.getRowData('personalDetails', 'previousSurname', 'Value').should('contain.text', 'Jones')
    page.getRowData('personalDetails', 'preferredLanguage', 'Value').should('contain.text', 'Urdu')
    page
      .getRowData('personalDetails', 'currentCircumstances', 'Value')
      .should('contain.text', 'Transferred to Crown Court: Is a Primary Carer')
    page
      .getRowData('personalDetails', 'disabilities', 'Value')
      .should('contain.text', 'Mental Health related disabilities')
    page.getRowData('personalDetails', 'adjustments', 'Value').should('contain.text', 'Handrails')
    page
      .getRowData('personalDetails', 'criminogenicNeeds', 'Value')
      .should('contain.text', 'Education, Training and Employability')
    cy.get('[data-qa="criminogenicNeedsValue')
      .find('a')
      .should('have.text', 'Sign in to OASys to view the sentence plan (opens in new tab)')
    page.getRowData('personalDetails', 'documents', 'Value').should('contain.text', 'Eula-Schmeler-X000001-UPW.pdf')
    page.getRowData('identityNumber', 'crn', 'Value').should('contain.text', 'X000001')
    page.getRowData('identityNumber', 'pnc', 'Value').should('contain.text', '1954/0018147W')
    page.getRowData('identityNumber', 'noms', 'Value').should('contain.text', 'G9566GQ')

    page
      .getRowData('staffContacts', 'staffContactRole', 'Label')
      .should('contain.text', 'Prison Offender Manager (POM)')
    page.getRowData('staffContacts', 'staffContactRole', 'Label').should('contain.text', '(responsible officer)')
    page
      .getRowData('staffContacts', 'staffContactLastUpdated', 'Label')
      .should('contain.text', 'Last updated 30 April 2024')
    page.getRowData('staffContacts', 'staffContactName', 'Value').should('contain.text', 'Arhsimna Xolfo')
    page
      .getRowData('staffContacts', 'staffContactRole', 'Label', 1)
      .should('contain.text', 'Community Offender Manager (COM)')
    page
      .getRowData('staffContacts', 'staffContactLastUpdated', 'Label', 1)
      .should('contain.text', 'Last updated 30 April 2024')
    page.getRowData('staffContacts', 'staffContactName', 'Value', 1).should('contain.text', 'Bruce Wayne')
    page.getCardHeader('staffContacts').find('a').should('contain.text', 'View staff contacts')
    page
      .getCardHeader('staffContacts')
      .find('a')
      .should('have.attr', 'href', '/case/X000001/personal-details/staff-contacts')

    page.getRowData('equalityMonitoring', 'religionOrBelief', 'Value').should('contain.text', 'Scientology')
    page.getRowData('equalityMonitoring', 'sex', 'Value').should('contain.text', 'Female')
    page.getRowData('equalityMonitoring', 'genderIdentity', 'Value').should('contain.text', 'Non-Binary')
    page.getRowData('equalityMonitoring', 'sexualOrientation', 'Value').should('contain.text', 'Heterosexual')
    cy.get('[data-qa="equalityMonitoringDeliusLink"]')
      .should('contain.text', 'View more equality monitoring on NDelius (opens in new tab)')
      .should('have.attr', 'target', '_blank')
      .should(
        'have.attr',
        'href',
        'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=EqualityMonitoring&CRN=X000001',
      )
  })

  it('Personal details page is rendered with date of death', () => {
    cy.task('stubPersonalDetailsDateOfDeath')
    cy.visit('/case/X000001/personal-details')
    cy.get('[data-qa="dateOfDeathWarning"]').should('contain.text', 'There is a date of death recorded for Caroline.')
    cy.get('[data-qa="dateOfBirthValue')
      .invoke('text')
      .then(text => {
        const normalizedText = text.replace(/\s+/g, ' ').trim()
        expect(normalizedText).to.eq(`18 August 1979`)
      })
    cy.get('[data-qa="dateOfDeathLabel"]').should('contain.text', 'Date of death')
    cy.get('[data-qa="dateOfDeathValue"]').should('contain.text', '11 September 2024 (45 years old)')
  })

  it('Personal details page is rendered for new san indicator assessment', () => {
    cy.task('stubSanIndicatorTrue')
    cy.visit('/case/X000001/personal-details')
    const page = Page.verifyOnPage(PersonalDetailsPage)
    cy.get('[data-qa="criminogenicNeedsValue"]').should('not.exist')
  })

  it('Personal Details page for a main address with a single note is rendered', () => {
    cy.visit('/case/X000001/personal-details/main-address/note/0')
    const page = Page.verifyOnPage(PersonalDetailsPage)
    page.getRowData('contactDetails', 'mobileNumber', 'Value').should('contain.text', '071838893')
    page.getRowData('contactDetails', 'telephoneNumber', 'Value').should('contain.text', '0123456999')
    page.getRowData('contactDetails', 'otherAddresses', 'Value').should('contain.text', '1 other address')
    page.getRowData('contactDetails', 'contacts', 'Value').should('contain.text', 'Steve Wilson – GP (secondary)')
    page.getRowData('contactDetails', 'mainAddress', 'Value').should('contain.text', 'No fixed address')
    page.getRowData('contactDetails', 'mainAddressNotes', 'Value').should('contain.text', 'Main Address')
    page.getRowData('contactDetails', 'emailAddress', 'Value').should('contain.text', 'address1@gmail.com')
  })

  it('Personal Details page where the main address does not any notes is rendered', () => {
    cy.visit('/case/X778160/personal-details')
    const page = Page.verifyOnPage(PersonalDetailsPage)
    page.getRowData('contactDetails', 'mainAddressNotes', 'Value').should('contain.text', 'No notes')
  })

  it('Personal circumstances page is rendered', () => {
    cy.visit('/case/X000001/personal-details/circumstances')
    const page = Page.verifyOnPage(PersonalCircumstancesPage)
    page
      .getCardHeader('personalCircumstances1')
      .should('contain.text', 'Committed/ Transferred to Crown')
      .should('contain.text', 'Life imprisonment (Adult)')

    page.getElementData('currentCircumstancesTitle').should('have.text', 'Current circumstances')

    page.getRowData('personalCircumstances1', 'type', 'Label').should('contain.text', 'Type')
    page.getRowData('personalCircumstances1', 'type', 'Value').should('contain.text', 'Committed/ Transferred to Crown')
    page.getRowData('personalCircumstances1', 'subType', 'Label').should('contain.text', 'Sub-type')
    page.getRowData('personalCircumstances1', 'subType', 'Value').should('contain.text', 'Life imprisonment (Adult)')
    page.getRowData('personalCircumstances1', 'startDate', 'Label').should('contain.text', 'Start date')
    page.getRowData('personalCircumstances1', 'startDate', 'Value').should('contain.text', '3 April 2021')
    page.getRowData('personalCircumstances1', 'endDate', 'Label').should('contain.text', 'End date')
    page.getRowData('personalCircumstances1', 'endDate', 'Value').should('contain.text', 'No end date selected')
    page.getRowData('personalCircumstances1', 'verified', 'Label').should('contain.text', 'Verified?')
    page.getRowData('personalCircumstances1', 'verified', 'Value').should('contain.text', 'Yes')
    page.getRowData('personalCircumstances1', 'notes', 'Label').should('contain.text', 'Notes')
    page.getRowData('personalCircumstances1', 'notes', 'Value').find('.app-note').should('have.length', 3)
    page
      .getRowData('personalCircumstances1', 'notes', 'Value')
      .find('.app-note')
      .eq(0)
      .find('p')
      .eq(0)
      .should('contain.text', 'Lorem ipsum dolor sit amet,')
    page
      .getRowData('personalCircumstances1', 'notes', 'Value')
      .find('.app-note')
      .eq(0)
      .find('p')
      .eq(1)
      .should('contain.text', 'Comment added by not entered')
    page
      .getRowData('personalCircumstances1', 'notes', 'Value')
      .find('.app-note')
      .eq(1)
      .find('p')
      .eq(0)
      .should('contain.text', 'Lorem ipsum dolor sit amet,')
    page
      .getRowData('personalCircumstances1', 'notes', 'Value')
      .find('.app-note')
      .eq(1)
      .find('p')
      .eq(1)
      .should('contain.text', 'Comment added by Harry Kane on 29 October 2024')
    cy.get('[data-qa="lastUpdatedBy"]').should('contain.text', 'Last updated by Paul Smith on 20 Mar 2023')
  })

  it('Personal circumstances page is rendered with no notes', () => {
    cy.task('stubNoCircumstanceNotes')
    cy.visit('/case/X000001/personal-details/circumstances')
    const page = Page.verifyOnPage(PersonalCircumstancesPage)
    page.getRowData('personalCircumstances1', 'notes', 'Value').should('contain.text', 'No notes')
  })

  it('Personal circumstances page is rendered with a note which is null', () => {
    cy.task('stubNullCircumstanceNote')
    cy.visit('/case/X000001/personal-details/circumstances')
    const page = Page.verifyOnPage(PersonalCircumstancesPage)
    page.getRowData('personalCircumstances1', 'notes', 'Value').find('.app-note').should('have.length', 1)
    page
      .getRowData('personalCircumstances1', 'notes', 'Value')
      .find('.app-note')
      .eq(0)
      .find('p')
      .eq(0)
      .should('contain.text', 'Lorem ipsum dolor')
    page
      .getRowData('personalCircumstances1', 'notes', 'Value')
      .find('.app-note')
      .eq(0)
      .find('p')
      .eq(1)
      .should('contain.text', 'Comment added by Harry Kane on 29 October 2024')
  })

  it('Personal circumstances page is rendered with previous circumstances', () => {
    cy.visit('/case/X000001/personal-details/circumstances')
    const page = Page.verifyOnPage(PersonalCircumstancesPage)
    page
      .getCardHeader('previousCircumstances1')
      .should('contain.text', 'Pregnancy')
      .should('contain.text', 'Pregnancy/Maternity')

    page.getElementData('previousCircumstancesTitle').should('have.text', 'Previous circumstances')

    page.getRowData('previousCircumstances1', 'type', 'Label').should('contain.text', 'Type')
    page.getRowData('previousCircumstances1', 'type', 'Value').should('contain.text', 'Pregnancy')
    page.getRowData('previousCircumstances1', 'subType', 'Label').should('contain.text', 'Sub-type')
    page.getRowData('previousCircumstances1', 'subType', 'Value').should('contain.text', 'Pregnancy/Maternity')
    page.getRowData('previousCircumstances1', 'startDate', 'Label').should('contain.text', 'Start date')
    page.getRowData('previousCircumstances1', 'startDate', 'Value').should('contain.text', '2 January 2020')
    page.getRowData('previousCircumstances1', 'endDate', 'Label').should('contain.text', 'End date')
    page.getRowData('previousCircumstances1', 'endDate', 'Value').should('contain.text', '2 September 2020')
    page.getRowData('previousCircumstances1', 'verified', 'Label').should('contain.text', 'Verified?')
    page.getRowData('previousCircumstances1', 'verified', 'Value').should('contain.text', 'Yes')
    page.getRowData('previousCircumstances1', 'notes', 'Label').should('contain.text', 'Notes')
    page.getRowData('previousCircumstances1', 'notes', 'Value').find('.app-note').should('have.length', 1)

    page.getRowData('previousCircumstances2', 'type', 'Label').should('contain.text', 'Type')
    page.getRowData('previousCircumstances2', 'type', 'Value').should('contain.text', 'Employment')
    page.getRowData('previousCircumstances2', 'subType', 'Label').should('contain.text', 'Sub-type')
    page.getRowData('previousCircumstances2', 'subType', 'Value').should('contain.text', 'Full Time Employed')
    page.getRowData('previousCircumstances2', 'startDate', 'Label').should('contain.text', 'Start date')
    page.getRowData('previousCircumstances2', 'startDate', 'Value').should('contain.text', '2 February 2021')
    page.getRowData('previousCircumstances2', 'endDate', 'Label').should('contain.text', 'End date')
    page.getRowData('previousCircumstances2', 'endDate', 'Value').should('contain.text', '17 December 2021')
    page.getRowData('previousCircumstances2', 'verified', 'Label').should('contain.text', 'Verified?')
    page.getRowData('previousCircumstances2', 'verified', 'Value').should('contain.text', 'Yes')
    page.getRowData('previousCircumstances2', 'notes', 'Label').should('contain.text', 'Notes')
    page.getRowData('previousCircumstances2', 'notes', 'Value').find('.app-note').should('have.length', 1)
  })

  it('Personal Details page for a personal circumstance with a single note is rendered', () => {
    cy.visit('/case/X000001/personal-details/circumstances/0/note/0')
    const page = Page.verifyOnPage(PersonalCircumstancesPage)
    page
      .getRowData('personalCircumstances', 'circumstanceType', 'Value')
      .should('contain.text', 'Committed/ Transferred to Crown')
    page
      .getRowData('personalCircumstances', 'circumstanceSubType', 'Value')
      .should('contain.text', 'Life imprisonment (Adult)')
    page.getRowData('personalCircumstances', 'circumstanceStartDate', 'Value').should('contain.text', '3 April 2021')
    page.getRowData('personalCircumstances', 'circumstanceVerified', 'Value').should('contain.text', 'Yes')
    page.getRowData('personalCircumstances', 'circumstanceNoteBaddedBy', 'Value').should('contain.text', 'Harry Kane')
    page
      .getRowData('personalCircumstances', 'circumstanceNoteDateAdded', 'Value')
      .should('contain.text', '29 October 2024')
    page
      .getRowData('personalCircumstances', 'circumstanceNote', 'Value')
      .should(
        'contain.text',
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit.\n      Cras vel ligula non eros porttitor tincidunt non vel ipsum. Quisque turpis erat, eleifend vitae tempus eget, posuere sit amet nunc.\n      Maecenas vestibulum diam nibh, non porttitor magna suscipit sed. Aliquam mollis urna turpis, egestas congue elit vehicula nec.\n      Nulla mattis tortor vel elit faucibus, vel vehicula nunc venenatis. Vivamus tortor dolor, convallis eu pulvinar id, venenatis at lorem. Duis dolor tortor, pretium ac interdum non, egestas vitae ipsum. Morbi vitae mi nec orci laoreet finibus. Vivamus ac bibendum diam. Donec eget vestibulum odio. Morbi rhoncus, turpis sed faucibus dapibus, justo enim feugiat velit, vel faucibus libero purus vel nulla. Maecenas eget purus arcu. Mauris consequat tempus pulvinar. Nulla volutpat vel arcu a tincidunt',
      )
  })

  it('Personal Details page for a personal adjustment with a single note is rendered', () => {
    cy.visit('/case/X000001/personal-details/adjustments/0/note/0')
    const page = Page.verifyOnPage(AdjustmentsPage)
    page.getRowData('personalAdjustment', 'adjustmentDescription', 'Value').should('contain.text', 'Hand Rails')
    page.getRowData('personalAdjustment', 'adjustmentStartDate', 'Value').should('contain.text', '3 April 2021')
    page.getRowData('personalAdjustment', 'adjustmentEndDate', 'Value').should('contain.text', '3 April 2025')
    page.getRowData('personalAdjustment', 'adjustmentNoteBaddedBy', 'Value').should('contain.text', 'Harry Kane')
    page.getRowData('personalAdjustment', 'adjustmentNoteDateAdded', 'Value').should('contain.text', '29 October 2024')
    page
      .getRowData('personalAdjustment', 'adjustmentNote', 'Value')
      .should(
        'contain.text',
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit.\n      Cras vel ligula non eros porttitor tincidunt non vel ipsum. Quisque turpis erat, eleifend vitae tempus eget, posuere sit amet nunc.\n      Maecenas vestibulum diam nibh, non porttitor magna suscipit sed. Aliquam mollis urna turpis, egestas congue elit vehicula nec.\n      Nulla mattis tortor vel elit faucibus, vel vehicula nunc venenatis. Vivamus tortor dolor, convallis eu pulvinar id, venenatis at lorem. Duis dolor tortor, pretium ac interdum non, egestas vitae ipsum. Morbi vitae mi nec orci laoreet finibus. Vivamus ac bibendum diam. Donec eget vestibulum odio. Morbi rhoncus, turpis sed faucibus dapibus, justo enim feugiat velit, vel faucibus libero purus vel nulla. Maecenas eget purus arcu. Mauris consequat tempus pulvinar. Nulla volutpat vel arcu a tincidunt',
      )
  })
  it('should display the pop header on the staff contacts page', () => {
    cy.visit('/case/X000001/personal-details/staff-contacts')
    checkPopHeader('Caroline Wolff')
  })
  it('should display the pop header on the adjustments page', () => {
    cy.visit('/case/X000001/personal-details/adjustments')
    checkPopHeader()
  })
  it('should display the pop header on the disabilities page', () => {
    cy.visit('/case/X000001/personal-details/disabilities')
    checkPopHeader()
  })
  it('should display the pop header on the contacts page', () => {
    cy.visit('/case/X000001/personal-details/personal-contact/2500233993')
    checkPopHeader()
  })
  it('should display the pop header on the personal circumstances page', () => {
    cy.visit('/case/X000001/personal-details/circumstances')
    checkPopHeader()
  })
  it('should display the pop header on the personal addresses page', () => {
    cy.visit('/case/X000001/personal-details/addresses')
    checkPopHeader()
  })
  it('should display the pop header on the edit contact details page', () => {
    cy.visit('/case/X000001/personal-details/edit-contact-details')
    checkPopHeader()
  })
})
