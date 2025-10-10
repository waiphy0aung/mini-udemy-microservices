import prisma from "src/db/client";
import { CreateEnrollmentRequest, EnrollmentFilters, UpdateEnrollmentRequest } from "src/types";
import { ApiError } from "@shared"
import { Enrollment } from "@prisma/client";

export const createEnrollment = async (data: CreateEnrollmentRequest) => {
  const { userId, courseId } = data;

  const course = await prisma.course.findUnique({
    where: { id: courseId }
  })

  if (!course) throw ApiError.notFound("Course not found");
  if (course.status !== "PUBLISHED") {
    throw ApiError.badRequest("Cannot enroll in unpublished course");
  }

  const existing = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: { userId, courseId }
    }
  })

  if (existing) {
    if (existing.status === "DROPPED") {
      return await prisma.enrollment.update({
        where: { id: existing.id },
        data: { status: "ACTIVE", enrolledAt: new Date() }
      })
    }
    throw ApiError.badRequest("Already enrolled in this course");
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      userId,
      courseId
    }
  })

  return enrollment;
}

export const getEnrollmentById = async (id: number): Promise<Enrollment | null> => {
  return await prisma.enrollment.findUnique({
    where: { id }
  })
};

export const getUserCourseEnrollment = async (
  userId: number,
  courseId: number
): Promise<Enrollment | null> => {
  return await prisma.enrollment.findUnique({
    where: {
      userId_courseId: { userId, courseId }
    }
  })
};

export const getAllEnrollments = async (filters: EnrollmentFilters) => {
  const { page = 1, limit = 10, userId, courseId, status } = filters
  const skip = (page - 1) * limit;

  const where: any = {};

  if (userId) where.userId = userId;
  if (courseId) where.courseId = courseId;
  if (status) where.status = status;

  const [enrollments, total] = await Promise.all([
    prisma.enrollment.findMany({
      where,
      include: {
        course: {
          include: {
            category: true,
            sections: {
              include: { lessons: true },
              orderBy: { order: "asc" }
            }
          }
        }
      },
      skip,
      take: limit,
      orderBy: { enrolledAt: "desc" }
    }),
    prisma.enrollment.count({ where })
  ])

  return {
    enrollments,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }
}

export const updateEnrollment = async (
  id: number,
  userId: number,
  data: UpdateEnrollmentRequest
): Promise<Enrollment> => {
  const enrollment = await getEnrollmentById(id)
  if (!enrollment) throw ApiError.notFound("Enrollment not found");
  if (enrollment.userId !== userId) {
    throw ApiError.forbidden("Not authorized to update this enrollment");
  }

  const updateData: any = { ...data }

  if (data.progress !== undefined && data.progress >= 100) {
    updateData.status = "COMPLETED";
    updateData.completedAt = new Date();
  }

  const updated = await prisma.enrollment.update({
    where: { id },
    data: updateData
  })

  return updated
}

export const dropEnrollment = async (id: number, userId: number): Promise<void> => {
  const enrollment = await getEnrollmentById(id);
  if (!enrollment) throw ApiError.notFound("Enrollment not found");
  if (enrollment.userId !== userId) {
    throw ApiError.forbidden("Not authorized to drop this enrollment");
  }

  await prisma.enrollment.update({
    where: { id },
    data: { status: "DROPPED" }
  })
}

export const isUserEnrolled = async (
  userId: number,
  courseId: number
): Promise<boolean> => {
  const enrollment = await getUserCourseEnrollment(userId, courseId)
  return enrollment !== null && enrollment.status === "ACTIVE"
}

export const getUserActiveEnrollments = async (userId: number) => {
  return await prisma.enrollment.findMany({
    where: {
      userId,
      status: "ACTIVE"
    },
    include: {
      course: {
        include: {
          category: true
        }
      }
    },
    orderBy: { lastAccessedAt: "desc" }
  })
}

export const updateLastAccessed = async (
  userId: number,
  courseId: number
): Promise<void> => {
  await prisma.enrollment.update({
    where: {
      userId,
      courseId,
      status: "ACTIVE"
    },
    data: {
      lastAccessedAt: new Date()
    }
  })
}
