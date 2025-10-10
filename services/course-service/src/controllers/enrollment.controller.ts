import { EnrollmentStatus } from "@prisma/client"
import type { Request, Response } from "express";
import * as enrollmentService from "../services/enrollment.service";
import { ApiError, catchAsync } from "@shared";

export const createEnrollment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const courseId = parseInt(req.body.courseId);
  const enrollment = await enrollmentService.createEnrollment({ userId, courseId })
  return res.success({ enrollment }, "Enrolled successfully", 201);
});

export const getMyEnrollments = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const filters = {
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 10,
    userId,
    status: req.query.status as EnrollmentStatus
  }

  const result = await enrollmentService.getAllEnrollments(filters)
  return res.success(result, "Enrollments retrieved")
});

export const getMyActiveEnrollments = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const enrollments = await enrollmentService.getUserActiveEnrollments(userId);
  return res.success({ enrollments }, "Active enrollments retrieved");
})

export const getEnrollmentById = catchAsync(async (req: Request, res: Response) => {
  const enrollmentId = parseInt(req.params.id);
  const userId = req.user!.id;
  const enrollment = await enrollmentService.getEnrollmentById(enrollmentId)

  if (!enrollment) throw ApiError.notFound("Enrollment not found");
  if (enrollment.userId !== userId) {
    throw ApiError.forbidden("Not authorized to view this enrollment");
  }

  return res.success({ enrollment }, "Enrollment retrieved")
})

export const updateEnrollmentProgress = catchAsync(async (req: Request, res: Response) => {
  const enrollmentId = parseInt(req.params.id);
  const userId = req.user!.id;
  const enrollment = await enrollmentService.updateEnrollment(enrollmentId, userId, req.body)
  return res.success({ enrollment }, "Progress updated");
})

export const dropEnrollment = catchAsync(async (req: Request, res: Response) => {
  const enrollmentId = parseInt(req.params.id);
  const userId = req.user!.id;
  await enrollmentService.dropEnrollment(enrollmentId, userId);
  return res.success(null, "Enrollment dropped");
})

export const checkEnrollment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const courseId = parseInt(req.params.courseId);
  const isEnrolled = await enrollmentService.isUserEnrolled(userId, courseId);
  return res.success({ isEnrolled }, "Enrollment status");
})

export const getAllEnrollments = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 10,
    userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
    courseId: req.query.courseId ? parseInt(req.query.courseId as string) : undefined,
    status: req.query.status as EnrollmentStatus
  };

  const result = await enrollmentService.getAllEnrollments(filters);
  return res.success(result, "All enrollments retrieved");
});
