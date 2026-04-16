import { EsupervisionQuestionTemplatesResponse } from '../../data/model/esupervision'

export const esupervisionAdditionalQuestions: EsupervisionQuestionTemplatesResponse = {
  templates: [
    {
      id: 1,
      template: 'How has {{thing}} been going recently?',
      example: 'unpaid work, college course, work, apprenticeship, university course, sentence plan, training',
      responseFormat: 'TEXT',
      responseSpec: {
        hint: 'Hint for the question about the {{thing}}',
        placeholders: ['thing'],
      },
      policy$hmpps_esupervision_api: 'CUSTOMISABLE',
    },
    {
      id: 2,
      template: 'How have things been feeling {{thing}} recently? ',
      example:
        'home, work, relationships with family, appointments with other bodies, physical or mental health, recovery journey',
      responseFormat: 'TEXT',
      responseSpec: {
        hint: 'Hint for the question about the {{thing}}',
        placeholders: ['thing'],
      },
      policy$hmpps_esupervision_api: 'CUSTOMISABLE',
    },
    {
      id: 3,
      template: 'How is {{thing}}? ',
      example:
        'physical or mental health, recovery, family relationships, relationship with partner, being a new parent, starting a new course, work',
      responseFormat: 'TEXT',
      responseSpec: {
        hint: 'Hint for the question about the {{thing}}',
        placeholders: ['thing'],
      },
      policy$hmpps_esupervision_api: 'CUSTOMISABLE',
    },
    {
      id: 4,
      template: 'How was {{thing}}? ',
      example: 'job interview, doctors appointment, homelessness appointment, landlord visit, birthday',
      responseFormat: 'TEXT',
      responseSpec: {
        hint: 'Hint for the question about the {{thing}}',
        placeholders: ['thing'],
      },
      policy$hmpps_esupervision_api: 'CUSTOMISABLE',
    },
    {
      id: 5,
      template: 'How can we best support you with {{thing}}? ',
      example:
        'job interview, appointment, hospital visit, recovery journey, being a new parent, benefits assessment, financial situation, physical or mental health',
      responseFormat: 'TEXT',
      responseSpec: {
        hint: 'Hint for the question about the {{thing}}',
        placeholders: ['thing'],
      },
      policy$hmpps_esupervision_api: 'CUSTOMISABLE',
    },
    {
      id: 6,
      template: 'Have you been able to {{thing}}? ',
      example:
        'get an appointment, speak with the housing office, benefits office, home office, council, chase up your application, change jobs, collect medication, complete a form',
      responseFormat: 'TEXT',
      responseSpec: {
        hint: 'Hint for the question about the {{thing}}',
        placeholders: ['thing'],
      },
      policy$hmpps_esupervision_api: 'CUSTOMISABLE',
    },
    {
      id: 7,
      template: 'Have you heard back from {{thing}}? ',
      example: 'doctors, council, police, social services, benefits office',
      responseFormat: 'TEXT',
      responseSpec: {
        hint: 'Hint for the question about the {{thing}}',
        placeholders: ['thing'],
      },
      policy$hmpps_esupervision_api: 'CUSTOMISABLE',
    },
    {
      id: 8,
      template: 'Have you been to {{thing}} recently? ',
      example: 'a place, an appointment, a group, a service',
      responseFormat: 'TEXT',
      responseSpec: {
        hint: 'Hint for the question about the {{thing}}',
        placeholders: ['thing'],
      },
      policy$hmpps_esupervision_api: 'CUSTOMISABLE',
    },
    {
      id: 9,
      template: 'Have you had any recent contact with {{thing}}? ',
      example: 'police, doctors, social services, alcohol or drug recovery referrals, council, family members',
      responseFormat: 'TEXT',
      responseSpec: {
        hint: 'Hint for the question about the {{thing}}',
        placeholders: ['thing'],
      },
      policy$hmpps_esupervision_api: 'CUSTOMISABLE',
    },
    {
      id: 10,

      template: 'Have you changed {{thing}} recently? ',
      example: 'address, living situation, vehicle',
      responseFormat: 'TEXT',
      responseSpec: {
        hint: 'Hint for the question about the {{thing}}',
        placeholders: ['thing'],
      },
      policy$hmpps_esupervision_api: 'CUSTOMISABLE',
    },
    {
      id: 11,
      template: 'Has anything changed with {{thing}} recently?',
      example:
        'living situation, support network, caring responsibilities,  recovery journey, housing or employment, finances,  relationship, responsibilities at home',
      responseFormat: 'TEXT',
      responseSpec: {
        hint: 'Hint for the question about the {{thing}}',
        placeholders: ['thing'],
      },
      policy$hmpps_esupervision_api: 'CUSTOMISABLE',
    },
    {
      id: 12,
      template: 'Are you currently {{thing}}?',
      example:
        'homeless, looking for work, in a new relationship, in contact with a person or service, waiting for housing',
      responseFormat: 'TEXT',
      responseSpec: {
        hint: 'Hint for the question about the {{thing}}',
        placeholders: ['thing'],
      },
      policy$hmpps_esupervision_api: 'CUSTOMISABLE',
    },
    {
      id: 13,
      template: 'Are there any stresses around {{thing}} that we could help with?',
      example:
        'work, family, finances, alcohol or drug recovery, physical or mental health, housing, caring for a person, relationships or friendships, probation, sentence plan, training, university, accredited programme, unpaid work',
      responseFormat: 'TEXT',
      responseSpec: {
        hint: 'Hint for the question about the {{thing}}',
        placeholders: ['thing'],
      },
      policy$hmpps_esupervision_api: 'CUSTOMISABLE',
    },
    {
      id: 14,
      template: 'Is there anything that might help {{thing}}?',
      example:
        'you feel more supported, grounded, connected to the community, find work, manage your finances better, recovery from health issue, get back on track, with a process',
      responseFormat: 'TEXT',
      responseSpec: {
        hint: 'Hint for the question about the {{thing}}',
        placeholders: ['thing'],
      },
      policy$hmpps_esupervision_api: 'CUSTOMISABLE',
    },
    {
      id: 15,
      template: 'Do you {{thing}}? ',
      example:
        "know what's happening with a person, situation, referral, feel safe where you are right now, have an update about something",
      responseFormat: 'TEXT',
      responseSpec: {
        hint: 'Hint for the question about the {{thing}}',
        placeholders: ['thing'],
      },
      policy$hmpps_esupervision_api: 'CUSTOMISABLE',
    },
    {
      id: 16,
      template: 'Would you like some support with {{thing}}? ',
      example:
        'filling in a form, recovery journey, alcohol or drug addiction, a challenging situation, home life, physical or mental health',
      responseFormat: 'TEXT',
      responseSpec: {
        hint: 'Hint for the question about the {{thing}}',
        placeholders: ['thing'],
      },
      policy$hmpps_esupervision_api: 'CUSTOMISABLE',
    },
    {
      id: 17,
      template: 'Would you find it helpful {{thing}}? ',
      example: 'to be referred to a service, to sit and fill in a form together, to speak with someone about something',
      responseFormat: 'TEXT',
      responseSpec: {
        hint: 'Hint for the question about the {{thing}}',
        placeholders: ['thing'],
      },
      policy$hmpps_esupervision_api: 'CUSTOMISABLE',
    },
    {
      id: 18,
      template: 'Were you able to {{thing}} since we last spoke?',
      example:
        'go to an appointment, fill in a form, speak with a service, complete a task, apply for a job or house, find a homeless shelter',
      responseFormat: 'TEXT',
      responseSpec: {
        hint: 'Hint for the question about the {{thing}}',
        placeholders: ['thing'],
      },
      policy$hmpps_esupervision_api: 'CUSTOMISABLE',
    },
    {
      id: 19,
      template: 'What have you been doing at {{thing}} recently?',
      example:
        'unpaid work, work, alcohol or drug recovery service, group session, accredited programme, home, your hobby or interest',
      responseFormat: 'TEXT',
      responseSpec: {
        hint: 'Hint for the question about the {{thing}}',
        placeholders: ['thing'],
      },
      policy$hmpps_esupervision_api: 'CUSTOMISABLE',
    },
    {
      id: 20,
      template: 'What can we do to help with {{thing}}? ',
      example:
        'an appointment, challenges in life, physical or mental health struggles, addiction, relationship breakdown, moving house, change of circumstances, being a new parent',
      responseFormat: 'TEXT',
      responseSpec: {
        hint: 'Hint for the question about the {{thing}}',
        placeholders: ['thing'],
      },
      policy$hmpps_esupervision_api: 'CUSTOMISABLE',
    },
  ],
}
