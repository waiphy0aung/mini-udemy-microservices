import prisma from "../db/client";
import { ApiError, generateSlug } from "@shared";
import { CourseFilters, CourseWithRelations, CreateCourseRequest, SectionWithLessons, UpdateCourseRequest } from "src/types";


const ensureUniqueSlug = async (baseSlug: string, excludeId?: number): Promise<string> => {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.course.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!existing || existing.id === excludeId) break;

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

export const createCourse = async (
  instructorId: number,
  data: CreateCourseRequest
): Promise<CourseWithRelations> => {
  const baseSlug = generateSlug(data.title);
  const slug = await ensureUniqueSlug(baseSlug);

  const course = await prisma.course.create({
    data: {
      ...data,
      slug,
      instructorId,
      tags: data.tags || [],
      requirements: data.requirements || [],
      objectives: data.objectives || [],
    },
    include: {
      category: true,
      sections: {
        include: { lessons: true },
        orderBy: { order: "asc" },
      },
    },
  });

  return course;
};

export const getCourseById = async (id: number): Promise<CourseWithRelations | null> => {
  return await prisma.course.findUnique({
    where: { id },
    include: {
      category: true,
      sections: {
        include: { lessons: true },
        orderBy: { order: "asc" }
      }
    }
  })
}

export const getCourseBySlug = async (slug: string): Promise<CourseWithRelations | null> => {
  return await prisma.course.findUnique({
    where: { slug },
    include: {
      category: true,
      sections: {
        include: { lessons: true },
        orderBy: { order: "asc" }
      }
    }
  })
}

const validateAndGetCourse = async (id: number, instructorId: number): Promise<CourseWithRelations> => {
  const course = await getCourseById(id);
  if (!course) throw ApiError.notFound("Course not found");
  if (course.instructorId !== instructorId) throw ApiError.forbidden("Not authorized to delete this course");

  return course;
}

export const getAllCourses = async (filters: CourseFilters) => {
  const {
    page = 1,
    limit = 10,
    search,
    instructorId,
    categoryId,
    level,
    status = "PUBLISHED",
    minPrice,
    maxPrice,
    tags,
    language
  } = filters;

  const skip = (page - 1) * limit;
  const where: any = { status };

  if (instructorId) where.instructorId = instructorId;
  if (categoryId) where.categoryId = categoryId;
  if (level) where.level = level;
  if (language) where.language = language;

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } }
    ]
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice) where.price.gte = minPrice;
    if (maxPrice) where.price.lte = maxPrice;
  }

  if (tags && tags.length > 0) {
    where.tags = { hasSome: tags }
  }

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      include: {
        category: true,
        sections: {
          include: { lessons: true },
          orderBy: { order: "asc" }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" }
    }),
    prisma.course.count({ where })
  ])

  return {
    courses,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }
}

export const updateCourse = async (
  id: number,
  instructorId: number,
  data: UpdateCourseRequest
): Promise<{ updated: CourseWithRelations, oldSlug: string }> => {
  const course = await validateAndGetCourse(id, instructorId)
  const oldSlug = course.slug

  const updateData: any = { ...data }

  if (data.title && data.title !== course.title) {
    const baseSlug = generateSlug(data.title);
    updateData.slug = await ensureUniqueSlug(baseSlug, id);
  }

  const updated = await prisma.course.update({
    where: { id },
    data: updateData,
    include: {
      category: true,
      sections: {
        include: { lessons: true },
        orderBy: { order: "asc" }
      }
    }
  })

  return { updated, oldSlug };
}

export const deleteCourse = async (id: number, instructorId: number): Promise<CourseWithRelations> => {
  const course = await validateAndGetCourse(id, instructorId)
  await prisma.course.delete({ where: { id } });
  return course;
}

export const publishCourse = async (id: number, instructorId: number): Promise<CourseWithRelations> => {
  const course = await validateAndGetCourse(id, instructorId)

  const sectionsWithLessons = course.sections.filter(s => s.lessons.length > 0);
  if (sectionsWithLessons.length === 0) {
    throw ApiError.badRequest("Cannot publish course without content. Add at least one section with lessons.");
  }

  const updated = await prisma.course.update({
    where: { id },
    data: { status: "PUBLISHED" },
    include: {
      category: true,
      sections: {
        include: { lessons: true },
        orderBy: { order: "asc" }
      }
    }
  })

  return updated
}

export const archiveCourse = async (id: number, instructorId: number): Promise<CourseWithRelations> => {
  await validateAndGetCourse(id, instructorId)

  const updated = await prisma.course.update({
    where: { id },
    data: { status: "ARCHIVED" },
    include: {
      category: true,
      sections: {
        include: { lessons: true },
        orderBy: { order: "asc" }
      }
    }
  })

  return updated;
}

export const getInstructorCourses = async (instructorId: number, filters: Omit<CourseFilters, "instructorId">) => {
  return getAllCourses({ ...filters, instructorId })
}

export const calculateCourseDuration = async (courseId: number): Promise<number> => {
  const sections = await prisma.section.findMany({
    where: { courseId },
    include: { lessons: true }
  })

  const totalDuration = sections.reduce((acc: number, section: SectionWithLessons) => {
    const sectionDuration = section.lessons.reduce((sum: number, lesson) => sum + lesson.duration, 0);
    return acc + sectionDuration
  }, 0)

  await prisma.course.update({
    where: { id: courseId },
    data: { duration: totalDuration }
  });

  return totalDuration
}
