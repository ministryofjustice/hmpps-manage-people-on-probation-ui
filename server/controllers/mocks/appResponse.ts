import { AppResponse } from '../../models/Locals'

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
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    removeHeader: jest.fn().mockReturnThis(),
    type: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    destroy: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    once: jest.fn().mockReturnThis(),
    emit: jest.fn().mockReturnThis(),
  }) as unknown as AppResponse
