import { PrismaClient } from "@prisma/client";
import { DeepMockProxy, mockDeep, mockReset } from "jest-mock-extended";

export type MockPrismaClient = DeepMockProxy<PrismaClient>;

export const mockPrisma: MockPrismaClient = mockDeep<PrismaClient>();

beforeEach(() => {
  mockReset(mockPrisma);
});

jest.mock('../../db/client', () => ({
  __esModule: true,
  get default() {
    return mockPrisma;
  }
}));

jest.mock('@shared', () => {
  const actual = jest.requireActual('@shared');
  return {
    ...actual,
    getRedis: jest.fn(() => ({
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      scanStream: jest.fn(() => ({
        [Symbol.asyncIterator]: async function*() {
          yield [];
        }
      })),
      pipeline: jest.fn(() => ({
        del: jest.fn(),
        exec: jest.fn().mockResolvedValue([])
      })),
      ping: jest.fn().mockResolvedValue('PONG')
    })),
    connectRedis: jest.fn().mockResolvedValue(undefined),
    quitRedis: jest.fn().mockResolvedValue(undefined)
  }
})
