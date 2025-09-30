import type { Request, Response } from "express"
import { catchAsync, ApiError } from "@shared";
import * as userService from "../services/user.services";

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.user!.id);
  if (!user) throw ApiError.notFound("Invalid credentials");

  return res.success({ user: userService.safeUser(user) }, "Current user")
})

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const profile = await userService.updateUserProfile(req.user!.id, req.body)
  return res.success({ profile }, "Profile updated");
})

export const updateInstructorProfile = catchAsync(async (req: Request, res: Response) => {
  const profile = await userService.updateInstructorProfile(req.user!.id, req.body);
  return res.success({ profile }, "Instructor Profile updated");
})

export const changePassword = catchAsync(async (req: Request, res: Response) => {
  await userService.changePassword(req.user!.id, req.body);
  return res.success(null, "Password changed successfully");
})

export const deleteAccount = catchAsync(async (req: Request, res: Response) => {
  await userService.deactivateUser(req.user!.id);
  return res.success(null, "Account deactivated");
})

// Admin controllers
export const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 10,
    role: req.query.role as string,
    search: req.query.search as string,
    isActive: req.query.isActive !== 'false'
  }

  const result = await userService.getAllUsers(filters)
  return res.success(result, "Users retrieved")
})

export const getUserById = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.getUserById(parseInt(req.params.id));
  if (!user) throw ApiError.notFound("User not found");

  return res.success({ user: userService.safeUser(user) }, "User retrieved")
})

export const deactivateUser = catchAsync(async (req: Request, res: Response) => {
  await userService.deactivateUser(parseInt(req.params.id));
  return res.success(null, "User deactivated");
})

export const reactivateUser = catchAsync(async (req: Request, res: Response) => {
  await userService.reactivateUser(parseInt(req.params.id));
  return res.success(null, "User reactivated");
})

export const verifyUser = catchAsync(async (req: Request, res: Response) => {
  await userService.verifyUser(parseInt(req.params.id))
  return res.success(null, "User verified");
})

export const approveInstructor = catchAsync(async (req: Request, res: Response) => {
  await userService.approveInstructor(parseInt(req.params.id));
  return res.success(null, "Instructor approved");
})

export const getInstructors = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 10,
    isApproved: req.query.isApproved === 'true' ? true : req.query.isApproved === 'false' ? false : undefined,
    expertise: req.query.experise as string
  };

  const result = await userService.getAllInstructors(filters);
  return res.success(result, "Instructors retrieved");
})
