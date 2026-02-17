export const getComplianceStatus = (failureToComplyCount: number, breachStarted: boolean) => {
  const status: { text: string; panelClass: string } = {
    text: '',
    panelClass: '',
  }
  if (breachStarted) {
    status.text = 'Breach in progress'
    status.panelClass = 'app-compliance-panel--red'
  } else {
    switch (failureToComplyCount) {
      case 0:
        status.text = 'No failures to comply within 12 months'
        status.panelClass = 'app-compliance-panel--green'
        break
      case 1:
        status.text = '1 failure to comply within 12 months'
        status.panelClass = ''
        break
      default:
        status.text = `${failureToComplyCount} failures to comply within 12 months. No breach in progress yet.`
        status.panelClass = 'app-compliance-panel--red'
        break
    }
  }
  return status
}
