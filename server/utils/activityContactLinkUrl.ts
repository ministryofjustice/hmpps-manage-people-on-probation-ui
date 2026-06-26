export const activityLinkUrl = (crn: string, contactId: string, appointmentId: string): string => {
  const backLink = `/case/${crn}/appointments/appointment/${appointmentId}/manage?back=/case/${crn}/appointments`

  return `/case/${crn}/activity/${contactId}?back=${encodeURIComponent(backLink)}`
}
