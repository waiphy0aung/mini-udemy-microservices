import request from 'supertest';
import app from '../app';
import { Role } from '@prisma/client';
import {
  createUserWithProfileFixture,
  getMockPrisma,
  hashPassword,
  expectSuccessResponse,
  expectErrorResponse
} from './helpers';

const prisma = getMockPrisma();

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // describe('POST /auth/register', () => {
  //   const validPayload = {
  //     email: 'newuser@example.com',
  //     password: 'password123',
  //     firstName: 'John',
  //     lastName: 'Doe',
  //     role: 'STUDENT'
  //   };
  //
  //   it('should register a new student successfully', async () => {
  //     const mockUser = createUserWithProfileFixture({
  //       email: validPayload.email,
  //       role: Role.STUDENT
  //     });
  //
  //     prisma.user.findUnique.mockResolvedValue(null);
  //     prisma.user.create.mockResolvedValue(mockUser);
  //     prisma.refreshToken.create.mockResolvedValue({
  //       id: 1,
  //       userId: mockUser.id,
  //       token: 'hashed-token',
  //       expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  //       createdAt: new Date()
  //     });
  //
  //     const response = await request(app)
  //       .post('/auth/register')
  //       .send(validPayload);
  //
  //     expect(response.status).toBe(201);
  //     expectSuccessResponse(response);
  //     expect(response.body.data.user).toBeDefined();
  //     expect(response.body.data.user.email).toBe(validPayload.email);
  //     expect(response.body.data.user.password).toBeUndefined();
  //     expect(response.body.data.token).toBeDefined();
  //     expect(response.headers['set-cookie']).toBeDefined();
  //
  //     expect(prisma.user.findUnique).toHaveBeenCalledWith({
  //       where: { email: validPayload.email.toLowerCase() }
  //     });
  //     expect(prisma.user.create).toHaveBeenCalled();
  //     expect(prisma.refreshToken.create).toHaveBeenCalled();
  //   });
  //
  //   it('should register a new instructor successfully', async () => {
  //     const instructorPayload = { ...validPayload, role: 'INSTRUCTOR' };
  //     const mockUser = createUserWithProfileFixture({
  //       email: instructorPayload.email,
  //       role: Role.INSTRUCTOR
  //     });
  //
  //     prisma.user.findUnique.mockResolvedValue(null);
  //     prisma.user.create.mockResolvedValue(mockUser);
  //     prisma.refreshToken.create.mockResolvedValue({
  //       id: 1,
  //       userId: mockUser.id,
  //       token: 'hashed-token',
  //       expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  //       createdAt: new Date()
  //     });
  //
  //     const response = await request(app)
  //       .post('/auth/register')
  //       .send(instructorPayload);
  //
  //     expect(response.status).toBe(201);
  //     expectSuccessResponse(response);
  //     expect(response.body.data.user.role).toBe(Role.INSTRUCTOR);
  //   });
  //
  //   it('should reject duplicate email', async () => {
  //     const existingUser = createUserWithProfileFixture();
  //     prisma.user.findUnique.mockResolvedValue(existingUser);
  //
  //     const response = await request(app)
  //       .post('/auth/register')
  //       .send(validPayload);
  //
  //     expectErrorResponse(response, 400);
  //     expect(response.body.message).toContain('already exists');
  //   });
  //
  //   it('should validate required fields', async () => {
  //     const response = await request(app)
  //       .post('/auth/register')
  //       .send({ email: 'test@example.com' });
  //
  //     expectErrorResponse(response, 400);
  //     expect(response.body.message).toBeDefined();
  //   });
  //
  //   it('should validate email format', async () => {
  //     const response = await request(app)
  //       .post('/auth/register')
  //       .send({ ...validPayload, email: 'invalid-email' });
  //
  //     expectErrorResponse(response, 400);
  //     expect(response.body.message).toContain('email');
  //   });
  //
  //   it('should validate password length', async () => {
  //     const response = await request(app)
  //       .post('/auth/register')
  //       .send({ ...validPayload, password: '123' });
  //
  //     expectErrorResponse(response, 400);
  //     expect(response.body.message).toContain('password');
  //   });
  //
  //   it('should normalize email to lowercase', async () => {
  //     const upperCasePayload = { ...validPayload, email: 'TEST@EXAMPLE.COM' };
  //     const mockUser = createUserWithProfileFixture({
  //       email: 'test@example.com',
  //       role: Role.STUDENT
  //     });
  //
  //     prisma.user.findUnique.mockResolvedValue(null);
  //     prisma.user.create.mockResolvedValue(mockUser);
  //     prisma.refreshToken.create.mockResolvedValue({
  //       id: 1,
  //       userId: mockUser.id,
  //       token: 'hashed-token',
  //       expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  //       createdAt: new Date()
  //     });
  //
  //     const response = await request(app)
  //       .post('/auth/register')
  //       .send(upperCasePayload);
  //
  //     expect(response.status).toBe(201);
  //     expect(prisma.user.findUnique).toHaveBeenCalledWith({
  //       where: { email: 'test@example.com' }
  //     });
  //   });
  //
  //   it('should trim whitespace from email', async () => {
  //     const spacedPayload = { ...validPayload, email: '  test@example.com  ' };
  //     const mockUser = createUserWithProfileFixture({
  //       email: 'test@example.com',
  //       role: Role.STUDENT
  //     });
  //
  //     prisma.user.findUnique.mockResolvedValue(null);
  //     prisma.user.create.mockResolvedValue(mockUser);
  //     prisma.refreshToken.create.mockResolvedValue({
  //       id: 1,
  //       userId: mockUser.id,
  //       token: 'hashed-token',
  //       expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  //       createdAt: new Date()
  //     });
  //
  //     const response = await request(app)
  //       .post('/auth/register')
  //       .send(spacedPayload);
  //
  //     expect(response.status).toBe(201);
  //   });
  //
  //   it('should reject invalid role', async () => {
  //     const response = await request(app)
  //       .post('/auth/register')
  //       .send({ ...validPayload, role: 'INVALID_ROLE' });
  //
  //     expectErrorResponse(response, 400);
  //   });
  // });

  describe('POST /auth/login', () => {
    const loginPayload = {
      email: 'test@example.com',
      password: 'password123'
    };

    it('should login successfully with valid credentials', async () => {
      const hashedPassword = await hashPassword(loginPayload.password);
      const mockUser = createUserWithProfileFixture({
        email: loginPayload.email,
        password: hashedPassword
      });

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });
      prisma.refreshToken.create.mockResolvedValue({
        id: 1,
        userId: mockUser.id,
        token: 'hashed-token',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date()
      });

      const response = await request(app)
        .post('/auth/login')
        .send(loginPayload);

      expect(response.status).toBe(200);
      expectSuccessResponse(response);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.token).toBeDefined();
      expect(response.headers['set-cookie']).toBeDefined();

      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: loginPayload.email.toLowerCase() }
        })
      );
    });

    it('should reject invalid email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/login')
        .send(loginPayload);

      expectErrorResponse(response, 401);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should reject invalid password', async () => {
      const hashedPassword = await hashPassword('different-password');
      const mockUser = createUserWithProfileFixture({
        password: hashedPassword
      });

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/login')
        .send(loginPayload);

      expectErrorResponse(response, 401);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should reject inactive user', async () => {
      const hashedPassword = await hashPassword(loginPayload.password);
      const mockUser = createUserWithProfileFixture({
        password: hashedPassword,
        isActive: false
      });

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/login')
        .send(loginPayload);

      expectErrorResponse(response, 401);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com' });

      expectErrorResponse(response, 400);
    });

    it('should normalize email on login', async () => {
      const hashedPassword = await hashPassword(loginPayload.password);
      const mockUser = createUserWithProfileFixture({
        email: 'test@example.com',
        password: hashedPassword
      });

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });
      prisma.refreshToken.create.mockResolvedValue({
        id: 1,
        userId: mockUser.id,
        token: 'hashed-token',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date()
      });

      const response = await request(app)
        .post('/auth/login')
        .send({ ...loginPayload, email: 'TEST@EXAMPLE.COM' });

      expect(response.status).toBe(200);
      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: 'test@example.com' }
        })
      );
    });

    it('should delete old refresh tokens on login', async () => {
      const hashedPassword = await hashPassword(loginPayload.password);
      const mockUser = createUserWithProfileFixture({
        password: hashedPassword
      });

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 2 });
      prisma.refreshToken.create.mockResolvedValue({
        id: 1,
        userId: mockUser.id,
        token: 'hashed-token',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date()
      });

      const response = await request(app)
        .post('/auth/login')
        .send(loginPayload);

      expect(response.status).toBe(200);
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id }
      });
    });
  });
  //
  // describe('POST /auth/logout', () => {
  //   it('should logout successfully with refresh token', async () => {
  //     const mockUser = createUserWithProfileFixture();
  //     prisma.refreshToken.delete.mockResolvedValue({
  //       id: 1,
  //       userId: mockUser.id,
  //       token: 'hashed-token',
  //       expiresAt: new Date(),
  //       createdAt: new Date()
  //     });
  //
  //     const response = await request(app)
  //       .post('/auth/logout')
  //       .set('Cookie', ['token=valid-token', 'refreshToken=valid-refresh']);
  //
  //     expect(response.status).toBe(200);
  //     expectSuccessResponse(response);
  //     expect(response.body.data).toBeNull();
  //
  //     // Check cookies are cleared
  //     const cookie = response.headers['set-cookie'];
  //     if (cookie) {
  //       const isValidCookie = cookie.includes('token=') && cookie.includes('Max-Age=0')
  //       expect(isValidCookie).toBe(true);
  //     }
  //   });
  //
  //   it('should handle logout without refresh token', async () => {
  //     const response = await request(app)
  //       .post('/auth/logout');
  //
  //     expect(response.status).toBe(200);
  //     expectSuccessResponse(response);
  //   });
  //
  //   it('should handle invalid refresh token on logout', async () => {
  //     prisma.refreshToken.delete.mockRejectedValue(new Error('Token not found'));
  //
  //     const response = await request(app)
  //       .post('/auth/logout')
  //       .set('Cookie', ['refreshToken=invalid-token']);
  //
  //     // Should still return success even if token deletion fails
  //     expect(response.status).toBe(200);
  //   });
  // });
  //
  // describe('POST /auth/refresh', () => {
  //   it('should refresh token successfully', async () => {
  //     const mockUser = createUserWithProfileFixture();
  //     const mockRefreshRecord = {
  //       id: 1,
  //       userId: mockUser.id,
  //       token: 'hashed-token',
  //       expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  //       createdAt: new Date()
  //     };
  //
  //     prisma.refreshToken.findUnique.mockResolvedValue(mockRefreshRecord);
  //     prisma.user.findUnique.mockResolvedValue(mockUser);
  //     prisma.refreshToken.delete.mockResolvedValue(mockRefreshRecord);
  //     prisma.refreshToken.create.mockResolvedValue(mockRefreshRecord);
  //
  //     const response = await request(app)
  //       .post('/auth/refresh')
  //       .send({ refreshToken: 'valid-refresh-token' });
  //
  //     expect(response.status).toBe(200);
  //     expectSuccessResponse(response);
  //     expect(response.body.data.token).toBeDefined();
  //     expect(response.body.data.refreshToken).toBeDefined();
  //
  //     expect(prisma.refreshToken.delete).toHaveBeenCalled();
  //     expect(prisma.refreshToken.create).toHaveBeenCalled();
  //   });
  //
  //   it('should reject missing refresh token', async () => {
  //     const response = await request(app)
  //       .post('/auth/refresh')
  //       .send({});
  //
  //     expectErrorResponse(response, 401);
  //     expect(response.body.message).toContain('token');
  //   });
  //
  //   it('should reject invalid refresh token', async () => {
  //     prisma.refreshToken.findUnique.mockResolvedValue(null);
  //
  //     const response = await request(app)
  //       .post('/auth/refresh')
  //       .send({ refreshToken: 'invalid-token' });
  //
  //     expectErrorResponse(response, 401);
  //   });
  //
  //   it('should reject expired refresh token', async () => {
  //     const expiredRefreshRecord = {
  //       id: 1,
  //       userId: 1,
  //       token: 'hashed-token',
  //       expiresAt: new Date(Date.now() - 1000), // Expired
  //       createdAt: new Date()
  //     };
  //
  //     prisma.refreshToken.findUnique.mockResolvedValue(expiredRefreshRecord);
  //
  //     const response = await request(app)
  //       .post('/auth/refresh')
  //       .send({ refreshToken: 'expired-token' });
  //
  //     expectErrorResponse(response, 401);
  //     expect(response.body.message).toContain('expired');
  //   });
  //
  //   it('should handle user not found during refresh', async () => {
  //     const mockRefreshRecord = {
  //       id: 1,
  //       userId: 999,
  //       token: 'hashed-token',
  //       expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  //       createdAt: new Date()
  //     };
  //
  //     prisma.refreshToken.findUnique.mockResolvedValue(mockRefreshRecord);
  //     prisma.user.findUnique.mockResolvedValue(null);
  //
  //     const response = await request(app)
  //       .post('/auth/refresh')
  //       .send({ refreshToken: 'valid-token' });
  //
  //     expectErrorResponse(response, 401);
  //   });
  // });
  //
  // describe('POST /auth/forgot-password', () => {
  //   it('should handle forgot password request', async () => {
  //     const mockUser = createUserWithProfileFixture();
  //
  //     prisma.user.findUnique.mockResolvedValue(mockUser);
  //     prisma.passwordReset.deleteMany.mockResolvedValue({ count: 0 });
  //     prisma.passwordReset.create.mockResolvedValue({
  //       id: 1,
  //       userId: mockUser.id,
  //       token: 'hashed-reset-token',
  //       expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  //       used: false,
  //       createdAt: new Date()
  //     });
  //
  //     const response = await request(app)
  //       .post('/auth/forgot-password')
  //       .send({ email: mockUser.email });
  //
  //     expect(response.status).toBe(200);
  //     expectSuccessResponse(response);
  //     expect(response.body.message).toContain('reset link');
  //
  //     expect(prisma.passwordReset.deleteMany).toHaveBeenCalledWith({
  //       where: { userId: mockUser.id }
  //     });
  //     expect(prisma.passwordReset.create).toHaveBeenCalled();
  //   });
  //
  //   it('should not reveal if email exists', async () => {
  //     prisma.user.findUnique.mockResolvedValue(null);
  //
  //     const response = await request(app)
  //       .post('/auth/forgot-password')
  //       .send({ email: 'nonexistent@example.com' });
  //
  //     expect(response.status).toBe(200);
  //     expectSuccessResponse(response);
  //     expect(response.body.message).toContain('reset link');
  //
  //     expect(prisma.passwordReset.create).not.toHaveBeenCalled();
  //   });
  //
  //   it('should validate email format', async () => {
  //     const response = await request(app)
  //       .post('/auth/forgot-password')
  //       .send({ email: 'invalid-email' });
  //
  //     expectErrorResponse(response, 400);
  //   });
  //
  //   it('should delete old reset tokens', async () => {
  //     const mockUser = createUserWithProfileFixture();
  //
  //     prisma.user.findUnique.mockResolvedValue(mockUser);
  //     prisma.passwordReset.deleteMany.mockResolvedValue({ count: 3 });
  //     prisma.passwordReset.create.mockResolvedValue({
  //       id: 1,
  //       userId: mockUser.id,
  //       token: 'hashed-reset-token',
  //       expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  //       used: false,
  //       createdAt: new Date()
  //     });
  //
  //     const response = await request(app)
  //       .post('/auth/forgot-password')
  //       .send({ email: mockUser.email });
  //
  //     expect(response.status).toBe(200);
  //     expect(prisma.passwordReset.deleteMany).toHaveBeenCalled();
  //   });
  // });
  //
  // describe('POST /auth/reset-password', () => {
  //   it('should reset password successfully', async () => {
  //     const mockUser = createUserWithProfileFixture();
  //     const resetRecord = {
  //       id: 1,
  //       userId: mockUser.id,
  //       token: 'hashed-reset-token',
  //       expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  //       used: false,
  //       createdAt: new Date(),
  //       user: mockUser
  //     };
  //
  //     prisma.passwordReset.findUnique.mockResolvedValue(resetRecord);
  //     prisma.$transaction.mockImplementation(async (callback: any) => {
  //       if (typeof callback === 'function') {
  //         return await callback(prisma);
  //       }
  //       return await Promise.all(callback);
  //     });
  //
  //     const response = await request(app)
  //       .post('/auth/reset-password')
  //       .send({
  //         token: 'valid-reset-token',
  //         newPassword: 'newpassword123'
  //       });
  //
  //     expect(response.status).toBe(200);
  //     expectSuccessResponse(response);
  //     expect(response.body.message).toContain('reset');
  //   });
  //
  //   it('should reject invalid reset token', async () => {
  //     prisma.passwordReset.findUnique.mockResolvedValue(null);
  //
  //     const response = await request(app)
  //       .post('/auth/reset-password')
  //       .send({
  //         token: 'invalid-token',
  //         newPassword: 'newpassword123'
  //       });
  //
  //     expectErrorResponse(response, 400);
  //     expect(response.body.message).toContain('Invalid');
  //   });
  //
  //   it('should reject expired reset token', async () => {
  //     const expiredRecord = {
  //       id: 1,
  //       userId: 1,
  //       token: 'hashed-reset-token',
  //       expiresAt: new Date(Date.now() - 1000),
  //       used: false,
  //       createdAt: new Date(),
  //       user: createUserWithProfileFixture()
  //     };
  //
  //     prisma.passwordReset.findUnique.mockResolvedValue(expiredRecord);
  //
  //     const response = await request(app)
  //       .post('/auth/reset-password')
  //       .send({
  //         token: 'expired-token',
  //         newPassword: 'newpassword123'
  //       });
  //
  //     expectErrorResponse(response, 400);
  //     expect(response.body.message).toContain('expired');
  //   });
  //
  //   it('should reject used reset token', async () => {
  //     const usedRecord = {
  //       id: 1,
  //       userId: 1,
  //       token: 'hashed-reset-token',
  //       expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  //       used: true,
  //       createdAt: new Date(),
  //       user: createUserWithProfileFixture()
  //     };
  //
  //     prisma.passwordReset.findUnique.mockResolvedValue(usedRecord);
  //
  //     const response = await request(app)
  //       .post('/auth/reset-password')
  //       .send({
  //         token: 'used-token',
  //         newPassword: 'newpassword123'
  //       });
  //
  //     expectErrorResponse(response, 400);
  //     expect(response.body.message).toContain('Invalid or expired');
  //   });
  //
  //   it('should validate new password', async () => {
  //     const response = await request(app)
  //       .post('/auth/reset-password')
  //       .send({
  //         token: 'valid-token',
  //         newPassword: '123' // Too short
  //       });
  //
  //     expectErrorResponse(response, 400);
  //     expect(response.body.message).toContain('password');
  //   });
  //
  //   it('should require both token and password', async () => {
  //     const response = await request(app)
  //       .post('/auth/reset-password')
  //       .send({ token: 'valid-token' });
  //
  //     expectErrorResponse(response, 400);
  //   });
  // });
  //
  // describe('POST /auth/verify-email', () => {
  //   it('should verify email successfully', async () => {
  //     const mockUser = createUserWithProfileFixture({ isVerified: false });
  //
  //     prisma.user.findFirst.mockResolvedValue(mockUser);
  //     prisma.user.update.mockResolvedValue({ ...mockUser, isVerified: true });
  //
  //     const response = await request(app)
  //       .post('/auth/verify-email')
  //       .send({ token: 'valid-verification-token' });
  //
  //     expect(response.status).toBe(200);
  //     expectSuccessResponse(response);
  //     expect(prisma.user.update).toHaveBeenCalledWith({
  //       where: { id: mockUser.id },
  //       data: { isVerified: true }
  //     });
  //   });
  //
  //   it('should reject invalid verification token', async () => {
  //     prisma.user.findFirst.mockResolvedValue(null);
  //
  //     const response = await request(app)
  //       .post('/auth/verify-email')
  //       .send({ token: 'invalid-token' });
  //
  //     expectErrorResponse(response, 400);
  //   });
  // });
});
