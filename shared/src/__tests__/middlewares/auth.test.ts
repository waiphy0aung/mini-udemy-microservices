import { Request, Response, NextFunction } from 'express';
import { auth, signAccessToken, verifyAccessToken } from '../../middlewares/auth';
import { UserRole } from '../../types';
import { generateToken, generateExpiredToken } from '../helpers';
import ApiError from '../../utils/ApiError';

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
      cookies: {},
      method: 'GET'
    };
    mockRes = {};
    mockNext = jest.fn();
  });

  describe('signAccessToken', () => {
    it('should sign a valid access token', () => {
      const payload = { id: 1, email: 'test@example.com', role: UserRole.STUDENT };
      const token = signAccessToken(payload);
      
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid token', () => {
      const payload = { id: 1, email: 'test@example.com', role: UserRole.STUDENT };
      const token = signAccessToken(payload);
      const decoded = verifyAccessToken(token);
      
      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('should throw on invalid token', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow();
    });

    it('should throw on expired token', () => {
      const expiredToken = generateExpiredToken();
      expect(() => verifyAccessToken(expiredToken)).toThrow();
    });
  });

  describe('auth middleware', () => {
    it('should authenticate with valid Bearer token', async () => {
      const token = generateToken({ id: 1, role: UserRole.STUDENT });
      mockReq.headers = { authorization: `Bearer ${token}` };

      await auth()(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect((mockReq as any).user).toBeDefined();
      expect((mockReq as any).user.id).toBe(1);
    });

    it('should reject request without token', async () => {
      await auth()(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(401);
    });

    it('should enforce role restrictions', async () => {
      const studentToken = generateToken({ id: 1, role: UserRole.STUDENT });
      mockReq.headers = { authorization: `Bearer ${studentToken}` };

      await auth(['ADMIN'])(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(403);
    });
  });
});
