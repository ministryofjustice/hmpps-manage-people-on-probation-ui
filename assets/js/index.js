/* eslint-disable func-names */
/* eslint-disable no-new */
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

const multiFileUpload = () => {
  const enableDelete = window.enableDeleteAppointmentFile

  MOJFrontend.MultiFileUpload.prototype.uploadFile = function (file) {
    const item = $(this.getFileRowHtml(file))
    const formData = new FormData()
    formData.append('documents', file)
    this.params.uploadFileEntryHook(this, file, formData)
    this.feedbackContainer.find('.moj-multi-file-upload__list').append(item)

    $.ajax({
      url: this.params.uploadUrl,
      type: 'post',
      data: formData,
      processData: false,
      contentType: false,
      success: $.proxy(response => {
        if (response.error) {
          item.find('.moj-multi-file-upload__message').html(this.getErrorHtml(response.error, response.file.name))
          this.status.html(response.error.message)
        } else {
          item.find('.moj-multi-file-upload__message').html(this.getSuccessHtml(response.success, response.file.name))
          this.status.html(response.success.messageText)
        }
        if (enableDelete) {
          item.find('.moj-multi-file-upload__actions').append(this.getDeleteButtonHtml(response.file))
        }
        this.params.uploadFileExitHook(this, file, response)
      }, this),
      error: $.proxy((jqXHR, textStatus, errorThrown) => {
        this.params.uploadFileErrorHook(this, file, jqXHR, textStatus, errorThrown)
      }, this),
      xhr: () => {
        const xhr = new XMLHttpRequest()
        xhr.upload.addEventListener(
          'progress',
          e => {
            if (e.lengthComputable) {
              let percentComplete = e.loaded / e.total
              percentComplete = parseInt(percentComplete * 100, 10)
              item.find('.moj-multi-file-upload__progress').text(` ${percentComplete}%`)
            }
          },
          false,
        )
        return xhr
      },
    })
  }

  MOJFrontend.MultiFileUpload.prototype.getSuccessHtml = (
    success,
    filename = '',
    status = 'Uploaded',
    color = 'grey',
  ) => {
    return `<span class="moj-multi-file-upload__success"><span class="moj-multi-file-upload__message-text moj-multi-file-upload__message-text--with-icon"><svg class="moj-banner__icon" fill="currentColor" role="presentation" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25" height="25" width="25"><path d="M25,6.2L8.7,23.2L0,14.1l4-4.2l4.7,4.9L21,2L25,6.2z"/></svg>${success.messageHtml}</span><strong class="moj-multi-file-upload__message-status${!enableDelete ? ' moj-multi-file-upload__message-status--no-margin' : ''}"><string class="govuk-tag govuk-tag--${color}">${status}</strong></span>
     <input type="hidden" name="filesAdded_filename" value="${filename}">
     <input type="hidden" name="filesAdded_message" value="">
    <input type="hidden" name="filesAdded_error" value="false">`
  }

  MOJFrontend.MultiFileUpload.prototype.getErrorHtml = (
    error,
    filename = '',
    status = 'Upload failed',
    color = 'red',
  ) => {
    return `<span class="moj-multi-file-upload__error"><span class="moj-multi-file-upload__message-text moj-multi-file-upload__message-text--with-icon"><svg class="moj-banner__icon" fill="currentColor" role="presentation" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25" height="25" width="25"><path d="M13.6,15.4h-2.3v-4.5h2.3V15.4z M13.6,19.8h-2.3v-2.2h2.3V19.8z M0,23.2h25L12.5,2L0,23.2z"/></svg>${error.message}</span><strong class="moj-multi-file-upload__message-status${!enableDelete ? ' moj-multi-file-upload__message-status--no-margin' : ''}"><string class="govuk-tag govuk-tag--${color}">${status}</strong></span>
    <input type="hidden" name="filesAdded_filename" value="${filename}">
    <input type="hidden" name="filesAdded_message" value="${error.message}">
    <input type="hidden" name="filesAdded_error" value="true">`
  }

  MOJFrontend.MultiFileUpload.prototype.getFileRowHtml = file => {
    const html = `
      <div class="govuk-summary-list__row moj-multi-file-upload__row">
        <div class="govuk-summary-list__value moj-multi-file-upload__message">
        <div class="moj-multi-file-upload__message-text">
      <span class="moj-multi-file-upload__filename">${file.name}</span>
      <span class="moj-multi-file-upload__progress visibility-hidden">0%</span>
      </div>
      <strong class="moj-multi-file-upload__message-status"><string class="govuk-tag govuk-tag--yellow">Uploading</strong>
        </div>
        <div class="govuk-summary-list__actions moj-multi-file-upload__actions"></div>
      </div>`
    return html
  }

  const multiUpload = document.querySelector('.moj-multi-file-upload')
  if (typeof MOJFrontend.MultiFileUpload !== 'undefined' && multiUpload) {
    if (!enableDelete) {
      document.body.classList.add('feature-disabled')
    }
    new MOJFrontend.MultiFileUpload({
      container: $('.moj-multi-file-upload'),
      uploadUrl: '/appointments/file/upload',
      deleteUrl: '/appointments/file/delete',
      dropzoneHintText: 'Drag and drop files here or ',
      headers: {
        'CSRF-Token': window.csrfToken,
      },
      uploadFileEntryHook: uploadEntry,
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

    function uploadExit(_handle, _file, _response) {
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
      let message = ''
      switch (jqXHR.status) {
        case 413:
          message = `${file.name}: File size must be 5mb or under`
          break
        case 415:
          message = `${file.name}: file type must be pdf or word`
          break
        default:
          message = `${file.name}: ${textStatus || errorThrown}`
      }
      const item = $(handle.getFileRowHtml(file))
      item
        .find('.moj-multi-file-upload__message')
        .html(handle.getErrorHtml({ message }, file.name, 'Upload failed', 'red'))
      if (enableDelete) {
        item
          .find('.moj-multi-file-upload__actions')
          .append(handle.getDeleteButtonHtml({ filename: file.name }, 'Upload failed', 'red'))
      }
      const $row = handle.feedbackContainer.find(`.moj-multi-file-upload__row:contains("${file.name}")`)
      $row.replaceWith(item.prop('outerHTML'))
      handle.status.html(message)
    }
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
      }
    })
  }
}

setNoFixedAddressConditional()
lastAppointment()
resetConditionals()
attendanceSelectors()
homeSearch()
multiFileUpload()
crissHeaders()
