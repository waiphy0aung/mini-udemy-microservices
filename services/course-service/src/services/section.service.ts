import { ApiError } from "@shared";
import prisma from "../db/client";
import { CreateSectionRequest, SectionWithLessons, UpdateSectionRequest } from "../types";

export const createSection = async (
  instructorId: number,
  data: CreateSectionRequest
): Promise<SectionWithLessons> => {
  const course = await prisma.course.findUnique({
    where: { id: data.courseId },
    select: { instructorId: true }
  })

  if (!course) throw ApiError.notFound("Course not found");
  if (course.instructorId !== instructorId) {
    throw ApiError.forbidden("Not authorized to add sections to this course");
  }

  let order = data.order;

  const isOrderExist = await prisma.section.findFirst({
    where: { order, courseId: data.courseId }
  })

  if (order === undefined || isOrderExist) {
    const maxOrder = await prisma.section.aggregate({
      where: { courseId: data.courseId },
      _max: { order: true }
    })
    order = (maxOrder._max.order ?? -1) + 1;
  }

  const section = await prisma.section.create({
    data: {
      ...data,
      order
    },
    include: {
      lessons: true
    }
  });

  return section
}

export const getSectionById = async (id: number): Promise<SectionWithLessons> => {
  return await prisma.section.findUnique({
    where: { id },
    include: {
      lessons: {
        orderBy: { order: "asc" }
      }
    }
  });
}

export const getCourseSections = async (courseId: number) => {
  return await prisma.section.findMany({
    where: { courseId },
    include: {
      lessons: {
        orderBy: { order: "asc" }
      }
    },
    orderBy: { order: "asc" }
  })
}

export const updateSection = async (
  id: number,
  instructorId: number,
  data: UpdateSectionRequest
): Promise<SectionWithLessons> => {
  const section = await prisma.section.findUnique({
    where: { id },
    include: { course: { select: { instructorId: true } } }
  })

  if (!section) throw ApiError.notFound("Section not found");
  if (section.course.instructorId !== instructorId) {
    throw ApiError.forbidden("Not authorized to update this section");
  }

  const updated = await prisma.section.update({
    where: { id },
    data,
    include: {
      lessons: {
        orderBy: { order: "asc" }
      }
    }
  })

  return updated;
}

export const deleteSection = async (id: number, instructorId: number): Promise<void> => {
  const section = await prisma.section.findUnique({
    where: { id },
    include: { course: { select: { instructorId: true } } }
  })

  if (!section) throw ApiError.notFound("Section not found");
  if (section.course.instructorId !== instructorId) {
    throw ApiError.forbidden("Not authorized to delete this section");
  }

  await prisma.section.delete({ where: { id } })
}

export const reorderSections = async (
  courseId: number,
  instructorId: number,
  sectionIds: number[]
): Promise<void> => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { instructorId: true }
  });

  if (!course) throw ApiError.notFound("Course not found");
  if (course.instructorId !== instructorId) {
    throw ApiError.forbidden("Not authorized to reorder sections in this course")
  }

  const updates = sectionIds.map((sectionId, index) => prisma.section.update({
    where: { id: sectionId, courseId },
    data: { order: index }
  }))

  try {
    await prisma.$transaction(updates);
  } catch (err: any) {
    throw new ApiError(400, "Something went wrong", false, err.stack)
  }
}
