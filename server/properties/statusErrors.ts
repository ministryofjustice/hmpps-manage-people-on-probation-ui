export type StatusErrorCode = 404 | 500

type StatusErrorsType = {
  [key in StatusErrorCode]: { title: string; message: string }
}

export const statusErrors: StatusErrorsType = {
  404: {
    title: 'Page not found',
    message: `<p>Check you used the right web address. For example, if you copied and pasted it from an email or used a bookmark.</p>
        <p><a href="/">Go to the Manage people on probation homepage</a>.</p>`,
  },
  500: {
    title: 'Sorry, there is a problem with the service',
    message:
      '<p>Try again later.</p><p>Any information you entered has not been saved. When the service is available, you will need to start again.</p>',
  },
}
