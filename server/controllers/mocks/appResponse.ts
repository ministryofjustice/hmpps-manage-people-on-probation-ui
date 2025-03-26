import { AppResponse } from '../../@types'

export const mockAppResponse = (locals?: Record<string, any>) =>
  ({
    locals: {
      user: {
        username: 'user-1',
      },
      ...locals,
    },
    redirect: jest.fn().mockReturnThis(),
    render: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  }) as unknown as AppResponse
