/* eslint-disable no-param-reassign */
/* eslint-disable no-constructor-return */
/* eslint-disable import/prefer-default-export */
/* eslint-disable class-methods-use-this */
import { ConfigurableComponent } from 'govuk-frontend'

/**
 * @augments {ConfigurableComponent<MpopSortableTableConfig>}
 */
class MpopSortableTable extends ConfigurableComponent {
  /**
   * @param {Element | null} $root
   * @param {MpopSortableTableConfig} [config]
   */
  constructor($root, config = {}) {
    super($root, config)

    if (!$root) return this

    // Prevent double init
    if ($root.hasAttribute('data-moj-search-toggle-initialised')) {
      return this
    }
    $root.setAttribute('data-moj-search-toggle-initialised', 'true')

    this.$head = $root.querySelector('thead')
    this.$body = $root.querySelector('tbody')
    this.$headings = this.$head ? Array.from(this.$head.querySelectorAll('th')) : []

    this.createHeadingButtons()
    this.createStatusBox()
    this.initialiseSortedColumn()

    // Handle sort clicks
    this.$head.addEventListener('click', this.onSortButtonClick.bind(this))
  }

  /**
   * Create buttons inside headings with aria-sort
   */
  createHeadingButtons() {
    this.$headings.forEach(($heading, index) => {
      if ($heading.hasAttribute('aria-sort')) {
        this.createHeadingButton($heading, index)
      }
    })
  }

  /**
   * @param {HTMLTableCellElement} $heading
   * @param {number} index
   */
  createHeadingButton($heading, index) {
    const text = $heading.textContent.trim() || ''
    const $button = document.createElement('button')
    $button.type = 'button'
    $button.dataset.index = index
    $button.innerHTML = `${text}<span class="sort-icon" aria-hidden="true"></span>`
    $heading.textContent = ''
    $heading.appendChild($button)
  }

  /**
   * Create the hidden ARIA status box for screen readers
   */
  createStatusBox() {
    this.$status = document.createElement('div')
    this.$status.classList.add('govuk-visually-hidden')
    this.$status.setAttribute('aria-live', 'polite')
    this.$status.setAttribute('aria-atomic', 'true')
    this.$status.setAttribute('role', 'status')
    this.$root.insertAdjacentElement('afterend', this.$status)
  }

  /**
   * Initialise column that’s already sorted on page load
   */
  initialiseSortedColumn() {
    const $sortedHeading = this.$head.querySelector('th[aria-sort="ascending"], th[aria-sort="descending"]')

    if (!$sortedHeading) return

    const sortDirection = $sortedHeading.getAttribute('aria-sort')
    const $button = $sortedHeading.querySelector('button')
    const columnNumber = parseInt($button.dataset.index || '0', 10)

    const $rows = this.getTableRowsArray()
    const $sortedRows = this.sort($rows, columnNumber, sortDirection)
    this.addRows($sortedRows)
  }

  /**
   * Handle clicking on a sort button
   * @param {MouseEvent} event
   */
  onSortButtonClick(event) {
    const $button = event.target.closest('button')
    if (!$button) return

    const $heading = $button.closest('th')
    if (!$heading) return

    const sortDirection = $heading.getAttribute('aria-sort') || 'none'
    const columnNumber = parseInt($button.dataset.index || '0', 10)
    const newDirection = sortDirection === 'none' || sortDirection === 'descending' ? 'ascending' : 'descending'

    const $rows = this.getTableRowsArray()
    const $sortedRows = this.sort($rows, columnNumber, newDirection)
    this.addRows($sortedRows)
    this.removeButtonStates()
    this.updateButtonState($button, newDirection)
  }

  /**
   * Update the button aria-sort and announce the change
   * @param {HTMLButtonElement} $button
   * @param {'ascending'|'descending'} direction
   */
  updateButtonState($button, direction) {
    const $heading = $button.parentElement
    if (!$heading) return

    $heading.setAttribute('aria-sort', direction)
    let message = this.config.statusMessage
    message = message.replace(/%heading%/, $button.textContent)
    message = message.replace(/%direction%/, this.config[`${direction}Text`])
    this.$status.textContent = message
  }

  /**
   * Reset all column aria-sort states
   */
  removeButtonStates() {
    this.$headings.forEach($heading => {
      $heading.setAttribute('aria-sort', 'none')
    })
  }

  /**
   * Append sorted rows to the table body
   * @param {HTMLTableRowElement[]} rows
   */
  addRows(rows) {
    for (const $row of rows) {
      this.$body.append($row)
    }
  }

  /**
   * Return table rows as array
   * @returns {HTMLTableRowElement[]}
   */
  getTableRowsArray() {
    return Array.from(this.$body.querySelectorAll('tr'))
  }

  /**
   * Sort rows by the given column and direction
   * @param {HTMLTableRowElement[]} rows
   * @param {number} columnNumber
   * @param {'ascending'|'descending'} sortDirection
   */
  sort(rows, columnNumber, sortDirection) {
    return rows.sort(($rowA, $rowB) => {
      const $tdA = $rowA.querySelectorAll('td, th')[columnNumber]
      const $tdB = $rowB.querySelectorAll('td, th')[columnNumber]

      const valueA = sortDirection === 'ascending' ? this.getCellValue($tdA) : this.getCellValue($tdB)
      const valueB = sortDirection === 'ascending' ? this.getCellValue($tdB) : this.getCellValue($tdA)

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return valueA - valueB
      }

      return valueA.toString().localeCompare(valueB.toString())
    })
  }

  /**
   * Extract cell sort value
   * @param {HTMLElement} $cell
   */
  getCellValue($cell) {
    const val = $cell.getAttribute('data-sort-value') || $cell.innerHTML
    const asNumber = Number(val)
    return Number.isFinite(asNumber) ? asNumber : val
  }
}

/**
 * @typedef {object} MpopSortableTableConfig
 * @property {string} [statusMessage]
 * @property {string} [ascendingText]
 * @property {string} [descendingText]
 */

MpopSortableTable.moduleName = 'moj-mpop-sortable-table'

/**
 * @type {MpopSortableTableConfig}
 */
MpopSortableTable.defaults = Object.freeze({
  statusMessage: 'Sort by %heading% (%direction%)',
  ascendingText: 'ascending',
  descendingText: 'descending',
})

/**
 * @import { Schema } from 'govuk-frontend/dist/govuk/common/configuration.mjs'
 * @satisfies {Schema<MpopSortableTableConfig>}
 */
MpopSortableTable.schema = Object.freeze({
  properties: {
    statusMessage: { type: 'string' },
    ascendingText: { type: 'string' },
    descendingText: { type: 'string' },
  },
})

export { MpopSortableTable }
