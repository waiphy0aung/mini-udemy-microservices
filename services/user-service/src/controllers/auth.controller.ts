import type { Request, Response } from "express";
import prisma from "../db/client"
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { catchAsync, logger } from "@shared";
import * as userService from "../services/user.services";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@shared";
import { tokenCookieOptions, refreshTokenCookieOptions } from "../utils/cookies";
import { ApiError } from "@shared";


// Deterministic hash for refresh tokens (store only hashed values in DB)
const hashRefreshToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');

export const register = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role as any });
  const refreshToken = signRefreshToken({ id: user.id, email: user.email, role: user.role as any });

  // Persist refresh token
  const refreshExp = new Date(Date.now() + (refreshTokenCookieOptions.maxAge || 0));
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: hashRefreshToken(refreshToken),
      expiresAt: refreshExp,
    },
  });

  res.cookie("token", accessToken, tokenCookieOptions);
  res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

  return res.success({ user: userService.safeUser(user), token: accessToken }, "User registered", 201);
})

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await userService.getUserByEmail(email)

  if (!user) throw ApiError.unauthorized("Invalid credentials");

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) throw ApiError.unauthorized("Invalid credentials");

  const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role as any });
  const refreshToken = signRefreshToken({ id: user.id, email: user.email, role: user.role as any });

  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

  const refreshExp = new Date(Date.now() + (refreshTokenCookieOptions.maxAge || 0));
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: hashRefreshToken(refreshToken),
      expiresAt: refreshExp,
    },
  });

  res.cookie("token", accessToken, tokenCookieOptions);
  res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

  return res.success({ user: userService.safeUser(user), token: accessToken }, "Logged in")
})

export const logout = catchAsync(async (req: Request, res: Response) => {
  const refresh = (req as any).cookies?.refreshToken as string | undefined;
  const userId = req.user?.id;

  // Try delete the specific refresh token, else delete all for user.
  if (refresh) {
    const tokenHash = hashRefreshToken(refresh);
    await prisma.refreshToken.delete({ where: { token: tokenHash } }).catch(() => undefined);
  }
  if (!refresh && userId) await prisma.refreshToken.deleteMany({ where: { userId } });

  res.clearCookie("token", {
    httpOnly: true,
    secure: tokenCookieOptions.secure,
    sameSite: tokenCookieOptions.sameSite,
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: refreshTokenCookieOptions.secure,
    sameSite: refreshTokenCookieOptions.sameSite,
    path: refreshTokenCookieOptions.path,
  });

  return res.success(null, "Logged out");
})

export const refresh = catchAsync(async (req: Request, res: Response) => {
  const rt = (req as any).cookies?.refreshToken || req.body?.refreshToken;
  if (!rt) throw ApiError.unauthorized("Missing refresh token");

  // Verify signature
  const payload = verifyRefreshToken(rt);

  // Validate token against DB and expiry
  const record = await prisma.refreshToken.findUnique({ where: { token: hashRefreshToken(rt) } });
  if (!record || record.userId !== payload.id || record.expiresAt < new Date()) {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  // Fetch active user to ensure still valid
  const user = await prisma.user.findUnique({
    where: { id: payload.id, isActive: true },
  });
  if (!user) throw ApiError.unauthorized("Invalid credentials");

  // Rotate refresh token
  await prisma.refreshToken.delete({ where: { token: hashRefreshToken(rt) } }).catch(() => undefined);
  const newRefresh = signRefreshToken({ id: user.id, email: user.email, role: user.role as any });
  const refreshExp = new Date(Date.now() + (refreshTokenCookieOptions.maxAge || 0));
  await prisma.refreshToken.create({ data: { userId: user.id, token: hashRefreshToken(newRefresh), expiresAt: refreshExp } });

  // Issue new access token
  const access = signAccessToken({ id: user.id, email: user.email, role: user.role as any });

  // Set cookies
  res.cookie("token", access, tokenCookieOptions);
  res.cookie("refreshToken", newRefresh, refreshTokenCookieOptions);

  return res.success({ token: access }, "Token refreshed");
})

export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const resetToken = await userService.createPasswordRefreshToken(email);

    logger.info(`Reset token for ${email}: ${resetToken}`);

    return res.success(null, "If the email exists, a reset link has been sent")
  } catch {
    return res.success(null, "If the email exists, a reset link has been sent")
  }
})

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  await userService.resetPassword(token, newPassword);
  return res.success(null, 'Password reset successfully');
})
