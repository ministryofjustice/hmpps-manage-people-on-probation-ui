export const initSharedConfig = jest.fn()

export const logger: Record<'info' | 'error' | 'warn' | 'debug', jest.Mock> = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}

export const AgentConfig = jest.fn()
