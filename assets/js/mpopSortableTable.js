/* eslint-disable func-names,no-plusplus */
MOJFrontend.MpopSortableTable = function (params) {
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

MOJFrontend.MpopSortableTable.prototype.setupOptions = function (nullableParams) {
  const params = nullableParams || {}
  this.statusMessage = params.statusMessage || 'Sort by %heading% (%direction%)'
  this.ascendingText = params.ascendingText || 'ascending'
  this.descendingText = params.descendingText || 'descending'
}

MOJFrontend.MpopSortableTable.prototype.createHeadingButtons = function () {
  const headings = this.table.find('thead th')
  let heading
  for (let i = 0; i < headings.length; i++) {
    heading = $(headings[i])
    if (heading.attr('aria-sort')) {
      this.createHeadingButton(heading, i)
    }
  }
}

MOJFrontend.MpopSortableTable.prototype.createHeadingButton = function (heading, i) {
  const text = heading.text()
  const button = $(
    `<button type="button" data-index="${i}">${text}<span class="sort-icon" aria-hidden="true"></span></button>`,
  )
  heading.text('')
  heading.append(button)
}

MOJFrontend.MpopSortableTable.prototype.createStatusBox = function () {
  this.status = $('<div aria-live="polite" role="status" aria-atomic="true" class="govuk-visually-hidden" />')
  this.table.parent().append(this.status)
}

MOJFrontend.MpopSortableTable.prototype.initialiseSortedColumn = function () {
  const rows = this.getTableRowsArray()

  this.table
    .find('th')
    .filter('[aria-sort="ascending"], [aria-sort="descending"]')
    .first()
    .each((index, el) => {
      const sortDirection = $(el).attr('aria-sort')
      const columnNumber = $(el).find('button').attr('data-index')
      const sortedRows = this.sort(rows, columnNumber, sortDirection)
      this.addRows(sortedRows)
    })
}

MOJFrontend.MpopSortableTable.prototype.onSortButtonClick = function (e) {
  const columnNumber = e.currentTarget.getAttribute('data-index')
  const sortDirection = $(e.currentTarget).parent().attr('aria-sort')
  let newSortDirection
  if (sortDirection === 'none' || sortDirection === 'descending') {
    newSortDirection = 'ascending'
  } else {
    newSortDirection = 'descending'
  }
  const rows = this.getTableRowsArray()
  const sortedRows = this.sort(rows, columnNumber, newSortDirection)
  this.addRows(sortedRows)
  this.removeButtonStates()
  this.updateButtonState($(e.currentTarget), newSortDirection)
}

MOJFrontend.MpopSortableTable.prototype.updateButtonState = function (button, direction) {
  button.parent().attr('aria-sort', direction)
  let message = this.statusMessage
  message = message.replace(/%heading%/, button.text())
  message = message.replace(/%direction%/, this[`${direction}Text`])
  this.status.text(message)
}

MOJFrontend.MpopSortableTable.prototype.removeButtonStates = function () {
  this.table.find('thead th').attr('aria-sort', 'none')
}

MOJFrontend.MpopSortableTable.prototype.addRows = function (rows) {
  for (let i = 0; i < rows.length; i++) {
    this.body.append(rows[i])
  }
}

MOJFrontend.MpopSortableTable.prototype.getTableRowsArray = function () {
  const rows = []
  const trs = this.body.find('tr')
  for (let i = 0; i < trs.length; i++) {
    rows.push(trs[i])
  }
  return rows
}

MOJFrontend.MpopSortableTable.prototype.sort = function (rows, columnNumber, sortDirection) {
  const newRows = rows.sort(
    function (rowA, rowB) {
      const tdA = $(rowA).find('td,th').eq(columnNumber)
      const tdB = $(rowB).find('td,th').eq(columnNumber)

      const valueA = sortDirection === 'ascending' ? this.getCellValue(tdA) : this.getCellValue(tdB)
      const valueB = sortDirection === 'ascending' ? this.getCellValue(tdB) : this.getCellValue(tdA)

      if (typeof valueA === 'string' || typeof valueB === 'string')
        return valueA.toString().localeCompare(valueB.toString())
      return valueA - valueB
    }.bind(this),
  )
  return newRows
}

MOJFrontend.MpopSortableTable.prototype.getCellValue = function (cell) {
  let val = cell.attr('data-sort-value')
  val = val || cell.html()
  if ($.isNumeric(val)) {
    val = parseInt(val, 10)
  }
  return val
}

// eslint-disable-next-line no-new
new MOJFrontend.MpopSortableTable({
  table: 'table[data-module="moj-mpop-sortable-table"]',
})
