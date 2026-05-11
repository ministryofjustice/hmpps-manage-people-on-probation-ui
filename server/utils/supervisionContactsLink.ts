import config from '../config'

export const supervisionContactsAddLink = (crn: string) => {
  if (!crn) {
    return ''
  }
  return `${config.supervisionContacts.link}/case/${crn}/add-frequently-used-contact`
}

export const supervisionContactsUpdateLink = (crn: string, contactId: string) => {
  if (!crn || !contactId) {
    return ''
  }

  return `${config.supervisionContacts.link}/case/${crn}/${contactId}/update-contact`
}
