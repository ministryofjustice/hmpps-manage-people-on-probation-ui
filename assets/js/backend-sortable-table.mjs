/* eslint-disable no-nested-ternary */
/* eslint-disable import/prefer-default-export */
/* eslint-disable no-constructor-return */
/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
import { ConfigurableComponent } from 'govuk-frontend'

/**
 * @augments {ConfigurableComponent<BackendSortableTableConfig>}
 */
class BackendSortableTable extends ConfigurableComponent {
  /**
   * @param {Element | null} $root - The table element
   * @param {BackendSortableTableConfig} [config] - Optional config
   */
  constructor($root, config = {}) {
    super($root, config)

    if (!$root) return this

    // Prevent double-initialisation
    if ($root.hasAttribute('data-moj-search-toggle-initialised')) {
      return this
    }

    $root.setAttribute('data-moj-search-toggle-initialised', 'true')

    this.$body = $root.querySelector('tbody')
    this.$head = $root.querySelector('thead')
    this.$headings = this.$head ? Array.from(this.$head.querySelectorAll('th')) : []

    this.setNaturalOrder()
    this.createHeadingButtons()
    this.createStatusBox()

    this.$head.addEventListener('click', this.onSortButtonClick.bind(this))
  }

  /**
   * Setup the natural order (default sort column + direction)
   */
  setNaturalOrder() {
    this.naturalSortColumn = 0
    this.naturalSortDirection = 'ascending'

    this.$headings.forEach(($heading, i) => {
      const natural = $heading.getAttribute('aria-sort-natural')
      if (natural) {
        this.naturalSortColumn = i
        this.naturalSortDirection = natural
      }
    })
  }

  /**
   * Create clickable buttons in sortable headings
   */
  createHeadingButtons() {
    this.$headings.forEach(($heading, i) => {
      if ($heading.hasAttribute('aria-sort')) {
        this.createHeadingButton($heading, i)
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
   * Create ARIA live region for status updates
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
   * Handle click on a sort button
   * @param {MouseEvent} event
   */
  onSortButtonClick(event) {
    const $button = event.target.closest('button')
    if (!$button) return

    const $heading = $button.closest('th')
    if (!$heading) return

    const currentDirection = $heading.getAttribute('aria-sort')
    const action = $heading.getAttribute('data-sort-action')
    const columnName = $heading.getAttribute('data-sort-name')

    const newDirection = currentDirection === 'none' || currentDirection === 'descending' ? 'asc' : 'desc'

    if (!columnName || !action) return

    const sortBy = `${columnName}.${newDirection}`
    const suffix = action.includes('?') ? '&' : '?'
    const newUrl = `${action}${suffix}sortBy=${sortBy}`

    this.$status.textContent = this.config.statusMessage
      .replace(/%heading%/, columnName)
      .replace(/%direction%/, newDirection)

    window.location.assign(newUrl)
  }

  /**
   * @param {HTMLElement} $cell
   */
  getCellValue($cell) {
    const val = $cell.getAttribute('data-sort-value') || $cell.innerHTML
    const asNumber = Number(val)
    return Number.isFinite(asNumber) ? asNumber : val
  }

  /**
   * @param {HTMLTableRowElement[]} rows
   * @param {number} columnNumber
   * @param {string} direction
   */
  sort(rows, columnNumber, direction) {
    return rows.sort((rowA, rowB) => {
      const a = rowA.querySelectorAll('td, th')[columnNumber]
      const b = rowB.querySelectorAll('td, th')[columnNumber]
      const valA = this.getCellValue(a)
      const valB = this.getCellValue(b)
      if (direction === 'ascending') {
        return valA < valB ? -1 : valA > valB ? 1 : 0
      }
      return valB < valA ? -1 : valB > valA ? 1 : 0
    })
  }
}

/**
 * Backend sortable table config
 *
 * @typedef {object} BackendSortableTableConfig
 * @property {string} [statusMessage] - Status message
 * @property {string} [ascendingText] - Ascending label
 * @property {string} [descendingText] - Descending label
 */

BackendSortableTable.moduleName = 'moj-backend-sortable-table'

/**
 * @type {BackendSortableTableConfig}
 */
BackendSortableTable.defaults = Object.freeze({
  statusMessage: 'Sort by %heading% (%direction%)',
  ascendingText: 'ascending',
  descendingText: 'descending',
})

/**
 * @import { Schema } from 'govuk-frontend/dist/govuk/common/configuration.mjs'
 * @satisfies {Schema<BackendSortableTableConfig>}
 */
BackendSortableTable.schema = Object.freeze({
  properties: {
    statusMessage: { type: 'string' },
    ascendingText: { type: 'string' },
    descendingText: { type: 'string' },
  },
})

export { BackendSortableTable }
