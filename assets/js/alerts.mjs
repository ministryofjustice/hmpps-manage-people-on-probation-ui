/* eslint-disable no-console */

export const setupAlertsPage = () => {
  const selectAllButton = document.getElementById('select-all-alerts')
  const clearSelectedButton = document.getElementById('clear-selected-alerts')
  const alertCheckboxes = document.querySelectorAll('.alert-checkbox')

  const toggleClearButton = () => {
    const isAnyChecked = Array.from(alertCheckboxes).some(checkbox => checkbox.checked)
    if (clearSelectedButton) {
      clearSelectedButton.disabled = !isAnyChecked
    }
  }

  if (selectAllButton && alertCheckboxes.length > 0) {
    selectAllButton.addEventListener('click', () => {
      const areAllSelected = Array.from(alertCheckboxes).every(checkbox => checkbox.checked)
      alertCheckboxes.forEach(checkbox => {
        checkbox.checked = !areAllSelected
      })
      toggleClearButton()
    })
  }

  if (clearSelectedButton) {
    toggleClearButton()
    alertCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', toggleClearButton)
    })
  }
}