export const mockSharedLib = () => ({
  __esModule: true,
  initSharedConfig: jest.fn(),
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
  AgentConfig: jest.fn(),
})
