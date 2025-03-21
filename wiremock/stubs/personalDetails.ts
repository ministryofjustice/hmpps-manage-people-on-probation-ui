import superagent, { SuperAgentRequest } from 'superagent'

const stubNoCircumstanceNotes = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: '/mas/personal-details/X000001/circumstances',
      method: 'GET',
    },
    response: {
      status: 200,
      jsonBody: {
        personSummary: {
          name: {
            forename: 'Eula',
            surname: 'Schmeler',
          },
          crn: 'X000001',
          dateOfBirth: '1979-08-18',
        },
        circumstances: [
          {
            id: 0,
            subType: 'Life imprisonment (Adult)',
            type: 'Committed/ Transferred to Crown',
            verified: true,
            startDate: '2021-04-03',
            circumstanceNotes: [],
            lastUpdated: '2023-03-20',
            lastUpdatedBy: {
              forename: 'Paul',
              surname: 'Smith',
            },
          },
        ],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubNullCircumstanceNote = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: '/mas/personal-details/X000001/circumstances',
      method: 'GET',
    },
    response: {
      status: 200,
      jsonBody: {
        personSummary: {
          name: {
            forename: 'Eula',
            surname: 'Schmeler',
          },
          crn: 'X000001',
          dateOfBirth: '1979-08-18',
        },
        circumstances: [
          {
            id: 0,
            subType: 'Life imprisonment (Adult)',
            type: 'Committed/ Transferred to Crown',
            verified: true,
            startDate: '2021-04-03',
            circumstanceNotes: [
              {
                id: 0,
                note: null,
                hasNoteBeenTruncated: false,
              },
              {
                id: 1,
                createdBy: 'Harry Kane',
                createdByDate: '2024-10-29',
                note: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
                hasNoteBeenTruncated: false,
              },
            ],
            lastUpdated: '2023-03-20',
            lastUpdatedBy: {
              forename: 'Paul',
              surname: 'Smith',
            },
          },
        ],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

export default { stubNoCircumstanceNotes, stubNullCircumstanceNote }
