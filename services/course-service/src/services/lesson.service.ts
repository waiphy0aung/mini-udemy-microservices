import ApiError from "@shared/utils/ApiError";
import prisma from "../db/client";
import { CreateLessonRequest, UpdateLessonRequest } from "../types";
import { calculateCourseDuration } from "./course.service";
import { Lesson } from "@prisma/client";

export const createLesson = async (
  instructorId: number,
  data: CreateLessonRequest
): Promise<Lesson> => {
  const section = await prisma.section.findUnique({
    where: { id: data.sectionId },
    include: { course: { select: { id: true, instructorId: true } } }
  })

  if (!section) throw ApiError.notFound("Section not found");
  if (section.course.instructorId !== instructorId) {
    throw ApiError.forbidden("Not authorized to add lesson to this section")
  }

  let order = data.order;

  const isOrderExist = await prisma.lesson.findFirst({
    where: { sectionId: data.sectionId, order }
  })

  if (order === undefined || isOrderExist) {
    const maxOrder = await prisma.lesson.aggregate({
      where: { sectionId: data.sectionId },
      _max: { order: true }
    })
    order = (maxOrder._max.order ?? -1) + 1;
  }

  const lesson = await prisma.lesson.create({
    data: {
      ...data,
      order
    }
  })

  await calculateCourseDuration(section.course.id);

  return lesson;
}

export const getLessonById = async (id: number): Promise<Lesson | null> => {
  return await prisma.lesson.findUnique({
    where: { id }
  })
}

export const getSectionLessons = async (sectionId: number): Promise<Lesson[]> => {
  return await prisma.lesson.findMany({
    where: { sectionId }
  })
}

export const updateLesson = async (
  id: number,
  instructorId: number,
  data: UpdateLessonRequest
): Promise<Lesson> => {
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      section: {
        include: { course: { select: { id: true, instructorId: true } } }
      }
    }
  })

  if (!lesson) throw ApiError.notFound("Lesson not found")
  if (lesson.section.course.instructorId !== instructorId) {
    throw ApiError.forbidden("Not authorized to update this lesson")
  }

  const updated = await prisma.lesson.update({
    where: { id },
    data
  })

  if (data.duration !== undefined) {
    await calculateCourseDuration(lesson.section.course.id);
  }

  return updated;
}

export const deleteLesson = async (id: number, instructorId: number): Promise<void> => {
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      section: {
        include: { course: { select: { id: true, instructorId: true } } }
      }
    }
  })

  if (!lesson) throw ApiError.notFound("Lesson not found")
  if (lesson.section.course.instructorId !== instructorId) {
    throw ApiError.forbidden("Not authorized to delete this lesson")
  }

  const courseId = lesson.section.course.id;

  await prisma.lesson.delete({ where: { id } })

  await calculateCourseDuration(courseId)
}

export const reorderLessons = async (
  sectionId: number,
  instructorId: number,
  lessonIds: number[]
): Promise<void> => {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: { course: { select: { instructorId: true } } }
  })

  if (!section) throw ApiError.notFound("Section not found");
  if (section.course.instructorId !== instructorId) {
    throw ApiError.forbidden("Not authorized to reorder lessons in this section")
  }

  const updates = lessonIds.map((lessonId, index) => prisma.lesson.update({
    where: { id: lessonId, sectionId },
    data: { order: index }
  }))

  try {
    await prisma.$transaction(updates);
  } catch (err: any) {
    throw new ApiError(400, "Something went wrong", false, err.stack)
  }
}
