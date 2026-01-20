import superagent, { SuperAgentRequest } from 'superagent'

const stubPersonalDetailsNoMobileNumber = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: '/mas/personal-details/X000001',
    },
    response: {
      status: 200,
      jsonBody: {
        crn: 'X000001',
        pnc: '1954/0018147W',
        noms: 'G9566GQ',
        name: {
          forename: 'Caroline',
          surname: 'Wolff',
        },
        contacts: [
          {
            personSummary: {
              name: {
                forename: 'Eula',
                surname: 'Schmeler',
              },
              crn: 'X000001',
              dateOfBirth: '1979-08-18',
            },
            contactId: 2500233993,
            name: {
              forename: 'Steve',
              surname: 'Wilson',
            },
            relationship: 'GP (secondary)',
            relationshipType: 'GP',
            address: {
              buildingName: 'The Building',
              buildingNumber: '77',
              streetName: 'Some Street',
              district: 'Some City Centre',
              town: 'London',
              county: 'Essex',
              postcode: 'NW10 1EP',
              lastUpdated: '2023-03-14',
            },
          },
          {
            personSummary: {
              name: {
                forename: 'Eula',
                surname: 'Schmeler',
              },
              crn: 'X000001',
              dateOfBirth: '1979-08-18',
            },
            contactId: 2500232995,
            name: {
              forename: 'Brian',
              surname: 'Smith',
            },
            relationship: 'Father',
            relationshipType: 'Emergency Contact',
            address: {
              buildingNumber: '36',
              streetName: 'Fifth Street',
              district: 'South City Centre',
              town: 'London',
              county: 'South London',
              postcode: 'W10 4DN',
              lastUpdated: '2023-03-14',
            },
          },
          {
            personSummary: {
              name: {
                forename: 'Eula',
                surname: 'Schmeler',
              },
              crn: 'X000001',
              dateOfBirth: '1979-08-18',
            },
            contactId: 2500232996,
            name: {
              forename: 'Nick',
              surname: 'Riviera',
            },
            relationship: 'GP',
            relationshipType: 'GP',
            address: {
              buildingName: 'The practice',
              buildingNumber: '38',
              streetName: 'East Street',
              district: 'East City Centre',
              town: 'Bristol',
              county: 'East London',
              postcode: 'E5 7BS',
              lastUpdated: '2023-03-14',
            },
          },
          {
            personSummary: {
              name: {
                forename: 'Eula',
                surname: 'Schmeler',
              },
              crn: 'X000001',
              dateOfBirth: '1979-08-18',
            },
            contactId: 2500244492,
            name: {
              forename: 'Ms',
              surname: 'Schmeler',
            },
            relationship: 'Mother',
            relationshipType: 'Emergency Contact',
          },
        ],
        addressTypes: [
          {
            code: 'BASS',
            description: 'BASS accommodation 13 weeks or more',
          },
          {
            code: 'HL',
            description: 'Homeless - Shelter/Emergency Hostel/Campsite',
          },
          {
            code: 'HO',
            description: 'Householder (Owner - freehold or leasehold)',
          },
        ],
        staffContacts: [
          {
            name: 'Arhsimna Xolfo',
            email: 'arhsimna.xolfo@moj.gov.uk',
            telephoneNumber: '07321165373',
            provider: 'London',
            probationDeliveryUnit: 'All London',
            team: 'Unallocated Team (N07)',
            allocatedDate: '2025-04-22',
            lastUpdated: '2024-04-30',
            responsibleOfficer: true,
            prisonOffenderManager: false,
          },
          {
            name: 'Bruce Wayne',
            provider: 'Leicester',
            probationDeliveryUnit: 'Leicestershire All',
            team: 'OMU B',
            allocatedDate: '2025-01-12',
            lastUpdated: '2023-03-03',
            responsibleOfficer: false,
            prisonOffenderManager: true,
          },
        ],
        mainAddress: {
          buildingNumber: '32',
          streetName: 'SCOTLAND STREET',
          town: 'Sheffield',
          county: 'South Yorkshire',
          postcode: 'S3 7BS',
          from: '2023-03-14',
          verified: true,
          lastUpdated: '2023-03-20',
          type: 'Householder (Owner - freehold or leasehold)',
          typeCode: 'HO',
          status: 'Main',
          addressNotes: [
            {
              id: 0,
              createdBy: 'Tom Brady',
              createdByDate: '2024-10-29',
              note: 'Main Address created automatically from the Create and Vary a licence system of\nAllow person(s) as designated by your supervising officer to install an electronic monitoring tag on you and access to install any associated equipment in your property, and for the purpose of ensuring that equipment is functioning correctly. You must not damage or tamper with these devices and ensure that the tag is charged, and report to your supervising officer and the EM provider immediately if the tag or the associated equipment are not working correctly. This will be for the purpose of monitoring your alcohol abstinence Main Address(s) unless otherwise authorised by your supervising officer. Main Address created automatically from the Create and Vary a licence system of\nAllow person(s) as designated by your supervising officer to install an electronic monitoring tag on you and access to install any associated equipment in your property, and for the purpose of ensuring that equipment is functioning correctly. You must not damage or tamper with these devices and ensure that the tag is charged, and report to your supervising officer and the EM provider immediately if the tag or the associated equipment are not working correctly. This will be for the purpose of monitoring your alcohol abstinence Main Address(s) unless otherwise authorised by your supervising officer.Main Address created automatically from the Create and Vary a licence system of\nAllow person(s) as desi',
              hasNoteBeenTruncated: true,
            },
            {
              id: 1,
              note: 'main address note 2',
              hasNoteBeenTruncated: false,
            },
            {
              id: 2,
              note: 'main address note 1',
              hasNoteBeenTruncated: true,
            },
          ],
          noFixedAddress: true,
          lastUpdatedBy: {
            forename: 'NDelius03',
            surname: 'NDelius03',
          },
        },
        otherAddressCount: 1,
        previousAddressCount: 1,
        preferredGender: 'Female',
        dateOfBirth: '1979-08-18',
        preferredLanguage: 'Urdu',
        religionOrBelief: 'Scientology',
        sexualOrientation: 'Heterosexual',
        genderIdentity: 'Non-Binary',
        previousSurname: 'Jones',
        aliases: [
          {
            forename: 'John',
            surname: 'Smith',
          },
          {
            forename: 'Jonny',
            surname: 'Smith',
          },
        ],
        telephoneNumber: '0123456999',
        email: 'address1@gmail.com',
        circumstances: {
          circumstances: [
            {
              subType: 'Allergies',
              type: 'Code not found in Migration',
            },
            {
              subType: 'Is a Primary Carer',
              type: 'Transferred to Crown Court',
            },
            {
              subType: 'Maternity',
              type: 'Training',
            },
            {
              subType: 'Language/Communication Concerns',
              type: 'Adjourned - Other Report',
            },
          ],
          lastUpdated: '2023-04-06',
        },
        disabilities: {
          disabilities: [
            'Hearing Disabilities',
            'Learning Disability',
            'Mental Health related disabilities',
            'Mobility related Disabilities',
          ],
          lastUpdated: '2023-04-06',
        },
        provisions: {
          provisions: ['Handrails', 'Behavioural responses/Body language'],
          lastUpdated: '2023-05-12',
        },
        sex: 'Female',
        documents: [
          {
            id: '83fdbf8a-a2f2-43b4-93ef-67e71c04fc58',
            name: 'Eula-Schmeler-X000001-UPW.pdf',
            lastUpdated: '2023-04-06T11:06:25.672587+01:00',
          },
          {
            id: 'c2650260-9568-476e-a293-0b168027a5f1',
            name: 'Eula-Schmeler-X000001-UPW.pdf',
            lastUpdated: '2023-04-06T11:09:45.860739+01:00',
          },
          {
            id: 'b82e444b-c77c-4d44-bf99-4ce4dc426ff4',
            name: 'Eula-Schmeler-X000001-UPW.pdf',
            lastUpdated: '2023-04-06T11:21:17.06356+01:00',
          },
        ],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubPersonalDetailsNoTelephoneNumbers = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: '/mas/personal-details/X000001',
    },
    response: {
      status: 200,
      jsonBody: {
        crn: 'X000001',
        pnc: '1954/0018147W',
        noms: 'G9566GQ',
        name: {
          forename: 'Caroline',
          surname: 'Wolff',
        },
        contacts: [
          {
            personSummary: {
              name: {
                forename: 'Eula',
                surname: 'Schmeler',
              },
              crn: 'X000001',
              dateOfBirth: '1979-08-18',
            },
            contactId: 2500233993,
            name: {
              forename: 'Steve',
              surname: 'Wilson',
            },
            relationship: 'GP (secondary)',
            relationshipType: 'GP',
            address: {
              buildingName: 'The Building',
              buildingNumber: '77',
              streetName: 'Some Street',
              district: 'Some City Centre',
              town: 'London',
              county: 'Essex',
              postcode: 'NW10 1EP',
              lastUpdated: '2023-03-14',
            },
          },
          {
            personSummary: {
              name: {
                forename: 'Eula',
                surname: 'Schmeler',
              },
              crn: 'X000001',
              dateOfBirth: '1979-08-18',
            },
            contactId: 2500232995,
            name: {
              forename: 'Brian',
              surname: 'Smith',
            },
            relationship: 'Father',
            relationshipType: 'Emergency Contact',
            address: {
              buildingNumber: '36',
              streetName: 'Fifth Street',
              district: 'South City Centre',
              town: 'London',
              county: 'South London',
              postcode: 'W10 4DN',
              lastUpdated: '2023-03-14',
            },
          },
          {
            personSummary: {
              name: {
                forename: 'Eula',
                surname: 'Schmeler',
              },
              crn: 'X000001',
              dateOfBirth: '1979-08-18',
            },
            contactId: 2500232996,
            name: {
              forename: 'Nick',
              surname: 'Riviera',
            },
            relationship: 'GP',
            relationshipType: 'GP',
            address: {
              buildingName: 'The practice',
              buildingNumber: '38',
              streetName: 'East Street',
              district: 'East City Centre',
              town: 'Bristol',
              county: 'East London',
              postcode: 'E5 7BS',
              lastUpdated: '2023-03-14',
            },
          },
          {
            personSummary: {
              name: {
                forename: 'Eula',
                surname: 'Schmeler',
              },
              crn: 'X000001',
              dateOfBirth: '1979-08-18',
            },
            contactId: 2500244492,
            name: {
              forename: 'Ms',
              surname: 'Schmeler',
            },
            relationship: 'Mother',
            relationshipType: 'Emergency Contact',
          },
        ],
        addressTypes: [
          {
            code: 'BASS',
            description: 'BASS accommodation 13 weeks or more',
          },
          {
            code: 'HL',
            description: 'Homeless - Shelter/Emergency Hostel/Campsite',
          },
          {
            code: 'HO',
            description: 'Householder (Owner - freehold or leasehold)',
          },
        ],
        staffContacts: [
          {
            name: 'Arhsimna Xolfo',
            email: 'arhsimna.xolfo@moj.gov.uk',
            telephoneNumber: '07321165373',
            provider: 'London',
            probationDeliveryUnit: 'All London',
            team: 'Unallocated Team (N07)',
            allocatedDate: '2025-04-22',
            lastUpdated: '2024-04-30',
            responsibleOfficer: true,
            prisonOffenderManager: false,
          },
          {
            name: 'Bruce Wayne',
            provider: 'Leicester',
            probationDeliveryUnit: 'Leicestershire All',
            team: 'OMU B',
            allocatedDate: '2025-01-12',
            lastUpdated: '2023-03-03',
            responsibleOfficer: false,
            prisonOffenderManager: true,
          },
        ],
        mainAddress: {
          buildingNumber: '32',
          streetName: 'SCOTLAND STREET',
          town: 'Sheffield',
          county: 'South Yorkshire',
          postcode: 'S3 7BS',
          from: '2023-03-14',
          verified: true,
          lastUpdated: '2023-03-20',
          type: 'Householder (Owner - freehold or leasehold)',
          typeCode: 'HO',
          status: 'Main',
          addressNotes: [
            {
              id: 0,
              createdBy: 'Tom Brady',
              createdByDate: '2024-10-29',
              note: 'Main Address created automatically from the Create and Vary a licence system of\nAllow person(s) as designated by your supervising officer to install an electronic monitoring tag on you and access to install any associated equipment in your property, and for the purpose of ensuring that equipment is functioning correctly. You must not damage or tamper with these devices and ensure that the tag is charged, and report to your supervising officer and the EM provider immediately if the tag or the associated equipment are not working correctly. This will be for the purpose of monitoring your alcohol abstinence Main Address(s) unless otherwise authorised by your supervising officer. Main Address created automatically from the Create and Vary a licence system of\nAllow person(s) as designated by your supervising officer to install an electronic monitoring tag on you and access to install any associated equipment in your property, and for the purpose of ensuring that equipment is functioning correctly. You must not damage or tamper with these devices and ensure that the tag is charged, and report to your supervising officer and the EM provider immediately if the tag or the associated equipment are not working correctly. This will be for the purpose of monitoring your alcohol abstinence Main Address(s) unless otherwise authorised by your supervising officer.Main Address created automatically from the Create and Vary a licence system of\nAllow person(s) as desi',
              hasNoteBeenTruncated: true,
            },
            {
              id: 1,
              note: 'main address note 2',
              hasNoteBeenTruncated: false,
            },
            {
              id: 2,
              note: 'main address note 1',
              hasNoteBeenTruncated: true,
            },
          ],
          noFixedAddress: true,
          lastUpdatedBy: {
            forename: 'NDelius03',
            surname: 'NDelius03',
          },
        },
        otherAddressCount: 1,
        previousAddressCount: 1,
        preferredGender: 'Female',
        dateOfBirth: '1979-08-18',
        preferredLanguage: 'Urdu',
        religionOrBelief: 'Scientology',
        sexualOrientation: 'Heterosexual',
        genderIdentity: 'Non-Binary',
        previousSurname: 'Jones',
        aliases: [
          {
            forename: 'John',
            surname: 'Smith',
          },
          {
            forename: 'Jonny',
            surname: 'Smith',
          },
        ],
        email: 'address1@gmail.com',
        circumstances: {
          circumstances: [
            {
              subType: 'Allergies',
              type: 'Code not found in Migration',
            },
            {
              subType: 'Is a Primary Carer',
              type: 'Transferred to Crown Court',
            },
            {
              subType: 'Maternity',
              type: 'Training',
            },
            {
              subType: 'Language/Communication Concerns',
              type: 'Adjourned - Other Report',
            },
          ],
          lastUpdated: '2023-04-06',
        },
        disabilities: {
          disabilities: [
            'Hearing Disabilities',
            'Learning Disability',
            'Mental Health related disabilities',
            'Mobility related Disabilities',
          ],
          lastUpdated: '2023-04-06',
        },
        provisions: {
          provisions: ['Handrails', 'Behavioural responses/Body language'],
          lastUpdated: '2023-05-12',
        },
        sex: 'Female',
        documents: [
          {
            id: '83fdbf8a-a2f2-43b4-93ef-67e71c04fc58',
            name: 'Eula-Schmeler-X000001-UPW.pdf',
            lastUpdated: '2023-04-06T11:06:25.672587+01:00',
          },
          {
            id: 'c2650260-9568-476e-a293-0b168027a5f1',
            name: 'Eula-Schmeler-X000001-UPW.pdf',
            lastUpdated: '2023-04-06T11:09:45.860739+01:00',
          },
          {
            id: 'b82e444b-c77c-4d44-bf99-4ce4dc426ff4',
            name: 'Eula-Schmeler-X000001-UPW.pdf',
            lastUpdated: '2023-04-06T11:21:17.06356+01:00',
          },
        ],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubPersonalDetailsDateOfDeath = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: '/mas/personal-details/X000001',
    },
    response: {
      status: 200,
      jsonBody: {
        crn: 'X000001',
        pnc: '1954/0018147W',
        noms: 'G9566GQ',
        name: {
          forename: 'Caroline',
          surname: 'Wolff',
        },
        contacts: [
          {
            personSummary: {
              name: {
                forename: 'Eula',
                surname: 'Schmeler',
              },
              crn: 'X000001',
              dateOfBirth: '1979-08-18',
            },
            contactId: 2500233993,
            name: {
              forename: 'Steve',
              surname: 'Wilson',
            },
            relationship: 'GP (secondary)',
            relationshipType: 'GP',
            address: {
              buildingName: 'The Building',
              buildingNumber: '77',
              streetName: 'Some Street',
              district: 'Some City Centre',
              town: 'London',
              county: 'Essex',
              postcode: 'NW10 1EP',
              lastUpdated: '2023-03-14',
            },
          },
          {
            personSummary: {
              name: {
                forename: 'Eula',
                surname: 'Schmeler',
              },
              crn: 'X000001',
              dateOfBirth: '1979-08-18',
            },
            contactId: 2500232995,
            name: {
              forename: 'Brian',
              surname: 'Smith',
            },
            relationship: 'Father',
            relationshipType: 'Emergency Contact',
            address: {
              buildingNumber: '36',
              streetName: 'Fifth Street',
              district: 'South City Centre',
              town: 'London',
              county: 'South London',
              postcode: 'W10 4DN',
              lastUpdated: '2023-03-14',
            },
          },
          {
            personSummary: {
              name: {
                forename: 'Eula',
                surname: 'Schmeler',
              },
              crn: 'X000001',
              dateOfBirth: '1979-08-18',
            },
            contactId: 2500232996,
            name: {
              forename: 'Nick',
              surname: 'Riviera',
            },
            relationship: 'GP',
            relationshipType: 'GP',
            address: {
              buildingName: 'The practice',
              buildingNumber: '38',
              streetName: 'East Street',
              district: 'East City Centre',
              town: 'Bristol',
              county: 'East London',
              postcode: 'E5 7BS',
              lastUpdated: '2023-03-14',
            },
          },
          {
            personSummary: {
              name: {
                forename: 'Eula',
                surname: 'Schmeler',
              },
              crn: 'X000001',
              dateOfBirth: '1979-08-18',
            },
            contactId: 2500244492,
            name: {
              forename: 'Ms',
              surname: 'Schmeler',
            },
            relationship: 'Mother',
            relationshipType: 'Emergency Contact',
          },
        ],
        addressTypes: [
          {
            code: 'BASS',
            description: 'BASS accommodation 13 weeks or more',
          },
          {
            code: 'HL',
            description: 'Homeless - Shelter/Emergency Hostel/Campsite',
          },
          {
            code: 'HO',
            description: 'Householder (Owner - freehold or leasehold)',
          },
        ],
        staffContacts: [
          {
            name: 'Arhsimna Xolfo',
            email: 'arhsimna.xolfo@moj.gov.uk',
            telephoneNumber: '07321165373',
            provider: 'London',
            probationDeliveryUnit: 'All London',
            team: 'Unallocated Team (N07)',
            allocatedDate: '2025-04-22',
            lastUpdated: '2024-04-30',
            responsibleOfficer: true,
            prisonOffenderManager: false,
          },
          {
            name: 'Bruce Wayne',
            provider: 'Leicester',
            probationDeliveryUnit: 'Leicestershire All',
            team: 'OMU B',
            allocatedDate: '2025-01-12',
            lastUpdated: '2023-03-03',
            responsibleOfficer: false,
            prisonOffenderManager: true,
          },
        ],
        mainAddress: {
          buildingNumber: '32',
          streetName: 'SCOTLAND STREET',
          town: 'Sheffield',
          county: 'South Yorkshire',
          postcode: 'S3 7BS',
          from: '2023-03-14',
          verified: true,
          lastUpdated: '2023-03-20',
          type: 'Householder (Owner - freehold or leasehold)',
          typeCode: 'HO',
          status: 'Main',
          addressNotes: [
            {
              id: 0,
              createdBy: 'Tom Brady',
              createdByDate: '2024-10-29',
              note: 'Main Address created automatically from the Create and Vary a licence system of\nAllow person(s) as designated by your supervising officer to install an electronic monitoring tag on you and access to install any associated equipment in your property, and for the purpose of ensuring that equipment is functioning correctly. You must not damage or tamper with these devices and ensure that the tag is charged, and report to your supervising officer and the EM provider immediately if the tag or the associated equipment are not working correctly. This will be for the purpose of monitoring your alcohol abstinence Main Address(s) unless otherwise authorised by your supervising officer. Main Address created automatically from the Create and Vary a licence system of\nAllow person(s) as designated by your supervising officer to install an electronic monitoring tag on you and access to install any associated equipment in your property, and for the purpose of ensuring that equipment is functioning correctly. You must not damage or tamper with these devices and ensure that the tag is charged, and report to your supervising officer and the EM provider immediately if the tag or the associated equipment are not working correctly. This will be for the purpose of monitoring your alcohol abstinence Main Address(s) unless otherwise authorised by your supervising officer.Main Address created automatically from the Create and Vary a licence system of\nAllow person(s) as desi',
              hasNoteBeenTruncated: true,
            },
            {
              id: 1,
              note: 'main address note 2',
              hasNoteBeenTruncated: false,
            },
            {
              id: 2,
              note: 'main address note 1',
              hasNoteBeenTruncated: true,
            },
          ],
          noFixedAddress: true,
          lastUpdatedBy: {
            forename: 'NDelius03',
            surname: 'NDelius03',
          },
        },
        otherAddressCount: 1,
        previousAddressCount: 1,
        preferredGender: 'Female',
        dateOfBirth: '1979-08-18',
        dateOfDeath: '2024-09-11',
        preferredLanguage: 'Urdu',
        religionOrBelief: 'Scientology',
        sexualOrientation: 'Heterosexual',
        genderIdentity: 'Non-Binary',
        previousSurname: 'Jones',
        aliases: [
          {
            forename: 'John',
            surname: 'Smith',
          },
          {
            forename: 'Jonny',
            surname: 'Smith',
          },
        ],
        telephoneNumber: '0123456999',
        mobileNumber: '07783889300',
        email: 'address1@gmail.com',
        circumstances: {
          circumstances: [
            {
              subType: 'Allergies',
              type: 'Code not found in Migration',
            },
            {
              subType: 'Is a Primary Carer',
              type: 'Transferred to Crown Court',
            },
            {
              subType: 'Maternity',
              type: 'Training',
            },
            {
              subType: 'Language/Communication Concerns',
              type: 'Adjourned - Other Report',
            },
          ],
          lastUpdated: '2023-04-06',
        },
        disabilities: {
          disabilities: [
            'Hearing Disabilities',
            'Learning Disability',
            'Mental Health related disabilities',
            'Mobility related Disabilities',
          ],
          lastUpdated: '2023-04-06',
        },
        provisions: {
          provisions: ['Handrails', 'Behavioural responses/Body language'],
          lastUpdated: '2023-05-12',
        },
        sex: 'Female',
        documents: [
          {
            id: '83fdbf8a-a2f2-43b4-93ef-67e71c04fc58',
            name: 'Eula-Schmeler-X000001-UPW.pdf',
            lastUpdated: '2023-04-06T11:06:25.672587+01:00',
          },
          {
            id: 'c2650260-9568-476e-a293-0b168027a5f1',
            name: 'Eula-Schmeler-X000001-UPW.pdf',
            lastUpdated: '2023-04-06T11:09:45.860739+01:00',
          },
          {
            id: 'b82e444b-c77c-4d44-bf99-4ce4dc426ff4',
            name: 'Eula-Schmeler-X000001-UPW.pdf',
            lastUpdated: '2023-04-06T11:21:17.06356+01:00',
          },
        ],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubPersonalDetailsDateOfDeathManage = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: '/mas/personal-details/X778160',
      method: 'GET',
    },
    response: {
      status: 200,
      jsonBody: {
        crn: 'X000001',
        name: {
          forename: 'Alton',
          surname: 'Berge',
        },
        contacts: [
          {
            personSummary: {
              name: {
                forename: 'Eula',
                surname: 'Schmeler',
              },
              crn: 'X000001',
              dateOfBirth: '1979-08-18',
            },
            contactId: 2500233993,
            name: {
              forename: 'Steve',
              surname: 'Wilson',
            },
            relationship: 'GP (secondary)',
            relationshipType: 'GP',
            address: {
              buildingName: 'The Building',
              buildingNumber: '77',
              streetName: 'Some Street',
              district: 'Some City Centre',
              town: 'London',
              county: 'Essex',
              postcode: 'NW10 1EP',
              lastUpdated: '2023-03-14',
            },
          },
          {
            personSummary: {
              name: {
                forename: 'Eula',
                surname: 'Schmeler',
              },
              crn: 'X000001',
              dateOfBirth: '1979-08-18',
            },
            contactId: 2500232995,
            name: {
              forename: 'Brian',
              surname: 'Smith',
            },
            relationship: 'Father',
            relationshipType: 'Emergency Contact',
            address: {
              buildingNumber: '36',
              streetName: 'Fifth Street',
              district: 'South City Centre',
              town: 'London',
              county: 'South London',
              postcode: 'W10 4DN',
              lastUpdated: '2023-03-14',
            },
          },
          {
            personSummary: {
              name: {
                forename: 'Eula',
                surname: 'Schmeler',
              },
              crn: 'X000001',
              dateOfBirth: '1979-08-18',
            },
            contactId: 2500232996,
            name: {
              forename: 'Nick',
              surname: 'Riviera',
            },
            relationship: 'GP',
            relationshipType: 'GP',
            address: {
              buildingName: 'The practice',
              buildingNumber: '38',
              streetName: 'East Street',
              district: 'East City Centre',
              town: 'Bristol',
              county: 'East London',
              postcode: 'E5 7BS',
              lastUpdated: '2023-03-14',
            },
          },
          {
            personSummary: {
              name: {
                forename: 'Eula',
                surname: 'Schmeler',
              },
              crn: 'X000001',
              dateOfBirth: '1979-08-18',
            },
            contactId: 2500244492,
            name: {
              forename: 'Ms',
              surname: 'Schmeler',
            },
            relationship: 'Mother',
            relationshipType: 'Emergency Contact',
          },
        ],
        mainAddress: {
          buildingNumber: '32',
          streetName: 'SCOTLAND STREET',
          town: 'Sheffield',
          county: 'South Yorkshire',
          postcode: 'S3 7BS',
          from: '2023-03-14',
          verified: true,
          lastUpdated: '2023-03-20',
          type: 'Householder (Owner - freehold or leasehold)',
          status: 'Main',
          addressNotes: [],
          lastUpdatedBy: {
            forename: 'NDelius03',
            surname: 'NDelius03',
          },
        },
        otherAddressCount: 1,
        previousAddressCount: 1,
        preferredGender: 'Female',
        dateOfBirth: '1979-08-18',
        dateOfDeath: '2025-10-21',
        preferredLanguage: 'Urdu',
        religionOrBelief: 'Scientology',
        sexualOrientation: 'Heterosexual',
        genderIdentity: 'Non-Binary',
        previousSurname: 'Jones',
        aliases: [
          {
            forename: 'John',
            surname: 'Smith',
          },
          {
            forename: 'Jonny',
            surname: 'Smith',
          },
        ],
        telephoneNumber: '0123456999',
        mobileNumber: '071838893',
        email: 'address1@gmail.com',
        circumstances: {
          circumstances: [
            {
              subType: 'Allergies',
              type: 'Code not found in Migration',
            },
            {
              subType: 'Is a Primary Carer',
              type: 'Transferred to Crown Court',
            },
            {
              subType: 'Maternity',
              type: 'Training',
            },
            {
              subType: 'Language/Communication Concerns',
              type: 'Adjourned - Other Report',
            },
            {
              subType: 'Married / Civil partnership',
              type: 'Relationship',
            },
            {
              subType: 'Volunteering',
              type: 'Employment',
            },
            {
              subType: 'Has Dependents',
              type: 'Dependents',
            },
            {
              subType: 'Full Time Employed',
              type: 'Employment',
            },
          ],
          lastUpdated: '2023-04-06',
        },
        disabilities: {
          disabilities: [
            'Hearing Disabilities',
            'Learning Disability',
            'Mental Health related disabilities',
            'Mobility related Disabilities',
          ],
          lastUpdated: '2023-04-06',
        },
        provisions: {
          provisions: ['Handrails', 'Behavioural responses/Body language'],
          lastUpdated: '2023-05-12',
        },
        sex: 'Female',
        documents: [
          {
            id: '83fdbf8a-a2f2-43b4-93ef-67e71c04fc58',
            name: 'Eula-Schmeler-X000001-UPW.pdf',
            lastUpdated: '2023-04-06T11:06:25.672587+01:00',
          },
          {
            id: 'c2650260-9568-476e-a293-0b168027a5f1',
            name: 'Eula-Schmeler-X000001-UPW.pdf',
            lastUpdated: '2023-04-06T11:09:45.860739+01:00',
          },
          {
            id: 'b82e444b-c77c-4d44-bf99-4ce4dc426ff4',
            name: 'Eula-Schmeler-X000001-UPW.pdf',
            lastUpdated: '2023-04-06T11:21:17.06356+01:00',
          },
        ],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubPersonalDetailsWelshPostcode = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPattern: '/mas/personal-details/X000001',
    },
    response: {
      status: 200,
      jsonBody: {
        crn: 'X000001',
        pnc: '1954/0018147W',
        noms: 'G9566GQ',
        name: {
          forename: 'Caroline',
          surname: 'Wolff',
        },
        contacts: [
          {
            personSummary: {
              name: {
                forename: 'Eula',
                surname: 'Schmeler',
              },
              crn: 'X000001',
              dateOfBirth: '1979-08-18',
            },
            contactId: 2500233993,
            name: {
              forename: 'Steve',
              surname: 'Wilson',
            },
            relationship: 'GP (secondary)',
            relationshipType: 'GP',
            address: {
              buildingName: 'The Building',
              buildingNumber: '77',
              streetName: 'Some Street',
              district: 'Some City Centre',
              town: 'London',
              county: 'Essex',
              postcode: 'NW10 1EP',
              lastUpdated: '2023-03-14',
            },
          },
          {
            personSummary: {
              name: {
                forename: 'Eula',
                surname: 'Schmeler',
              },
              crn: 'X000001',
              dateOfBirth: '1979-08-18',
            },
            contactId: 2500232995,
            name: {
              forename: 'Brian',
              surname: 'Smith',
            },
            relationship: 'Father',
            relationshipType: 'Emergency Contact',
            address: {
              buildingNumber: '36',
              streetName: 'Fifth Street',
              district: 'South City Centre',
              town: 'London',
              county: 'South London',
              postcode: 'W10 4DN',
              lastUpdated: '2023-03-14',
            },
          },
          {
            personSummary: {
              name: {
                forename: 'Eula',
                surname: 'Schmeler',
              },
              crn: 'X000001',
              dateOfBirth: '1979-08-18',
            },
            contactId: 2500232996,
            name: {
              forename: 'Nick',
              surname: 'Riviera',
            },
            relationship: 'GP',
            relationshipType: 'GP',
            address: {
              buildingName: 'The practice',
              buildingNumber: '38',
              streetName: 'East Street',
              district: 'East City Centre',
              town: 'Bristol',
              county: 'East London',
              postcode: 'E5 7BS',
              lastUpdated: '2023-03-14',
            },
          },
          {
            personSummary: {
              name: {
                forename: 'Eula',
                surname: 'Schmeler',
              },
              crn: 'X000001',
              dateOfBirth: '1979-08-18',
            },
            contactId: 2500244492,
            name: {
              forename: 'Ms',
              surname: 'Schmeler',
            },
            relationship: 'Mother',
            relationshipType: 'Emergency Contact',
          },
        ],
        addressTypes: [
          {
            code: 'BASS',
            description: 'BASS accommodation 13 weeks or more',
          },
          {
            code: 'HL',
            description: 'Homeless - Shelter/Emergency Hostel/Campsite',
          },
          {
            code: 'HO',
            description: 'Householder (Owner - freehold or leasehold)',
          },
        ],
        staffContacts: [
          {
            name: 'Arhsimna Xolfo',
            email: 'arhsimna.xolfo@moj.gov.uk',
            telephoneNumber: '07321165373',
            provider: 'London',
            probationDeliveryUnit: 'All London',
            team: 'Unallocated Team (N07)',
            allocatedDate: '2025-04-22',
            lastUpdated: '2024-04-30',
            responsibleOfficer: true,
            prisonOffenderManager: false,
          },
          {
            name: 'Bruce Wayne',
            provider: 'Leicester',
            probationDeliveryUnit: 'Leicestershire All',
            team: 'OMU B',
            allocatedDate: '2025-01-12',
            lastUpdated: '2023-03-03',
            responsibleOfficer: false,
            prisonOffenderManager: true,
          },
        ],
        mainAddress: {
          buildingNumber: '32',
          streetName: 'Dragon Road',
          town: 'Cardiff',
          county: 'Glamorgan',
          postcode: 'CF1 5PP',
          from: '2023-03-14',
          verified: true,
          lastUpdated: '2023-03-20',
          type: 'Householder (Owner - freehold or leasehold)',
          typeCode: 'HO',
          status: 'Main',
          addressNotes: [
            {
              id: 0,
              createdBy: 'Tom Brady',
              createdByDate: '2024-10-29',
              note: 'Main Address created automatically from the Create and Vary a licence system of\nAllow person(s) as designated by your supervising officer to install an electronic monitoring tag on you and access to install any associated equipment in your property, and for the purpose of ensuring that equipment is functioning correctly. You must not damage or tamper with these devices and ensure that the tag is charged, and report to your supervising officer and the EM provider immediately if the tag or the associated equipment are not working correctly. This will be for the purpose of monitoring your alcohol abstinence Main Address(s) unless otherwise authorised by your supervising officer. Main Address created automatically from the Create and Vary a licence system of\nAllow person(s) as designated by your supervising officer to install an electronic monitoring tag on you and access to install any associated equipment in your property, and for the purpose of ensuring that equipment is functioning correctly. You must not damage or tamper with these devices and ensure that the tag is charged, and report to your supervising officer and the EM provider immediately if the tag or the associated equipment are not working correctly. This will be for the purpose of monitoring your alcohol abstinence Main Address(s) unless otherwise authorised by your supervising officer.Main Address created automatically from the Create and Vary a licence system of\nAllow person(s) as desi',
              hasNoteBeenTruncated: true,
            },
            {
              id: 1,
              note: 'main address note 2',
              hasNoteBeenTruncated: false,
            },
            {
              id: 2,
              note: 'main address note 1',
              hasNoteBeenTruncated: true,
            },
          ],
          noFixedAddress: true,
          lastUpdatedBy: {
            forename: 'NDelius03',
            surname: 'NDelius03',
          },
        },
        otherAddressCount: 1,
        previousAddressCount: 1,
        preferredGender: 'Female',
        dateOfBirth: '1979-08-18',
        preferredLanguage: 'Urdu',
        religionOrBelief: 'Scientology',
        sexualOrientation: 'Heterosexual',
        genderIdentity: 'Non-Binary',
        previousSurname: 'Jones',
        aliases: [
          {
            forename: 'John',
            surname: 'Smith',
          },
          {
            forename: 'Jonny',
            surname: 'Smith',
          },
        ],
        telephoneNumber: '0123456999',
        mobileNumber: '07783889300',
        email: 'address1@gmail.com',
        circumstances: {
          circumstances: [
            {
              subType: 'Allergies',
              type: 'Code not found in Migration',
            },
            {
              subType: 'Is a Primary Carer',
              type: 'Transferred to Crown Court',
            },
            {
              subType: 'Maternity',
              type: 'Training',
            },
            {
              subType: 'Language/Communication Concerns',
              type: 'Adjourned - Other Report',
            },
          ],
          lastUpdated: '2023-04-06',
        },
        disabilities: {
          disabilities: [
            'Hearing Disabilities',
            'Learning Disability',
            'Mental Health related disabilities',
            'Mobility related Disabilities',
          ],
          lastUpdated: '2023-04-06',
        },
        provisions: {
          provisions: ['Handrails', 'Behavioural responses/Body language'],
          lastUpdated: '2023-05-12',
        },
        sex: 'Female',
        documents: [
          {
            id: '83fdbf8a-a2f2-43b4-93ef-67e71c04fc58',
            name: 'Eula-Schmeler-X000001-UPW.pdf',
            lastUpdated: '2023-04-06T11:06:25.672587+01:00',
          },
          {
            id: 'c2650260-9568-476e-a293-0b168027a5f1',
            name: 'Eula-Schmeler-X000001-UPW.pdf',
            lastUpdated: '2023-04-06T11:09:45.860739+01:00',
          },
          {
            id: 'b82e444b-c77c-4d44-bf99-4ce4dc426ff4',
            name: 'Eula-Schmeler-X000001-UPW.pdf',
            lastUpdated: '2023-04-06T11:21:17.06356+01:00',
          },
        ],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

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

const stubUpdatePersonalContact500Response = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: '/mas/personal-details/X000001/contact',
      method: 'POST',
    },
    response: {
      status: 500,
      jsonBody: { message: '500 Error message' },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

const stubUpdatePersonalContact404Response = (): SuperAgentRequest =>
  superagent.post('http://localhost:9091/__admin/mappings').send({
    request: {
      urlPathPattern: '/mas/personal-details/X000001/contact',
      method: 'POST',
    },
    response: {
      status: 404,
      jsonBody: { message: '404 Error message' },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })

export default {
  stubPersonalDetailsNoMobileNumber,
  stubPersonalDetailsNoTelephoneNumbers,
  stubPersonalDetailsDateOfDeath,
  stubPersonalDetailsDateOfDeathManage,
  stubPersonalDetailsWelshPostcode,
  stubNoCircumstanceNotes,
  stubNullCircumstanceNote,
  stubUpdatePersonalContact500Response,
  stubUpdatePersonalContact404Response,
}
