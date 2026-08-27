export type StatusErrorCode = 403 | 404 | 409 | 500

type StatusError = { title: string; message: string }
type StatusErrorsType = {
  [key in StatusErrorCode]: StatusError
}

export const statusErrors: StatusErrorsType = {
  403: {
    title: 'Forbidden',
    message: '<p>You do not have permission to access this page.</p>',
  },
  404: {
    title: 'Page not found',
    message: `<p>Check you used the right web address. For example, if you copied and pasted it from an email or used a bookmark.</p>
        <p><a href="/">Go to the Manage people on probation homepage</a>.</p>`,
  },
  500: {
    title: 'Sorry, there is a problem with the service',
    message:
      '<p>Try again later.</p><p>Any information you entered has not been saved. When the service is available, you will need to start again.</p><p><strong>There is an ongoing issue with search on this service. This affects searching for a case and the contact list. Use the NDelius search and contact list for now.</strong></p>',
  },
  409: {
    title: 'You’ve already arranged this appointment',
    message: `<p><a href="/" data-qa="homepageLink">Go to the Manage people on probation homepage</a> to see your upcoming appointments.</p>`,
  },
}
