/* eslint-disable no-param-reassign */
/* eslint-disable no-new */
/* eslint-disable no-restricted-globals */

import { DateTime } from 'luxon'
import './appInsights'
import './predictors'
import { BackendSortableTable } from './backend-sortable-table.mjs'
import { MpopSortableTable } from './mpop-sortable-table.mjs'
import { MpopMultiFileUpload } from './mpop-multi-file-upload.mjs'
import setupAlertsPage from './alerts'
import './photo'

const $backendSortableTable = document.querySelector('table[data-module="moj-backend-sortable-table"]')
if ($backendSortableTable) {
  new BackendSortableTable($backendSortableTable)
}
const $mpopSortableTable = document.querySelector('table[data-module="moj-mpop-sortable-table"]')
if ($mpopSortableTable) {
  new MpopSortableTable($mpopSortableTable)
}
const $multifileUpload = document.querySelector('[data-module="moj-multi-file-upload"]')
if ($multifileUpload) {
  const enableDelete = window.enableDeleteAppointmentFile
  if (!enableDelete) {
    document.body.classList.add('feature-disabled')
  }
  new MpopMultiFileUpload($multifileUpload, {
    uploadUrl: '/appointments/file/upload',
    deleteUrl: '/appointments/file/delete',
    dropzoneHintText: 'Drag and drop files here or ',
    enableDelete,
    headers: {
      'CSRF-Token': window.csrfToken,
    },
    hooks: {
      entryHook: uploadEntry,
      exitHook: uploadExit,
      deleteHook: deleteExit,
      errorHook: uploadErrorHook,
    },
  })

  function continueButtonEnabled(enabled) {
    const $continueButton = $('#continueButton')
    if (enabled) {
      $continueButton.removeAttr('disabled')
      $continueButton.removeAttr('aria-disabled')
      $continueButton.removeClass('govuk-button--disabled')
    } else {
      $continueButton.attr('disabled', 'disabled')
      $continueButton.attr('aria-disabled', 'true')
      $continueButton.addClass('govuk-button--disabled')
    }
  }

  function isAllFinished() {
    const $actions = $('.moj-multi-file-upload__actions')
    let finished = true
    $actions.each(() => {
      if ($(this).html() === '') {
        finished = false
      }
    })
    return finished
  }

  function uploadEntry(_handle, _file, formData) {
    const { pathname } = new URL(location.href)
    const parts = pathname.split('/').filter(part => part)
    formData.append('crn', parts[1])
    formData.append('id', parts[4])
    return formData
  }
  function uploadExit(_handle, _file, _xhr, _response) {
    if (isAllFinished()) {
      continueButtonEnabled(true)
    } else if ($('.moj-multi-file-upload__list')) {
      // another file has been added
      continueButtonEnabled(false)
    }
  }

  function deleteExit(_handle, _response) {
    const $row = $('.moj-multi-file-upload__row')
    if ($row && $row.length === 0) {
      continueButtonEnabled(false)
    }
  }

  function uploadErrorHook({ handle, file, errorMessage, textStatus, errorThrown }) {
    const message = errorMessage || textStatus || errorThrown
    const item = $(handle.getFileRowHtml(file))

    item[0].querySelector('.moj-multi-file-upload__message').innerHTML = handle.getErrorHtml(
      { message },
      file.name,
      'Upload failed',
      'red',
    )
    if (enableDelete) {
      item[0]
        .querySelector('.moj-multi-file-upload__actions')
        .append(handle.getDeleteButton({ filename: file.name }, 'Upload failed', 'red'))
    }
    const $rows = handle.$feedbackContainer.querySelectorAll('.moj-multi-file-upload__row')

    const $matchingRow = Array.from($rows).find(row => row.textContent.includes(file.name))
    if ($matchingRow) {
      $matchingRow.replaceWith(item[0])
    }

    handle.$status.textContent = message
  }
}

