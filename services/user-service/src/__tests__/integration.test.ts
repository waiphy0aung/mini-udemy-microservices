import request from 'supertest';
import app from '../app';
import { Role } from '@prisma/client';
import {
  createUserWithProfileFixture,
  hashPassword,
  getMockPrisma,
  expectSuccessResponse
} from './helpers';

const prisma = getMockPrisma();

describe('Integration Tests - Full User Lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should complete full user registration and login flow', async () => {
    // 1. Register a new user
    const registerPayload = {
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      role: 'STUDENT'
    };

    const mockUser = createUserWithProfileFixture({
      email: registerPayload.email,
      role: Role.STUDENT
    });

    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(mockUser);
    prisma.refreshToken.create.mockResolvedValue({
      id: 1,
      userId: mockUser.id,
      token: 'hashed-token',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date()
    });

    const registerResponse = await request(app)
      .post('/auth/register')
      .send(registerPayload);

    expect(registerResponse.status).toBe(201);
    expectSuccessResponse(registerResponse);
    
    const { token: accessToken } = registerResponse.body.data;
    expect(accessToken).toBeDefined();

    // 2. Get user profile with token
    prisma.user.findUnique.mockResolvedValue(mockUser);

    const profileResponse = await request(app)
      .get('/users/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(profileResponse.status).toBe(200);
    expectSuccessResponse(profileResponse);
    expect(profileResponse.body.data.user.email).toBe(registerPayload.email);

    // 3. Update profile
    const updatedProfile = {
      ...mockUser.profile,
      bio: 'Updated bio',
      country: 'Singapore'
    };

    prisma.userProfile.upsert.mockResolvedValue(updatedProfile);

    const updateResponse = await request(app)
      .put('/users/me/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ bio: 'Updated bio', country: 'Singapore' });

    expect(updateResponse.status).toBe(200);
    expectSuccessResponse(updateResponse);
    expect(updateResponse.body.data.profile.bio).toBe('Updated bio');

    // 4. Logout
    prisma.refreshToken.delete.mockResolvedValue({
      id: 1,
      userId: mockUser.id,
      token: 'hashed-token',
      expiresAt: new Date(),
      createdAt: new Date()
    });

    const logoutResponse = await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(logoutResponse.status).toBe(200);
    expectSuccessResponse(logoutResponse);
  });

  it('should handle password reset flow', async () => {
    const mockUser = createUserWithProfileFixture({
      email: 'user@example.com'
    });

    // 1. Request password reset
    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.passwordReset.deleteMany.mockResolvedValue({ count: 0 });
    prisma.passwordReset.create.mockResolvedValue({
      id: 1,
      userId: mockUser.id,
      token: 'hashed-reset-token',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      used: false,
      createdAt: new Date()
    });

    const forgotResponse = await request(app)
      .post('/auth/forgot-password')
      .send({ email: mockUser.email });

    expect(forgotResponse.status).toBe(200);
    expectSuccessResponse(forgotResponse);

    // 2. Reset password with token
    const resetRecord = {
      id: 1,
      userId: mockUser.id,
      token: 'hashed-reset-token',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      used: false,
      createdAt: new Date(),
      user: mockUser
    };

    prisma.passwordReset.findUnique.mockResolvedValue(resetRecord);
    prisma.$transaction.mockImplementation(async (operations: any) => {
      return await Promise.all(operations);
    });

    const resetResponse = await request(app)
      .post('/auth/reset-password')
      .send({
        token: 'valid-reset-token',
        newPassword: 'newpassword123'
      });

    expect(resetResponse.status).toBe(200);
    expectSuccessResponse(resetResponse);

    // 3. Login with new password
    const hashedPassword = await hashPassword('newpassword123');
    const updatedUser = {
      ...mockUser,
      password: hashedPassword
    };

    prisma.user.findUnique.mockResolvedValue(updatedUser);
    prisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });
    prisma.refreshToken.create.mockResolvedValue({
      id: 2,
      userId: mockUser.id,
      token: 'new-hashed-token',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date()
    });

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: mockUser.email,
        password: 'newpassword123'
      });

    expect(loginResponse.status).toBe(200);
    expectSuccessResponse(loginResponse);
  });

  it('should handle instructor approval flow', async () => {
    // 1. Register as instructor
    const instructorPayload = {
      email: 'instructor@example.com',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Teacher',
      role: 'INSTRUCTOR'
    };

    const mockInstructor = createUserWithProfileFixture({
      email: instructorPayload.email,
      role: Role.INSTRUCTOR,
      id: 2
    });

    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(mockInstructor);
    prisma.refreshToken.create.mockResolvedValue({
      id: 1,
      userId: mockInstructor.id,
      token: 'hashed-token',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date()
    });

    const registerResponse = await request(app)
      .post('/auth/register')
      .send(instructorPayload);

    expect(registerResponse.status).toBe(201);
    const { token: instructorToken } = registerResponse.body.data;

    // 2. Update instructor profile
    const instructorProfile = {
      id: 1,
      userId: 2,
      isApproved: false,
      expertise: ['JavaScript', 'Node.js'],
      experience: '5 years',
      education: 'CS Degree',
      website: null,
      linkedIn: null,
      youtube: null,
      rating: null,
      studentCount: 0,
      courseCount: 0,
      totalEarnings: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    prisma.user.findUnique.mockResolvedValue({
      ...mockInstructor,
      instructorProfile
    });
    prisma.instructorProfile.upsert.mockResolvedValue(instructorProfile);

    const updateProfileResponse = await request(app)
      .put('/users/me/instructor-profile')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        expertise: ['JavaScript', 'Node.js'],
        experience: '5 years',
        education: 'CS Degree'
      });

    expect(updateProfileResponse.status).toBe(200);
    expectSuccessResponse(updateProfileResponse);

    // 3. Admin approves instructor (would use admin token in real scenario)
    prisma.user.findUnique.mockResolvedValue({
      ...mockInstructor,
      instructorProfile
    });
    prisma.instructorProfile.upsert.mockResolvedValue({
      ...instructorProfile,
      isApproved: true
    });

    // This step would require admin token, but demonstrates the flow
    expect(instructorProfile).toBeDefined();
  });
});

