import type { Request, Response } from "express";
import catchAsync from "@shared/utils/catchAsync";
import * as sectionService from "../services/section.service"
import { ApiError, delByPrefix } from "@shared";

const clearSectionCaches = async (sectionId?: number) => {
  const tasks: Promise<any>[] = [];

  if (sectionId) {
    tasks.push(delByPrefix(`sections:detail:/sections/${sectionId}`))
    tasks.push(delByPrefix(`lessons:list:/sections/${sectionId}`))
  }

  tasks.push(delByPrefix("sections:list"))

  await Promise.allSettled(tasks)
}

export const createSection = catchAsync(async (req: Request, res: Response) => {
  const instructorId = req.user!.id;
  const section = await sectionService.createSection(instructorId, req.body)
  await clearSectionCaches()
  return res.success({ section }, "Section created", 201);
});

export const getCourseSections = catchAsync(async (req: Request, res: Response) => {
  const courseId = parseInt(req.params.courseId);
  const sections = await sectionService.getCourseSections(courseId);
  return res.success({ sections }, "Sections retrieved");
})

export const getSectionById = catchAsync(async (req: Request, res: Response) => {
  const sectionId = parseInt(req.params.id);
  const section = await sectionService.getSectionById(sectionId)
  if (!section) throw ApiError.notFound(section);
  return res.success({ section }, "Section retrieved");
})

export const updateSection = catchAsync(async (req: Request, res: Response) => {
  const sectionId = parseInt(req.params.id);
  const instructorId = req.user!.id;
  const section = await sectionService.updateSection(sectionId, instructorId, req.body)
  await clearSectionCaches(section.id)
  return res.success({ section }, "Section updated");
})

export const deleteSection = catchAsync(async (req: Request, res: Response) => {
  const sectionId = parseInt(req.params.id);
  const instructorId = req.user!.id;
  await sectionService.deleteSection(sectionId, instructorId)
  await clearSectionCaches(sectionId)
  return res.success(null, "Section deleted");
})

export const reorderSection = catchAsync(async (req: Request, res: Response) => {
  const courseId = parseInt(req.params.courseId);
  const instructorId = req.user!.id;
  const { sectionIds } = req.body;
  await sectionService.reorderSections(courseId, instructorId, sectionIds)
  await clearSectionCaches()
  return res.success(null, "Sections reordered");
})
