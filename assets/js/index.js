import * as govukFrontend from 'govuk-frontend'
import * as mojFrontend from '@ministryofjustice/frontend'
import './appInsights'
import './backendSortableTable'
import './predictors'

govukFrontend.initAll()
mojFrontend.initAll()

/* eslint-disable no-restricted-globals */
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
      // eslint-disable-next-line no-param-reassign
      radioBtn.checked = false
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
