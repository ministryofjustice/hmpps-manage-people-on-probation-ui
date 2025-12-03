import { Browser, BrowserContext, expect, Page, test } from '@playwright/test'
import * as dotenv from 'dotenv'
import { Person } from '@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/utils/person.mjs'
import {
  buildAddress,
  Address,
} from '@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/address/create-address.mjs'
import { login as loginToManageMySupervision } from '@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/manage-a-supervision/login.mjs'
import loginDeliusAndCreateOffender from '../steps/delius/create-offender/createOffender'

import addPersonalDetails from '../steps/delius/add-personal-details/addPersonalDetails'
import { createPersonalContact } from '../steps/delius/create-personal-contact/createPersonalContact'
import addAddress from '../steps/delius/add-address/addAddress'
import {
  assertAddressDetails,
  loginMasAndGoToPersonalDetails,
  searchForCrn,
} from '../steps/mas/personal-details/personalDetails'
import { formatDate } from '../steps/delius/utils/utils'

dotenv.config({ path: 'e2e_tests/.env' }) // read environment variables into process.env

const todaysDate = formatDate(new Date())

let crn: string
let person: Person
let mobileNumber: string
let telephoneNumber: string
let email: string
let mainAddressType: string
let mainAddress: Address
let addressType: string
let otherAddress: Address
let contactName: string
let contactPhoneNumber: string
let contactEmail: string
let contactAddress: Address

// Create a context and page manually for beforeAll
let browser: Browser
let context: BrowserContext
let page: Page

test.describe('Delius Details Verification', () => {
  test.beforeAll(async ({ browser: b }) => {
    test.setTimeout(120000)
    browser = b
    context = await browser.newContext()
    page = await context.newPage()

    // Log in to Delius and create a new person record
    ;[person, crn] = await loginDeliusAndCreateOffender(page)

    // Add personal details, main address, secondary address, and personal contact details
    ;({ mobileNumber, telephoneNumber, email } = await addPersonalDetails(page, crn))
    ;({ type: mainAddressType, address: mainAddress } = await addAddress(page, crn, 'Main', 'mainAddressTable'))
    ;({ type: addressType, address: otherAddress } = await addAddress(page, crn, 'Secondary', 'otherAddressTable'))

    // Initialize contactAddress
    contactAddress = buildAddress()
    ;({ contactName, contactPhoneNumber, contactEmail } = await createPersonalContact(page, crn, contactAddress))
  })

  test.afterAll(async () => {
    // Close the context only after all tests have completed
    await context.close()
  })

  test('Verify the header details', async ({ page: innerPage }) => {
    // Login to MaS and search for Crn
    await loginToManageMySupervision(innerPage)
    await searchForCrn(innerPage, crn)

    // Verify the person appears in the search results and crn, name, dob & tier matches
    await expect(innerPage.getByTestId('crn')).toContainText(crn)
    await expect(innerPage.getByTestId('name')).toContainText(`${person.firstName} ${person.lastName}`)
    await expect(innerPage.getByTestId('headerDateOfBirthValue')).toContainText(formatDate(person.dob))
    await expect(innerPage.getByTestId('tierValue').first()).toContainText('D0')
  })

  test('Verify that the personal details of a person in MAS match those in Delius', async ({ page: innerPage }) => {
    // Login to MaS and search for Crn
    await loginMasAndGoToPersonalDetails(innerPage, crn)

    // Verify that the personal details match those in Delius
    await Promise.all([
      expect(innerPage.getByTestId('telephoneNumberValue')).toContainText(telephoneNumber),
      expect(innerPage.getByTestId('mobileNumberValue')).toContainText(mobileNumber),
      expect(innerPage.getByTestId('emailAddressValue')).toContainText(email),
    ])

    // Verify that the main address details match those in Delius
    await innerPage.getByText('View address details').click()
    await Promise.all([
      assertAddressDetails(innerPage, innerPage.getByTestId('mainAddressValue'), mainAddress),
      expect(innerPage.getByTestId('addressTypeValue')).toContainText(`${mainAddressType} (verified)`),
      expect(innerPage.getByTestId('mainAddressStartDateValue')).toContainText(todaysDate),
      expect(innerPage.getByTestId('mainAddressNotesValue')).toContainText('Notes added for Main address'),
    ])

    // Verify secondary address details match those in Delius
    await innerPage.getByRole('link', { name: /View all addresses/ }).click()
    await expect(innerPage.locator('h1')).toContainText('Addresses')
    await Promise.all([
      assertAddressDetails(innerPage, innerPage.getByTestId('otherAddressValue1'), otherAddress),
      expect(innerPage.getByTestId('otherAddressTypeValue1')).toContainText(`${addressType} (verified)`),
      expect(innerPage.getByTestId('otherAddressStartDateValue1')).toContainText(todaysDate),
      expect(innerPage.getByTestId('otherAddressNotesValue1')).toContainText('Notes added for Secondary address'),
    ])

    // Verify that the emergency contact details match those in Delius
    await innerPage.getByRole('link', { name: 'Personal details' }).first().click()
    await innerPage.getByRole('link', { name: `${contactName} – ` }).click()
    await Promise.all([
      expect(innerPage.getByTestId('contactRelationshipTypeHeaderValue')).toContainText('Emergency Contact'),
      expect(innerPage.getByTestId('contactNameValue')).toContainText(contactName),
      expect(innerPage.getByTestId('contactRelationshipValue')).toContainText('Friend'),
      assertAddressDetails(innerPage, innerPage.getByTestId('contactAddressValue'), contactAddress),
      expect(innerPage.getByTestId('contactPhoneValue')).toContainText(contactPhoneNumber),
      expect(innerPage.getByTestId('contactEmailValue')).toContainText(contactEmail),
      expect(innerPage.getByTestId('contactStartDateValue')).toContainText(todaysDate),
      expect(innerPage.getByTestId('contactNotesValue')).toContainText(`Added Emergency contact on ${todaysDate}`),
    ])
  })
})
