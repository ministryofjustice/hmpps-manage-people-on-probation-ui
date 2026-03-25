import Page from '../page'

export default class AttendedFailedToComplyPage extends Page {
  constructor(name: string) {
    super(`Enforcement action for ${name}’s failure to comply`)
  }
}
