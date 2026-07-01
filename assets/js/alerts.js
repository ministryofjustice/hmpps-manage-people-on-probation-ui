const setupAlertsPage = () => {
  const selectAllButton = document.getElementById('select-all-alerts')
  const alertCheckboxes = document.querySelectorAll('.alert-checkbox')

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
}

export default setupAlertsPage
