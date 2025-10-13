import type { Request, Response } from "express";
import catchAsync from "@shared/utils/catchAsync";
import * as courseService from "../services/course.service"
import { ApiError, delByPrefix } from "@shared";

const clearCourseCaches = async (courseId?: number, courseSlug?: string) => {
  const tasks: Promise<any>[] = [];

  if (courseId) {
    tasks.push(delByPrefix(`courses:detail:/${courseId}`));
    tasks.push(delByPrefix(`sections:list:/${courseId}`));
  }
  if (courseSlug) tasks.push(delByPrefix(`courses:detail:/${courseSlug}`));

  tasks.push(delByPrefix("courses:list"))

  await Promise.allSettled(tasks)
}

export const createCourse = catchAsync(async (req: Request, res: Response) => {
  const instructorId = req.user!.id;
  const course = await courseService.createCourse(instructorId, req.body);
  await clearCourseCaches()
  return res.success({ course }, "Course created", 201);
})

export const getAllCourses = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 10,
    search: req.query.search as string,
    categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
    instructorId: req.query.instructorId ? parseInt(req.query.instructorId as string) : undefined,
    level: req.query.level as any,
    status: "PUBLISHED" as any,
    minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
    maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
    tags: req.query.tags ? (req.query.tags as string).split(",") : undefined,
    language: req.query.language as string
  }

  const result = await courseService.getAllCourses(filters)
  return res.success(result, "Courses retrieved")
})

export const getCourse = catchAsync(async (req: Request, res: Response) => {
  const identifier = req.params.id;
  let course;

  // Try to parse as number (ID), otherwise treat as slug
  if (/^\d+$/.test(identifier)) {
    course = await courseService.getCourseById(parseInt(identifier));
  } else {
    course = await courseService.getCourseBySlug(identifier)
  }

  if (!course) throw ApiError.notFound("Course not found");

  return res.success({ course }, "Course retrieved")
})

export const getInstructorCourses = catchAsync(async (req: Request, res: Response) => {
  const instructorId = req.user!.id;
  const filters = {
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 10,
    search: req.query.search as string,
    categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
    level: req.query.level as any,
    status: "PUBLISHED" as any,
    minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
    maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
    tags: req.query.tags ? (req.query.tags as string).split(",") : undefined,
    language: req.query.language as string
  }

  const result = await courseService.getInstructorCourses(instructorId, filters)
  return res.success(result, "Instructor courses retrieved");
})

export const updateCourse = catchAsync(async (req: Request, res: Response) => {
  const courseId = parseInt(req.params.id);
  const instructorId = req.user!.id;
  const { updated, oldSlug } = await courseService.updateCourse(courseId, instructorId, req.body)

  await clearCourseCaches(updated.id, oldSlug)

  return res.success({ course: updated }, "Course updated")
})

export const deleteCourse = catchAsync(async (req: Request, res: Response) => {
  const courseId = parseInt(req.params.id);
  const instructorId = req.user!.id;
  const course = await courseService.deleteCourse(courseId, instructorId);
  await clearCourseCaches(course.id, course.slug)
  return res.success(null, "Course deleted");
})

export const publishCourse = catchAsync(async (req: Request, res: Response) => {
  const courseId = parseInt(req.params.id);
  const instructorId = req.user!.id;
  const course = await courseService.publishCourse(courseId, instructorId);
  await clearCourseCaches(course.id, course.slug)
  return res.success({ course }, "Course published");
})

export const archiveCourse = catchAsync(async (req: Request, res: Response) => {
  const courseId = parseInt(req.params.id);
  const instructorId = req.user!.id;
  const course = await courseService.archiveCourse(courseId, instructorId);
  await clearCourseCaches(course.id, course.slug)
  return res.success({ course }, "Course archived");
})
