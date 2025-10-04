import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import { JwtPayload, UserRole } from '../types';

// Token generation helpers
export const generateToken = (payload: Partial<JwtPayload> = {}): string => {
  const defaultPayload: JwtPayload = {
    id: 1,
    email: 'test@example.com',
    role: UserRole.STUDENT,
    ...payload
  };
  const secret: Secret = process.env.JWT_SECRET as Secret; // or validate and throw if missing
  const signOpts: SignOptions = {
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  } as SignOptions;

  return jwt.sign(defaultPayload, secret, signOpts);
};

export const generateRefreshToken = (payload: Partial<JwtPayload> = {}): string => {
  const defaultPayload: JwtPayload = {
    id: 1,
    email: 'test@example.com',
    role: UserRole.STUDENT,
    ...payload
  };
  const secret: Secret = process.env.JWT_REFRESH_SECRET as Secret; // or validate and throw if missing
  const signOpts: SignOptions = {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '1h',
  } as SignOptions;

  return jwt.sign(defaultPayload, secret, signOpts);
};

export const generateExpiredToken = (payload: Partial<JwtPayload> = {}): string => {
  const defaultPayload: JwtPayload = {
    id: 1,
    email: 'test@example.com',
    role: UserRole.STUDENT,
    ...payload
  };

  return jwt.sign(defaultPayload, process.env.JWT_SECRET!, {
    expiresIn: '-1h' // Already expired
  });
};

// User fixtures
export const createUserFixture = (overrides = {}) => ({
  id: 1,
  email: 'test@example.com',
  role: UserRole.STUDENT,
  isActive: true,
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createStudentToken = (id = 1) =>
  generateToken({ id, email: `student${id}@example.com`, role: UserRole.STUDENT });

export const createInstructorToken = (id = 2) =>
  generateToken({ id, email: `instructor${id}@example.com`, role: UserRole.INSTRUCTOR });

export const createAdminToken = (id = 3) =>
  generateToken({ id, email: `admin${id}@example.com`, role: UserRole.ADMIN });

// Response assertion helpers
export const expectSuccessResponse = (response: any) => {
  expect(response.body).toHaveProperty('status', 'success');
  expect(response.body).toHaveProperty('code');
  expect(response.body).toHaveProperty('message');
  expect(response.body).toHaveProperty('data');
};

export const expectErrorResponse = (response: any, expectedCode: number) => {
  expect(response.status).toBe(expectedCode);
  expect(response.body).toHaveProperty('status', 'error');
  expect(response.body).toHaveProperty('code', expectedCode);
  expect(response.body).toHaveProperty('message');
};

// Delay helper for async operations
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Redis helpers
export const createMockRedis = () => {
  const store = new Map<string, string>();

  return {
    get: jest.fn((key: string) => Promise.resolve(store.get(key) || null)),
    set: jest.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve('OK');
    }),
    del: jest.fn((key: string) => {
      store.delete(key);
      return Promise.resolve(1);
    }),
    scanStream: jest.fn(),
    pipeline: jest.fn(() => ({
      del: jest.fn(),
      exec: jest.fn(() => Promise.resolve([]))
    })),
    ping: jest.fn(() => Promise.resolve('PONG')),
    on: jest.fn(),
    connect: jest.fn(() => Promise.resolve()),
    quit: jest.fn(() => Promise.resolve()),
    disconnect: jest.fn(),
    status: 'ready',
    clear: () => store.clear()
  };
};
