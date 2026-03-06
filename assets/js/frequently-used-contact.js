/**
 * Intercepts the "Add frequently used contact" form submission.
 * If 'NDELIUS' is selected, it performs two actions:
 * 1. Opens the NDelius deep link in a new browser tab.
 * 2. Redirects the current application tab to the activity log.
 */
const setupFrequentlyUsedContact = () => {
  const form = document.getElementById('choose-contact-form')

  if (form) {
    const { ndeliusUrl } = form.dataset
    const { backUrl } = form.dataset

    if (!ndeliusUrl || !backUrl) {
      return
    }

    form.addEventListener('submit', event => {
      const selected = document.querySelector('input[name="contactType"]:checked')

      if (selected && selected.value === 'NDELIUS') {
        event.preventDefault()

        const newTab = window.open(ndeliusUrl, '_blank')

        if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
          window.location.href = ndeliusUrl
        } else {
          setTimeout(() => {
            window.location.href = backUrl
          }, 200)
        }
      }
    })
  }
}

export default setupFrequentlyUsedContact