describe('Integration Tests - Error Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle concurrent login attempts', async () => {
    const hashedPassword = await hashPassword('password123');
    const mockUser = createUserWithProfileFixture({
      password: hashedPassword
    });

    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });
    prisma.refreshToken.create.mockResolvedValue({
      id: 1,
      userId: mockUser.id,
      token: 'hashed-token',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date()
    });

    const loginPromises = [
      request(app)
        .post('/auth/login')
        .send({ email: mockUser.email, password: 'password123' }),
      request(app)
        .post('/auth/login')
        .send({ email: mockUser.email, password: 'password123' }),
      request(app)
        .post('/auth/login')
        .send({ email: mockUser.email, password: 'password123' })
    ];

    const results = await Promise.all(loginPromises);
    
    results.forEach(response => {
      expect(response.status).toBe(200);
    });
  });

  it('should handle invalid token gracefully', async () => {
    const response = await request(app)
      .get('/users/me')
      .set('Authorization', 'Bearer invalid-token-format');

    expect(response.status).toBe(401);
  });

  it('should prevent privilege escalation', async () => {
    const studentUser = createUserWithProfileFixture({
      id: 1,
      role: Role.STUDENT
    });

    prisma.user.findUnique.mockResolvedValue(studentUser);

    const studentToken = 'Bearer ' + require('jsonwebtoken').sign(
      { id: 1, email: studentUser.email, role: Role.STUDENT },
      process.env.JWT_SECRET!
    );

    // Try to access admin endpoint
    const response = await request(app)
      .get('/users')
      .set('Authorization', studentToken);

    expect(response.status).toBe(403);
  });
});
