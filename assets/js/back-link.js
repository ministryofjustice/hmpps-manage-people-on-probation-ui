const initGovUkBackLink = () => {
  document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.getElementById('js-back-wrapper')
    if (!wrapper) return

    const link = document.createElement('a')
    link.textContent = 'Back'
    link.className = 'govuk-back-link'
    link.href = '/' // fallback if no history

    link.addEventListener('click', e => {
      if (window.history.length > 1) {
        e.preventDefault()
        window.history.back()
      }
    })

    wrapper.appendChild(link)
  })
}

export default initGovUkBackLink
