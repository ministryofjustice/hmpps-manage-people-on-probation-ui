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
  }
}

export default setupAlertsPage