const lastAppointment = () => {
  const repeatingFrequency = document.querySelector('div[data-interval]')
  if (repeatingFrequency) {
    const repeatingFrequencyRadios = repeatingFrequency.querySelectorAll('input[type="radio"]')
    const repeatingCount = document.querySelector('div[data-numberOfRepeatAppointments] input')
    const lastAppointmentElm = document.querySelector('div[data-last-appointment')
    const lastAppointmentHandler = async () => {
      const repeatingFrequencyRadioSelected = repeatingFrequency.querySelector('input:checked')
      if (parseInt(repeatingCount.value, 10) > 0 && repeatingFrequencyRadioSelected) {
        const divider = location.href.includes('?') ? '&' : '?'
        const url = `${location.href}${divider}interval=${encodeURI(repeatingFrequencyRadioSelected.value)}&numberOfRepeatAppointments=${repeatingCount.value}`
        const headers = {
          Accept: '*/*',
          'Content-Type': 'application/x-www-form-urlencoded',
        }
        const response = await fetch(url, {
          method: 'GET',
          cache: 'no-cache',
          credentials: 'same-origin',
          headers,
        })
        const html = await response.text()
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')
        const element = doc.querySelector('div[data-last-appointment]').innerHTML
        document.querySelector('div[data-last-appointment]').innerHTML = element
      } else {
        lastAppointmentElm.innerHTML = ''
      }
    }
    repeatingFrequencyRadios.forEach(input => input.addEventListener('click', lastAppointmentHandler))
    repeatingCount.addEventListener('keyup', lastAppointmentHandler)
  }
}
const resetConditionals = () => {
  const handleReset = () => {
    document.querySelectorAll('.govuk-radios__conditional input').forEach(radioBtn => {
      radioBtn.removeAttribute('checked')
    })
  }
  const elm = document.querySelector('[data-reset-conditional-radios]')
  if (elm) {
    // eslint-disable-next-line no-shadow
    document.querySelectorAll('[data-reset-conditional-radios]').forEach(elm => {
      elm.addEventListener('click', handleReset)
    })
  }
}

const setNoFixedAddressConditional = () => {
  const fixedAddressSection = document.querySelector('div[fixed-address-section]')
  const fixedAddressCheckbox = document.querySelector('input[name="noFixedAddress"]')
  const showOrHide = () => {
    if (fixedAddressCheckbox.checked) {
      fixedAddressSection.classList.add('govuk-visually-hidden')
    } else {
      fixedAddressSection.classList.remove('govuk-visually-hidden')
    }
  }
  if (fixedAddressSection && fixedAddressCheckbox) {
    showOrHide()
    fixedAddressCheckbox.addEventListener('click', showOrHide)
  }
}

const attendanceSelectors = () => {
  const providerSelect = document.querySelector('[data-qa="providerCode"]')
  const teamSelect = document.querySelector('[data-qa="teamCode"]')
  const params = new URL(window.location.toString()).searchParams
  const change = params.get('change')
  let providerCode = ''
  if (providerSelect) {
    providerCode = providerSelect.value
    providerSelect.addEventListener('change', event => {
      const { value } = event.target
      const urlParts = location.href.split('?')[0].split('/')
      const crn = urlParts[4]
      const uuid = urlParts[6]
      const baseUrl = `/case/${crn}/arrange-appointment/${uuid}/attendance`
      location.href = `${baseUrl}?providerCode=${value}${change ? `&change=${change}` : ''}`
    })
  }
  if (teamSelect) {
    teamSelect.addEventListener('change', event => {
      const { value } = event.target
      const urlParts = location.href.split('?')[0].split('/')
      const crn = urlParts[4]
      const uuid = urlParts[6]
      const baseUrl = `/case/${crn}/arrange-appointment/${uuid}/attendance`
      location.href = `${baseUrl}?${providerCode ? `providerCode=${providerCode}&` : ''}teamCode=${value}${change ? `&change=${change}` : ''}`
    })
  }
}

