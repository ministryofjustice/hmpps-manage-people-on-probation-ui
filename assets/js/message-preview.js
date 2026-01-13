const handleMessagePreview = () => {
  const elm = document.getElementById('smsPreview')
  if (elm) {
    const debounceDelay = 300
    const path = document.location.pathname.split('/')
    const crn = path[2]
    const uuid = path[4]
    const dateInput = document.querySelector(`#appointments-${crn}-${uuid}-date`)
    const startInput = document.querySelector(`#appointments-${crn}-${uuid}-start`)
    const locationOptions = document.querySelectorAll('[data-qa=locationOption]')
    const button = elm.querySelector('button')
    const wrapper = elm.querySelector('.sms-message-wrapper')
    const status = elm.querySelector('#message-preview-status')
    let preview = ''

    const debounce = (fn, delay) => {
      let timer
      return (...args) => {
        clearTimeout(timer)
        timer = setTimeout(() => fn.apply(this, args), delay)
      }
    }

    const showPreview = event => {
      event.preventDefault()
      const current = event.currentTarget
      const next = current.nextElementSibling
      wrapper.innerHTML = preview
      if (!next.getAttribute('open')) {
        next.setAttribute('open', '')
      }
      const announcePreview = preview.split('<p>').join('').split('</p>').join(' ').trim()
      status.innerText = announcePreview
    }

    const handleGeneratePreview = async () => {
      const date = dateInput.value
      const start = startInput.value
      let location = null
      const index = [...locationOptions].findIndex(option => option.checked)
      if (index > -1) {
        location = document
          .querySelectorAll(`[data-qa=locationCode] .govuk-radios__item`)
          [index].querySelector('label').innerText
      }
      button.setAttribute('disabled', '')
      button.setAttribute('aria-disabled', 'true')
      button.removeEventListener('click', showPreview)
      status.innerText = 'Generate preview button disabled'
      const response = await fetch('/appointment/sms-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crn,
          uuid,
          date,
          start,
          location,
        }),
      })
      ;({ preview } = await response.json())
      if (preview) {
        button.removeAttribute('disabled')
        button.removeAttribute('aria-disabled')
        button.addEventListener('click', showPreview)
        status.innerText = 'Generate preview button enabled'
      }
    }
    dateInput.addEventListener(
      'keyup',
      debounce(_event => {
        handleGeneratePreview()
      }, debounceDelay),
    )
    dateInput.addEventListener(
      'change',
      debounce(_event => {
        handleGeneratePreview()
      }, debounceDelay),
    )
    startInput.addEventListener(
      'keyup',
      debounce(_event => {
        handleGeneratePreview()
      }, debounceDelay),
    )
    locationOptions.forEach(option => {
      option.addEventListener('click', handleGeneratePreview)
    })
    handleGeneratePreview()
  }
}

handleMessagePreview()
