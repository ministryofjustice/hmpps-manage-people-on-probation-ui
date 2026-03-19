export const getUuid = (index = 2) => {
  return cy.url().then(currentUrl => {
    const split = currentUrl.split('?')[0].split('/')
    return split[split.length - index]
  })
}

export const getCheckinUuid = () => {
  return cy.url().then(currentUrl => {
    const split = currentUrl.split('?')[0].split('/')
    return split[split.length - 3]
  })
}

export const getCrn = () => {
  return cy.url().then(currentUrl => {
    const split = currentUrl.split('?')[0].split('/')
    return split[split.length - 4]
  })
}

export const normalise = (text: string) =>
  text
    .replace(/&nbsp;/g, ' ')
    .replace(/\n/g, '')
    .replace(/\s*<br>\s*/g, '<br>')
    .replace(/\s+/g, ' ')
    .trim()

export const to24HourTimeWithMinutes = (time: string): string => {
  const [rawHours, rawMinutes] = time.split(':')
  const hours = Number(rawHours)
  const minutes = Number(rawMinutes)
  const period = hours >= 12 ? 'pm' : 'am'
  const hour12 = hours % 12 || 12
  return `${hour12}:${minutes.toString().padStart(2, '0')}${period}`
}