const homeSearch = () => {
  const search = document.getElementById('homepage-search-suggestions')

  if (search) {
    search.addEventListener('click', e => {
      if (e.target.dataset.suggestedQuery) {
        document.getElementById('search').value = e.target.dataset.suggestedQuery
        document.getElementById('homepage-search-form').submit()
      }
    })
  }
}

const crissHeaders = () => {
  const btn = document.getElementById('crissButton')
  if (btn) {
    const textarea = document.getElementById('notes')
    const status = document.getElementById('crissStatus')
    btn.addEventListener('click', () => {
      if (textarea.value.trim() === '') {
        textarea.value = `Check in\n\nReview\n\nIntervention\n\nSummarise\n\nSet tasks`
        status.textContent = 'CRISS headers inserted'
        textarea.focus()
      }
    })
  }
}

const recentCaseDisplay = () => {
  const recentCasesNone = document.querySelector('[id=recent-cases-none]')
  const recentCasesTable = document.querySelector('[id=recent-cases-table]')

  if (recentCasesNone && recentCasesTable) {
    const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content')
    let recentCases = JSON.parse(localStorage.getItem('recentCases'))

    $.ajax({
      async: false,
      type: 'POST',
      url: '/check-access',
      headers: {
        'CSRF-Token': token,
      },
      data: JSON.stringify(recentCases),
      processData: false,
      contentType: 'application/json',
      success(checkedAndUpdated) {
        recentCases = checkedAndUpdated
      },
    })

    function lao(check, value, replacement = 'Restricted') {
      if (check === true) {
        return replacement
      }
      return value
    }

    if (recentCases != null) {
      recentCasesNone.style.display = 'none'
      recentCases.forEach(recentCase => {
        const tableBody = document.getElementById('tabBody')

        const row = document.createElement('tr')
        row.className = 'govuk-table__row'

        const rd1 = document.createElement('td')
        rd1.className = 'govuk-table__cell'
        const anchor = document.createElement('a')
        if (recentCase.limitedAccess === true) {
          anchor.className = 'govuk-!-font-weight-bold govuk-link--text-colour '
        } else {
          anchor.className = 'govuk-!-font-weight-bold'
        }
        anchor.href = `/case/${recentCase.crn}`
        anchor.text = lao(recentCase.limitedAccess, recentCase.name, 'Restricted access')
        anchor.setAttribute('data-ai-id', 'recentCasesPersonNameLink')
        const span1 = document.createElement('span')
        span1.className = 'govuk-!-font-weight-bold secondary-text'
        span1.innerText = recentCase.crn
        rd1.appendChild(anchor)
        rd1.appendChild(document.createElement('br'))
        rd1.appendChild(span1)

        const rd2 = document.createElement('td')
        rd2.className = 'govuk-table__cell'
        rd2.innerText = lao(recentCase.limitedAccess, recentCase.dob)
        const span2 = document.createElement('span')
        span2.className = 'secondary-text'
        span2.innerText = lao(recentCase.limitedAccess, `Age ${recentCase.age}`, '')
        rd2.appendChild(document.createElement('br'))
        rd2.appendChild(span2)

        const rd3 = document.createElement('td')
        rd3.className = 'govuk-table__cell'
        rd3.innerText = lao(recentCase.limitedAccess, recentCase.tierScore)

        const rd4 = document.createElement('td')
        rd4.className = 'govuk-table__cell'

        if (recentCase.numberOfAdditionalSentences > 0) {
          const anchorSentence = document.createElement('a')
          anchorSentence.className = 'govuk-link'
          if (recentCase.limitedAccess !== true) {
            anchorSentence.href = `/case/${recentCase.crn}/sentence`
          }
          anchorSentence.text = lao(recentCase.limitedAccess, `+ ${recentCase.numberOfAdditionalSentences} more`)
          rd4.innerText = lao(recentCase.limitedAccess, recentCase.sentence)
          rd4.appendChild(document.createElement('br'))
          rd4.appendChild(anchorSentence)
        } else {
          rd4.innerText = lao(recentCase.limitedAccess, recentCase.sentence)
        }

        row.appendChild(rd1)
        row.appendChild(rd2)
        row.appendChild(rd3)
        row.appendChild(rd4)
        tableBody.appendChild(row)
      })
    } else {
      recentCasesTable.style.display = 'none'
    }
  }
}

