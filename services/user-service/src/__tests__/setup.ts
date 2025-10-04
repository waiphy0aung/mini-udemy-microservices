import { PrismaClient } from '@prisma/client';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.LOG_LEVEL = 'error';

// Mock Prisma Client globally
jest.mock('@prisma/client', () => {
  const mockPrismaClient: any = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn()
    },
    userProfile: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn()
    },
    instructorProfile: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn()
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn()
    },
    passwordReset: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn()
    },
    $transaction: jest.fn((cb) => typeof cb === 'function' ? cb(mockPrismaClient) : Promise.resolve(cb)),
    $disconnect: jest.fn()
  };

  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
    Role: {
      STUDENT: 'STUDENT',
      INSTRUCTOR: 'INSTRUCTOR',
      ADMIN: 'ADMIN'
    }
  };
});

// Mock Redis
jest.mock('@shared', () => {
  const actual = jest.requireActual('@shared');
  return {
    ...actual,
    getRedis: jest.fn(() => ({
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      scanStream: jest.fn(),
      pipeline: jest.fn(() => ({
        del: jest.fn(),
        exec: jest.fn()
      })),
      ping: jest.fn(),
      on: jest.fn(),
      connect: jest.fn(),
      quit: jest.fn(),
      disconnect: jest.fn(),
      status: 'ready'
    })),
    connectRedis: jest.fn(),
    quitRedis: jest.fn()
  };
});

jest.setTimeout(10000);
