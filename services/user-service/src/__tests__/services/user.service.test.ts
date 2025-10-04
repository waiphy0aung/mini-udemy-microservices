import { Role } from '@prisma/client';
import * as userService from '../../services/user.services';
import {
  createUserWithProfileFixture,
  createInstructorWithProfileFixture,
  getMockPrisma,
  hashPassword
} from '../helpers';

const prisma = getMockPrisma();

// Mock the prisma module
jest.mock('@prisma/client', () => {
  const mockPrismaClient: any = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn()
    },
    userProfile: {
      upsert: jest.fn()
    },
    instructorProfile: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn()
    },
    passwordReset: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn()
    },
    $transaction: jest.fn((cb) => typeof cb === 'function' ? cb(mockPrismaClient) : Promise.resolve(cb))
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

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new student user', async () => {
      const payload = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: Role.STUDENT
      };

      const mockUser = createUserWithProfileFixture({
        email: payload.email.toLowerCase().trim()
      });

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await userService.createUser(payload);

      expect(result.email).toBe(payload.email.toLowerCase().trim());
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: payload.email.toLowerCase().trim() }
      });
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should create an instructor user with profile', async () => {
      const payload = {
        email: 'instructor@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Teacher',
        role: Role.INSTRUCTOR
      };

      const mockInstructor = createInstructorWithProfileFixture({
        email: payload.email.toLowerCase().trim()
      });

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockInstructor);

      const result = await userService.createUser(payload);

      expect(result.role).toBe(Role.INSTRUCTOR);
      expect(result.instructorProfile).toBeDefined();
    });

    it('should throw error for duplicate email', async () => {
      const existingUser = createUserWithProfileFixture();
      prisma.user.findUnique.mockResolvedValue(existingUser);

      await expect(
        userService.createUser({
          email: existingUser.email,
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        })
      ).rejects.toThrow('already exists');
    });

    it('should normalize email (lowercase and trim)', async () => {
      const payload = {
        email: '  TEST@EXAMPLE.COM  ',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(
        createUserWithProfileFixture({ email: 'test@example.com' })
      );

      await userService.createUser(payload);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });
    });
  });

  describe('getUserById', () => {
    it('should return user with relations', async () => {
      const mockUser = createUserWithProfileFixture({ id: 1 });
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.getUserById(1);

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1, isActive: true },
        include: {
          profile: true,
          instructorProfile: true
        }
      });
    });

    it('should return null for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.getUserById(999);

      expect(result).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('should return user by email', async () => {
      const mockUser = createUserWithProfileFixture();
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.getUserByEmail(mockUser.email);

      expect(result).toEqual(mockUser);
    });

    it('should normalize email when searching', async () => {
      const mockUser = createUserWithProfileFixture({ email: 'test@example.com' });
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await userService.getUserByEmail('  TEST@EXAMPLE.COM  ');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com', isActive: true },
        include: {
          profile: true,
          instructorProfile: true
        }
      });
    });
  });

  describe('getAllUsers', () => {
    it('should return paginated users', async () => {
      const mockUsers = [
        createUserWithProfileFixture({ id: 1 }),
        createUserWithProfileFixture({ id: 2, email: 'user2@example.com' })
      ];

      prisma.user.findMany.mockResolvedValue(mockUsers);
      prisma.user.count.mockResolvedValue(2);

      const result = await userService.getAllUsers({ page: 1, limit: 10 });

      expect(result.users).toEqual(mockUsers);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        pages: 1
      });
    });

    it('should filter by role', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await userService.getAllUsers({ role: 'INSTRUCTOR' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ role: 'INSTRUCTOR' })
        })
      );
    });

    it('should support search', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await userService.getAllUsers({ search: 'john' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { email: expect.anything() },
              { profile: expect.anything() }
            ])
          })
        })
      );
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile', async () => {
      const mockUser = createUserWithProfileFixture({ id: 1 });
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        bio: 'New bio'
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.userProfile.upsert.mockResolvedValue({
        ...mockUser.profile,
        ...updateData
      });

      const result = await userService.updateUserProfile(1, updateData);

      expect(result.firstName).toBe('Updated');
      expect(result.lastName).toBe('Name');
      expect(result.bio).toBe('New bio');
    });

    it('should throw error if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        userService.updateUserProfile(999, { firstName: 'Test' })
      ).rejects.toThrow('not found');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const hashedPassword = await hashPassword('currentpassword');
      const mockUser = createUserWithProfileFixture({
        id: 1,
        password: hashedPassword
      });

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);

      await userService.changePassword(1, {
        currentPassword: 'currentpassword',
        newPassword: 'newpassword123'
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          password: expect.any(String)
        })
      });
    });

    it('should throw error for incorrect current password', async () => {
      const mockUser = createUserWithProfileFixture({ id: 1 });
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        userService.changePassword(1, {
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        })
      ).rejects.toThrow('incorrect');
    });
  });

  describe('Password Reset', () => {
    it('should create password reset token', async () => {
      const mockUser = createUserWithProfileFixture();
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.passwordReset.deleteMany.mockResolvedValue({ count: 0 });
      prisma.passwordReset.create.mockResolvedValue({
        id: 1,
        userId: mockUser.id,
        token: 'hashed-token',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        used: false,
        createdAt: new Date()
      });

      const token = await userService.createPasswordRefreshToken(mockUser.email);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(prisma.passwordReset.create).toHaveBeenCalled();
    });

    it('should reset password with valid token', async () => {
      const mockUser = createUserWithProfileFixture();
      const resetRecord = {
        id: 1,
        userId: mockUser.id,
        token: 'hashed-token',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        used: false,
        createdAt: new Date(),
        user: mockUser
      };

      prisma.passwordReset.findUnique.mockResolvedValue(resetRecord);
      prisma.$transaction.mockImplementation(async (operations: any) => {
        return await Promise.all(operations);
      });

      await userService.resetPassword('valid-token', 'newpassword123');

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should reject expired reset token', async () => {
      const expiredRecord = {
        id: 1,
        userId: 1,
        token: 'hashed-token',
        expiresAt: new Date(Date.now() - 1000),
        used: false,
        createdAt: new Date(),
        user: createUserWithProfileFixture()
      };

      prisma.passwordReset.findUnique.mockResolvedValue(expiredRecord);

      await expect(
        userService.resetPassword('expired-token', 'newpassword123')
      ).rejects.toThrow('expired');
    });

    it('should reject used reset token', async () => {
      const usedRecord = {
        id: 1,
        userId: 1,
        token: 'hashed-token',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        used: true,
        createdAt: new Date(),
        user: createUserWithProfileFixture()
      };

      prisma.passwordReset.findUnique.mockResolvedValue(usedRecord);

      await expect(
        userService.resetPassword('used-token', 'newpassword123')
      ).rejects.toThrow('Invalid or expired');
    });
  });

  describe('safeUser', () => {
    it('should remove password from user object', () => {
      const user = createUserWithProfileFixture();
      const safe = userService.safeUser(user);

      expect(safe).not.toHaveProperty('password');
      expect(safe).toHaveProperty('email');
      expect(safe).toHaveProperty('id');
    });
  });
});
