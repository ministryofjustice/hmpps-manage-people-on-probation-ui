import { Page } from '@playwright/test'
import {
  Address,
  buildAddress,
  createAddress,
} from '@ministryofjustice/hmpps-probation-integration-e2e-tests/steps/delius/address/create-address.mjs'

const addAddress = async (
  page: Page,
  crn: string,
  type: string,
  tableId: string,
): Promise<{ type: string; address: Address }> => {
  const addressType = type || 'Main' // Default to 'Main' if type is not provided
  const address = buildAddress(addressType)
  await createAddress(page, crn, address)
  const fetchedAddressType = await getTypeColumnValue(page, tableId)
  return { type: fetchedAddressType, address }
}

const getTypeColumnValue = async (page: Page, tableId: string): Promise<string> => {
  const typeColumnIndex = await page.locator(`#${tableId} thead th:has-text("Type")`).evaluate(header => {
    const headers = Array.from(header.parentElement.children)
    return headers.indexOf(header) + 1
  })
  return page.locator(`#${tableId} tbody tr:first-child td:nth-child(${typeColumnIndex})`).innerText()
}

export default addAddress
