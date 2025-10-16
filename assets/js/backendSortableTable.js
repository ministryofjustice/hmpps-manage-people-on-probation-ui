export default class BackendSortableTable {
  constructor(params) {
    this.table = $(params.table)

    if (this.table.data('moj-search-toggle-initialised')) {
      return
    }

    this.table.data('moj-search-toggle-initialised', true)

    this.setupOptions(params)
    this.body = this.table.find('tbody')
    this.createHeadingButtons()
    this.setNaturalOrder()
    this.createStatusBox()
    this.table.on('click', 'th button', $.proxy(this, 'onSortButtonClick'))
  }

  setupOptions(params = {}) {
    this.statusMessage = params.statusMessage || 'Sort by %heading% (%direction%)'
    this.ascendingText = params.ascendingText || 'ascending'
    this.descendingText = params.descendingText || 'descending'
  }

  createHeadingButtons() {
    const headings = this.table.find('thead th')
    headings.each((index, head) => {
      const heading = $(head)
      if (heading.attr('aria-sort')) {
        this.createHeadingButton(heading, index)
      }
    })
  }

  setNaturalOrder() {
    const headings = this.table.find('thead th')
    this.naturalSortColumn = 0
    this.naturalSortDirection = 'ascending'

    headings.each((index, head) => {
      const heading = $(head)
      if (heading.attr('aria-sort-natural')) {
        this.naturalSortColumn = index
        this.naturalSortDirection = heading.attr('aria-sort-natural')
        return false // break loop
      }
      return true // continue looping
    })
  }

  createHeadingButton(heading, index) {
    const text = heading.text()
    const button = $(
      `<button type="button" data-index="${index}">${text}<span class="${this.sortIconClass}" aria-hidden="true"></span></button>`,
    )
    heading.empty().append(button)
  }

  createStatusBox() {
    this.status = $('<div aria-live="polite" role="status" aria-atomic="true" class="govuk-visually-hidden" />')
    this.table.parent().append(this.status)
  }

  onSortButtonClick(e) {
    const $th = $(e.currentTarget).parent()
    const sortDirection = $th.attr('aria-sort')
    const action = this.prepareSortAction($th.data('sort-action')) // Using this
    const columnName = $th.data('sort-name')

    const backendSortDirection = sortDirection === 'none' || sortDirection === 'descending' ? 'asc' : 'desc'
    const sortBy = `${columnName}.${backendSortDirection}`
    const suffix = action.includes('?') ? '&' : '?'
    window.location = `${action}${suffix}sortBy=${sortBy}`
  }

  sort(rows, columnNumber, sortDirection) {
    return rows.sort((rowA, rowB) => {
      const tdA = $(rowA).find('td').eq(columnNumber)
      const tdB = $(rowB).find('td').eq(columnNumber)
      const valueA = this.getCellValue(tdA)
      const valueB = this.getCellValue(tdB)

      if (sortDirection === 'ascending') {
        if (valueA < valueB) return -1
        if (valueA > valueB) return 1
        return this.sortNatural(rowA, rowB)
      }

      if (valueB < valueA) return -1
      if (valueB > valueA) return 1
      return this.sortNatural(rowA, rowB)
    })
  }

  sortNatural(rowA, rowB) {
    const tdA = $(rowA).find('td').eq(this.naturalSortColumn)
    const tdB = $(rowB).find('td').eq(this.naturalSortColumn)
    const valueA = this.getCellValue(tdA)
    const valueB = this.getCellValue(tdB)

    if (this.naturalSortDirection === 'ascending') {
      if (valueA < valueB) return -1
      if (valueA > valueB) return 1
      return 0
    }

    if (valueB < valueA) return -1
    if (valueB > valueA) return 1
    return 0
  }

  getCellValue(cell) {
    const val = cell.attr('data-sort-value') || cell.text().trim()
    const numericThreshold = this.numericThreshold || 0 // Example property usage
    return $.isNumeric(val) ? parseFloat(val) : val
  }
}
