import { Category, Course, CourseStatus, Enrollment, Lesson, Section } from "@prisma/client"
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
