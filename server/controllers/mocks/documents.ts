import { PersonDocuments } from '../../data/model/documents'

export const mockDocuments = {
  personSummary: {
    name: {
      forename: 'Caroline',
      surname: 'Wolff',
    },
    crn: 'X000001',
    dateOfBirth: '1979-08-18',
  },
  documents: [
    {
      alfrescoId: '83fdbf8a-a2f2-43b4-93ef-67e71c04fc58',
      name: 'Eula-Schmeler-X000001-UPW-1.pdf',
      createdAt: '2023-04-05T12:06:25.672587+01:00',
      lastUpdatedAt: '2023-04-06T11:06:25.672587+01:00',
      level: 'Level 1',
      author: 'Author 1',
      type: 'Type 1',
    },
    {
      alfrescoId: 'c2650260-9568-476e-a293-0b168027a5f1',
      name: 'Eula-Schmeler-X000001-UPW-2.pdf',
      createdAt: '2021-04-05T10:06:25.672587+01:00',
      lastUpdatedAt: '2022-04-06T13:09:45.860739+01:00',
      level: 'Level 2',
      author: 'Author 2',
      status: 'Sensitive',
      type: 'Type 2',
    },
    {
      alfrescoId: 'b82e444b-c77c-4d44-bf99-4ce4dc426ff4',
      name: 'other-doc.pdf',
      createdAt: '2020-02-05T12:04:25.672587+01:00',
      lastUpdatedAt: '2021-03-06T12:21:17.06356+01:00',
      level: 'Level 3',
      author: 'Author 3',
      type: 'Type 3',
    },
  ],
  totalPages: 4,
  totalElements: 33,
  sortedBy: 'lastUpdatedAt.desc',
} as unknown as PersonDocuments
