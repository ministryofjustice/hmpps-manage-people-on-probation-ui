const setupAlertsPage = () => {
  const selectAllButton = document.getElementById('select-all-alerts')
  const alertCheckboxes = document.querySelectorAll('.alert-checkbox')
  const form = document.getElementById('alerts-form')

  if (!form) return // Safely exit if table isn't rendered on screen

  const clearSubmitButton = document.getElementById('clear-selected-alerts')
  const modal = document.getElementById('clear-alerts-modal')
  const dialog = modal.querySelector('dialog')
  const textContentGroup = document.getElementById('modal-text-content')
  const modalCountSpan = document.getElementById('selected-alerts-count')
  const confirmClearBtn = document.getElementById('confirm-clear-btn')
  const closeModalBtn = document.getElementById('close-modal-btn')
  const closeModalXBtn = document.getElementById('close-modal-x-btn')
  const inertContainer = document.querySelector('.govuk-modal-dialogue-inert-container')

  // Read previous states cleanly from the container data attribute
  const previouslyClearedRaw = modal.getAttribute('data-previously-cleared') || ''
  const previouslyCleared = previouslyClearedRaw.split(',').filter(Boolean)

  if (selectAllButton && alertCheckboxes.length > 0) {
    selectAllButton.addEventListener('click', () => {
      const areAllSelected = Array.from(alertCheckboxes).every(checkbox => checkbox.checked)
      alertCheckboxes.forEach(checkbox => {
        // eslint-disable-next-line no-param-reassign
        checkbox.checked = !areAllSelected
      })
    })
    setInterval(() => {
      const areAllSelected = Array.from(alertCheckboxes).every(checkbox => checkbox.checked)
      selectAllButton.ariaPressed = areAllSelected
    }, 100)
  }

  form.addEventListener('submit', function (event) {
    const checkedBoxes = Array.from(alertCheckboxes).filter(cb => cb.checked)
    const checkedCount = checkedBoxes.length

    if (checkedCount === 0) {
      return
    }

    event.preventDefault()

    if (checkedCount === alertCheckboxes.length && previouslyCleared.length === 0) {
      modalCountSpan.textContent = 'all'
    } else {
      modalCountSpan.textContent = checkedCount
    }

    openModal()
  })

  function openModal() {
    modal.classList.add('govuk-modal-dialogue--open')
    if (typeof dialog.showModal === 'function') {
      dialog.showModal()
    } else {
      dialog.setAttribute('open', '')
    }
    if (inertContainer) {
      inertContainer.setAttribute('inert', 'true')
      inertContainer.setAttribute('aria-hidden', 'true')
    }
    if (textContentGroup) {
      textContentGroup.focus()
    }
  }

  function closeModal() {
    modal.classList.remove('govuk-modal-dialogue--open')
    if (typeof dialog.close === 'function') {
      dialog.close()
    } else {
      dialog.removeAttribute('open')
    }
    if (inertContainer) {
      inertContainer.removeAttribute('inert')
      inertContainer.removeAttribute('aria-hidden')
    }
    if (clearSubmitButton) {
      clearSubmitButton.focus()
    }
  }

  dialog.addEventListener('keydown', function (e) {
    if (e.key === 'Tab' || e.keyCode === 9) {
      const focusableElements = Array.from(dialog.querySelectorAll('button, [href], input, select, textarea'))
      const firstFocusable = focusableElements[0]
      const lastFocusable = focusableElements[focusableElements.length - 1]

      if (e.shiftKey) {
        if (
          document.activeElement === firstFocusable ||
          document.activeElement === textContentGroup ||
          document.activeElement === dialog
        ) {
          lastFocusable.focus()
          e.preventDefault()
        }
      } else if (document.activeElement === textContentGroup) {
        firstFocusable.focus()
        e.preventDefault()
      } else if (document.activeElement === lastFocusable) {
        firstFocusable.focus()
        e.preventDefault()
      }
    }
  })

  closeModalBtn.addEventListener('click', closeModal)
  if (closeModalXBtn) {
    closeModalXBtn.addEventListener('click', closeModal)
  }

  dialog.addEventListener('cancel', function (e) {
    e.preventDefault()
    closeModal()
  })

  confirmClearBtn.addEventListener('click', function () {
    const checkedBoxes = Array.from(alertCheckboxes).filter(cb => cb.checked)
    const currentSelectionIds = checkedBoxes.map(cb => cb.value)
    const combinedIds = [...new Set([...previouslyCleared, ...currentSelectionIds])]

    document.getElementById('clearedCountInput').value = combinedIds.length
    document.getElementById('clearedIdsInput').value = combinedIds.join(',')

    form.submit()
  })
}

export default setupAlertsPage
