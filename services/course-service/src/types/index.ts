import { EnrollmentStatus } from "@prisma/client";
import { Category, Course, CourseStatus, Enrollment, Lesson, LessonType, Section } from "@prisma/client"
import { CourseLevel } from "@shared/types";

export interface CreateCourseRequest {
  title: string;
  description?: string;
  thumbnail?: string;
  price?: number;
  currency?: string;
  level?: CourseLevel;
  language?: string;
  tags?: string[];
  requirements?: string[];
  objectives?: string[];
}

export interface UpdateCourseRequest {
  title?: string;
  description?: string;
  thumbnail?: string;
  price?: number;
  currency?: string;
  level?: CourseLevel;
  language?: string;
  tags?: string[];
  requirements?: string[];
  objectives?: string[];
}

export interface CourseWithRelations extends Course {
  category: Category | null;
  sections: SectionWithLessons[];
  enrollments?: Enrollment[];
}

export interface CourseFilters {
  page?: number;
  limit?: number;
  search?: string;
  instructorId?: number;
  categoryId?: number;
  level?: CourseLevel;
  status?: CourseStatus;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  language?: string;
}

// Section Types
export interface CreateSectionRequest {
  courseId: number;
  title: string;
  description?: string;
  order?: number;
}

export interface UpdateSectionRequest {
  title?: string;
  description?: string;
  order?: number;
}

export interface SectionWithLessons extends Section {
  lessons: Lesson[];
}

// Lesson Types
export interface CreateLessonRequest {
  sectionId: number;
  title: string;
  description?: string;
  type?: LessonType;
  content?: string;
  duration?: number;
  order?: number;
  isFree?: boolean;
}

export interface UpdateLessonRequest {
  title?: string;
  description?: string;
  type?: LessonType;
  content?: string;
  duration?: number;
  order?: number;
  isFree?: boolean;
}

// Category Types
export interface CreateCategoryRequest {
  name: string;
  description?: string;
  icon?: string;
  parentId?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  icon?: string;
  parentId?: number;
}

export interface CategoryWithRelations extends Category {
  parent: Category | null;
  children: Category[];
  courses?: Course[];
}

export interface CategoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  parentId?: number;
}

// Enrollment Types
export interface CreateEnrollmentRequest {
  userId: number;
  courseId: number;
}

export interface UpdateEnrollmentRequest {
  progress?: number;
  status?: EnrollmentStatus;
  lastAccessedAt?: Date;
}

export interface EnrollmentFilters {
  page?: number;
  limit?: number;
  userId?: number;
  courseId?: number;
  status?: EnrollmentStatus;
}