class ServiceAlert {
  constructor() {
    this.alert = document.querySelector('[data-module="serviceAlert"]')

    if (!this.alert) return

    this.dateInput = document.querySelector('.moj-js-datepicker-input')
    this.startInput = document.querySelector('[data-qa="startTime"] input')
    this.status = document.querySelector('[data-qa="serviceAlertStatus"]')
    this.dismissLink = this.alert.querySelector('.moj-alert__dismiss')
    this.dismissed = false

    this.handleDismiss = this.handleDismiss.bind(this)
    this.showAlert = this.showAlert.bind(this)
    this.handleStartTimeChange = this.handleStartTimeChange.bind(this)
    this.handleRequest = this.handleRequest.bind(this)
    this.handleDateChange = this.handleDateChange.bind(this)

    this.init()
  }

  init() {
    if (!this.alert.classList.contains('display-none')) {
      this.dismissLink.addEventListener('click', this.handleDismiss)
    }

    if (this.dateInput) {
      this.dateInput.addEventListener('keyup', this.handleDateChange)
      this.dateInput.addEventListener('change', this.handleDateChange)
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async handleDismiss() {
    await fetch('/alert/dismiss', { method: 'POST' })
  }

  showAlert(show = false) {
    if (this.dismissed) return

    let statusMessage = ''
    const displayedStatus = 'Date selected is in the past, service alert displayed'
    const hiddenStatus = 'Date selected is today or in the future, service banner hidden'

    if (show && (this.status.innerText === hiddenStatus || !this.status.innerText)) {
      statusMessage = displayedStatus
    }

    if (!show && this.status.innerText === displayedStatus) {
      statusMessage = hiddenStatus
    }

    if (!show) {
      this.alert.classList.add('display-none')
      this.dismissLink.removeEventListener('click', this.handleDismiss)
    } else {
      this.alert.classList.remove('display-none')
      this.dismissLink.addEventListener('click', this.handleDismiss)
    }

    if (statusMessage) {
      this.status.innerText = statusMessage
    }
  }

  async handleStartTimeChange(event) {
    const time = DateTime.fromFormat(event.target.value, 'H:mm')
    if (time.isValid) {
      await this.handleRequest()
    } else {
      this.showAlert(false)
    }
  }

  async handleRequest(dateEvent = false) {
    const [day, month, year] = this.dateInput.value.split('/')
    const response = await fetch('/appointment/is-in-past', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: `${year}-${month}-${day}`,
        time: this.startInput.value,
      }),
    })

    const { isInPast, isToday, alertDismissed } = await response.json()
    this.dismissed = alertDismissed

    if (dateEvent) {
      this.startInput.removeEventListener('keyup', this.handleStartTimeChange)
      if (isToday) {
        this.startInput.addEventListener('keyup', this.handleStartTimeChange)
      }
    }

    this.showAlert(isInPast)
  }

  async handleDateChange() {
    const { value } = this.dateInput
    const dt = DateTime.fromFormat(value, 'd/M/yyyy')
    if (dt.isValid) {
      await this.handleRequest(true)
    } else {
      this.showAlert(false)
    }
  }
}

setNoFixedAddressConditional()
lastAppointment()
resetConditionals()
attendanceSelectors()
homeSearch()
crissHeaders()
recentCaseDisplay()
setupAlertsPage()
new ServiceAlert()
