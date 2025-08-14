/* eslint-disable no-new */
/* eslint-disable prefer-template */
/* eslint-disable no-restricted-globals */

import * as govukFrontend from 'govuk-frontend'
import * as mojFrontend from '@ministryofjustice/frontend'
import './appInsights'
import './backendSortableTable'
import './mpopSortableTable'
import './predictors'

govukFrontend.initAll()
mojFrontend.initAll()
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
  let providerCode = ''
  if (providerSelect) {
    providerCode = providerSelect.value
    providerSelect.addEventListener('change', event => {
      const { form, value } = event.target
      form.action = `attendance?page=self&providerCode=${value}`
      form.submit()
    })
  }
  if (teamSelect) {
    teamSelect.addEventListener('change', event => {
      const { form, value } = event.target
      form.action = `attendance?page=self&providerCode=${providerCode}&teamCode=${value}`
      form.submit()
    })
  }
}

setNoFixedAddressConditional()
lastAppointment()
resetConditionals()
attendanceSelectors()

const search = document.getElementById('homepage-search-suggestions')

if (search) {
  search.addEventListener('click', e => {
    if (e.target.dataset.suggestedQuery) {
      document.getElementById('search').value = e.target.dataset.suggestedQuery
      document.getElementById('homepage-search-form').submit()
    }
  })
}

if (typeof MOJFrontend.MultiFileUpload !== 'undefined') {
  new MOJFrontend.MultiFileUpload({
    container: $('.moj-multi-file-upload'),
    uploadUrl: '/nominal/documents/uploadItem',
    deleteUrl: '/nominal/documents/deleteItem',
    dropzoneHintText: 'Drag and drop your files here.',
    uploadFileExitHook: uploadExit,
    fileDeleteHook: deleteExit,
    uploadFileErrorHook: errorHook,
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

  // Uploading finished when all delete buttons have appeared
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

  function uploadExit(_handle, _file, response) {
    // const $actions = $('.moj-multi-file-upload__actions')
    if (isAllFinished()) {
      continueButtonEnabled(true)
    } else if ($('.moj-multi-file-upload__list')) {
      // another file has been added
      continueButtonEnabled(false)
    }
  }

  function deleteExit(_handle, response) {
    const $row = $('.moj-multi-file-upload__row')
    if ($row && $row.length === 0) {
      continueButtonEnabled(false)
    }
  }

  function errorHook(handle, file, jqXHR, textStatus, errorThrown) {
    const message = file.name + ':' + (jqXHR.status === 413 ? 'File is over 100MB' : errorThrown || textStatus)
    const item = $(handle.getFileRowHtml(file))
    item.find('.moj-multi-file-upload__message').html(handle.getErrorHtml({ message }))
    handle.status.html(message)
    item.find('.moj-multi-file-upload__actions').append(handle.getDeleteButtonHtml({ filename: file.name }))
  }
}
