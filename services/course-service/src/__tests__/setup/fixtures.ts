import { PrismaClient, CourseLevel, CourseStatus, LessonType } from "@prisma/client";
import { signAccessToken } from "@shared/middlewares/auth";

export const createTestUser = (id: number, role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' = 'STUDENT') => {
  return {
    id,
    email: `test${id}@example.com`,
    role
  }
}

export const generateAuthToken = (userId: number, role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' = 'STUDENT') => {
  const user = createTestUser(userId, role);
  return signAccessToken(user as any)
}

export const createTestCategory = async (prisma: PrismaClient, data?: Partial<any>) => {
  return await prisma.category.create({
    data: {
      name: data?.name || 'Test Category',
      slug: data?.slug || `test-category-${Date.now()}`,
      description: data?.description || 'Test category description',
      ...data
    }
  })
}

export const createTestCourse = async (
  prisma: PrismaClient,
  instructorId: number = 1,
  data?: Partial<any>
) => {
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return await prisma.course.create({
    data: {
      title: data?.title || 'Test Course',
      slug: data?.slug || `test-course-${uniqueSuffix}`,
      description: data?.description || 'Test course description',
      price: data?.price ?? 49.99,
      currency: data?.currency || 'USD',
      instructorId,
      level: data?.level || CourseLevel.BEGINNER,
      status: data?.status || CourseStatus.DRAFT,
      tags: data?.tags || ['test'],
      requirements: data?.requirements || [],
      objectives: data?.objectives || [],
      ...data,
    },
  })
}

export const createTestSection = async (
  prisma: PrismaClient,
  courseId: number,
  data?: Partial<any>
) => {
  return await prisma.section.create({
    data: {
      courseId,
      title: data?.title || 'Test Section',
      description: data?.description || 'Test section description',
      order: data?.order ?? 0,
      ...data,
    },
  });
};

export const createTestLesson = async (
  prisma: PrismaClient,
  sectionId: number,
  data?: Partial<any>
) => {
  return await prisma.lesson.create({
    data: {
      sectionId,
      title: data?.title || 'Test Lesson',
      description: data?.description || 'Test lesson description',
      type: data?.type || LessonType.VIDEO,
      content: data?.content || 'https://example.com/video.mp4',
      duration: data?.duration ?? 300,
      order: data?.order ?? 0,
      isFree: data?.isFree ?? false,
      ...data,
    },
  });
};

export const createTestEnrollment = async (
  prisma: PrismaClient,
  userId: number,
  courseId: number,
  data?: Partial<any>
) => {
  return await prisma.enrollment.create({
    data: {
      userId,
      courseId,
      status: data?.status || 'ACTIVE',
      progress: data?.progress ?? 0,
      ...data,
    },
  });
};

export const createFullCourse = async (
  prisma: PrismaClient,
  instructorId: number = 1
) => {
  const course = await createTestCourse(prisma, instructorId);
  const section = await createTestSection(prisma, course.id);
  const lesson = await createTestLesson(prisma, section.id);

  return { course, section, lesson };
}

export const mockCourse = (overrides?: Partial<any>) => ({
  id: 1,
  title: 'Mock Course',
  slug: 'mock-course',
  description: 'Mock description',
  thumbnail: null,
  price: 49.99,
  currency: 'USD',
  instructorId: 1,
  categoryId: null,
  level: CourseLevel.BEGINNER,
  status: CourseStatus.DRAFT,
  language: 'en',
  duration: 0,
  tags: [],
  requirements: [],
  objectives: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const mockCategory = (overrides?: Partial<any>) => ({
  id: 1,
  name: 'Mock Category',
  slug: 'mock-category',
  description: 'Mock description',
  icon: null,
  parentId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const mockSection = (overrides?: Partial<any>) => ({
  id: 1,
  courseId: 1,
  title: 'Mock Section',
  description: 'Mock description',
  order: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const mockEnrollment = (overrides?: Partial<any>) => ({
  id: 1,
  userId: 1,
  courseId: 1,
  status: 'ACTIVE' as const,
  progress: 0,
  completedAt: null,
  enrolledAt: new Date(),
  lastAccessedAt: null,
  ...overrides,
});
