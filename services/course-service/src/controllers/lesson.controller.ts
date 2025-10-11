import type { Request, Response } from "express";
import catchAsync from "@shared/utils/catchAsync";
import * as lessonService from "../services/lesson.service";
import { ApiError, delByPrefix } from "@shared";

const clearLessonCaches = async (lessonId?: number) => {
  const tasks: Promise<any>[] = [];

  if (lessonId) tasks.push(delByPrefix(`lessons:detail:/lessons/${lessonId}`))

  tasks.push(delByPrefix("lessons:list"))

  await Promise.allSettled(tasks)
}

export const createLesson = catchAsync(async (req: Request, res: Response) => {
  const instructorId = req.user!.id;
  const lesson = await lessonService.createLesson(instructorId, req.body);
  await clearLessonCaches()
  return res.success({ lesson }, "Lesson created", 201);
})

export const getSectionLessons = catchAsync(async (req: Request, res: Response) => {
  const sectionId = parseInt(req.params.sectionId);
  const lessons = await lessonService.getSectionLessons(sectionId)
  return res.success({ lessons }, "Lessons retrieved");
})

export const getLessonById = catchAsync(async (req: Request, res: Response) => {
  const lessonId = parseInt(req.params.id);
  const lesson = await lessonService.getLessonById(lessonId);
  if (!lesson) throw ApiError.notFound("Lesson not found");
  return res.success({ lesson }, "Lesson retrieved");
})

export const updateLesson = catchAsync(async (req: Request, res: Response) => {
  const lessonId = parseInt(req.params.id);
  const instructorId = req.user!.id;
  const lesson = await lessonService.updateLesson(lessonId, instructorId, req.body);
  await clearLessonCaches(lessonId)
  return res.success({ lesson }, "Lesson updated");
})

export const deleteLesson = catchAsync(async (req: Request, res: Response) => {
  const lessonId = parseInt(req.params.id);
  const instructorId = req.user!.id;
  await lessonService.deleteLesson(lessonId, instructorId)
  await clearLessonCaches(lessonId)
  return res.success(null, "Lesson deleted");
})

export const reorderLesson = catchAsync(async (req: Request, res: Response) => {
  const sectionId = parseInt(req.params.sectionId);
  const instructorId = req.user!.id;
  const { lessonIds } = req.body;
  await lessonService.reorderLessons(sectionId, instructorId, lessonIds);
  await clearLessonCaches()
  return res.success(null, "Lessons reordered");
})
