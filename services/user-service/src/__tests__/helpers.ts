import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Role } from '@prisma/client';

// User fixtures
export const createUserFixture = (overrides = {}) => ({
  id: 1,
  email: 'test@example.com',
  password: '$2a$12$hash', // Pre-hashed password
  role: Role.STUDENT,
  isActive: true,
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createUserWithProfileFixture = (overrides = {}) => ({
  ...createUserFixture(overrides),
  profile: {
    id: 1,
    userId: 1,
    firstName: 'Test',
    lastName: 'User',
    avatar: null,
    bio: null,
    dateOfBirth: null,
    phone: null,
    country: null,
    timezone: null,
    language: 'en',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  instructorProfile: null
});

export const createInstructorWithProfileFixture = (overrides = {}) => ({
  ...createUserFixture({ role: Role.INSTRUCTOR, ...overrides }),
  profile: {
    id: 2,
    userId: 2,
    firstName: 'Instructor',
    lastName: 'User',
    avatar: null,
    bio: null,
    dateOfBirth: null,
    phone: null,
    country: null,
    timezone: null,
    language: 'en',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  instructorProfile: {
    id: 1,
    userId: 2,
    isApproved: true,
    expertise: ['JavaScript', 'Node.js'],
    experience: '5 years',
    education: null,
    website: null,
    linkedIn: null,
    youtube: null,
    rating: null,
    studentCount: 0,
    courseCount: 0,
    totalEarnings: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
});

// Password helpers
export const hashPassword = async (password: string) => bcrypt.hash(password, 12);

export const comparePassword = async (password: string, hash: string) => 
  bcrypt.compare(password, hash);

// Token helpers
export const generateResetToken = () => crypto.randomBytes(32).toString('hex');

export const hashResetToken = (token: string) => 
  crypto.createHash('sha256').update(token).digest('hex');

// Mock Prisma helpers
export const getMockPrisma = () => {
  const { PrismaClient } = require('@prisma/client');
  return new PrismaClient();
};

// Response helpers
export const expectSuccessResponse = (response: any) => {
  expect(response.body).toHaveProperty('status', 'success');
  expect(response.body).toHaveProperty('code');
  expect(response.body).toHaveProperty('message');
  expect(response.body).toHaveProperty('data');
};

export const expectErrorResponse = (response: any, code: number) => {
  expect(response.status).toBe(code);
  expect(response.body).toHaveProperty('status', 'error');
  expect(response.body).toHaveProperty('code', code);
  expect(response.body).toHaveProperty('message');
};

// Clean user for comparison (remove password)
export const safeUser = (user: any) => {
  const { password, ...safe } = user;
  return safe;
};
