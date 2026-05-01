import superagent, { SuperAgentRequest } from 'superagent'

const stubNoAllocatedCOM = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: '/mas/case/.*/probation-practitioner',
      method: 'GET',
    },
    response: {
      status: 200,
      jsonBody: {
        code: 'N07B795',
        name: {
          forename: 'Deborah',
          surname: 'Fern',
        },
        provider: {
          code: 'N07',
          name: 'London',
        },
        team: {
          code: 'N07AAT',
          description: 'Automated Allocation Team',
        },
        unallocated: true,
        username: 'DeborahFern',
        email: 'deborah.fern@testemail.com',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubProbationPractitioner = ({
  crn,
  username = 'DeborahFern',
}: {
  crn: string
  username?: string
}): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: `/mas/case/${crn}/probation-practitioner`,
      method: 'GET',
    },
    response: {
      status: 200,
      jsonBody: {
        responsibleOfficer: {
          staff: {
            username,
          },
        },
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubPersonAppointment = ({
  crn,
  contactId,
  type = 'Office visit',
}: {
  crn: string
  contactId: string
  type?: string
}): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: `/mas/case/${crn}/appointment/${contactId}`,
      method: 'GET',
    },
    response: {
      status: 200,
      jsonBody: {
        type,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

export default {
  stubNoAllocatedCOM,
  stubProbationPractitioner,
  stubPersonAppointment,
}
