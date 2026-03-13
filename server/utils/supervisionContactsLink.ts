import config from '../config'

export const supervisionContactsAddLink = (crn: string) => {
  if (!crn) {
    return ''
  }
  return `${config.supervisionContacts.link}/case/${crn}/add-frequently-used-contact`
}
