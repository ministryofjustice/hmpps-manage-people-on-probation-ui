export default class MpopSortableTable {
  constructor(params) {
    this.table = $(params.table)

    if (this.table.data('moj-search-toggle-initialised')) {
      return
    }

    this.table.data('moj-search-toggle-initialised', true)

    this.setupOptions(params)
    this.body = this.table.find('tbody')
    this.createHeadingButtons()
    this.createStatusBox()
    this.initialiseSortedColumn()
    this.table.on('click', 'th button', $.proxy(this, 'onSortButtonClick'))
  }

  setupOptions(nullableParams) {
    const params = nullableParams || {}
    this.statusMessage = params.statusMessage || 'Sort by %heading% (%direction%)'
    this.ascendingText = params.ascendingText || 'ascending'
    this.descendingText = params.descendingText || 'descending'
  }

  createHeadingButtons() {
    const headings = this.table.find('thead th')

    headings.each((index, head) => {
      const heading = $(head)
      if (heading.attr('aria-sort')) {
        createHeadingButton(heading, index)
      }
    })
  }

  createStatusBox() {
    this.status = $('<div aria-live="polite" role="status" aria-atomic="true" class="govuk-visually-hidden" />')
    this.table.parent().append(this.status)
  }

  initialiseSortedColumn() {
    const rows = this.getTableRowsArray()

    this.table
      .find('th')
      .filter('[aria-sort="ascending"], [aria-sort="descending"]')
      .first()
      .each((index, el) => {
        const sortDirection = $(el).attr('aria-sort')
        const columnNumber = $(el).find('button').attr('data-index')
        const sortedRows = sort(rows, columnNumber, sortDirection)
        this.addRows(sortedRows)
      })
  }

  onSortButtonClick(e) {
    const columnNumber = e.currentTarget.getAttribute('data-index')
    const sortDirection = $(e.currentTarget).parent().attr('aria-sort')
    let newSortDirection
    if (sortDirection === 'none' || sortDirection === 'descending') {
      newSortDirection = 'ascending'
    } else {
      newSortDirection = 'descending'
    }
    const rows = this.getTableRowsArray()
    const sortedRows = sort(rows, columnNumber, newSortDirection)
    this.addRows(sortedRows)
    this.removeButtonStates()
    this.updateButtonState($(e.currentTarget), newSortDirection)
  }

  updateButtonState(button, direction) {
    button.parent().attr('aria-sort', direction)
    let message = this.statusMessage
    message = message.replace(/%heading%/, button.text())
    message = message.replace(/%direction%/, this[`${direction}Text`])
    this.status.text(message)
  }

  removeButtonStates() {
    this.table.find('thead th').attr('aria-sort', 'none')
  }

  addRows(rows) {
    rows.forEach(row => {
      this.body.append(row)
    })
  }

  getTableRowsArray() {
    const rows = []
    this.body.find('tr').each((index, tr) => {
      rows.push(tr)
    })
    return rows
  }
}

function sort(rows, columnNumber, sortDirection) {
  const newRows = rows.sort((rowA, rowB) => {
    const tdA = $(rowA).find('td,th').eq(columnNumber)
    const tdB = $(rowB).find('td,th').eq(columnNumber)

    const valueA = sortDirection === 'ascending' ? getCellValue(tdA) : getCellValue(tdB)
    const valueB = sortDirection === 'ascending' ? getCellValue(tdB) : getCellValue(tdA)

    if (typeof valueA === 'string' || typeof valueB === 'string')
      return valueA.toString().localeCompare(valueB.toString())
    return valueA - valueB
  })
  return newRows
}

function createButton(text, index) {
  return $(
    `<button type="button" data-index="${index}">${text}<span class="sort-icon" aria-hidden="true"></span></button>`,
  )
}

function getCellValue(cell) {
  let val = cell.attr('data-sort-value') || cell.html()
  if ($.isNumeric(val)) {
    val = parseInt(val, 10)
  }
  return val
}

function createHeadingButton(heading, i) {
  const text = heading.text()
  const button = createButton(text, i)
  heading.text('')
  heading.append(button)
}
