export interface ProbationPractitioner {
  code: string
  name: {
    forename: string
    middleName?: string
    surname: string
  }
  provider: {
    code: string
    name: string
  }
  team: {
    description: string
    code: string
  }
  unallocated: boolean
  username: string
}
