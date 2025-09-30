export interface User {
  id: number;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  STUDENT = 'STUDENT',
  INSTRUCTOR = 'INSTRUCTOR',
  ADMIN = 'ADMIN'
}

export interface JwtPayload {
  id: number;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface ApiResponse<T = any> {
  status: "success" | "error";
  message: string;
  code: number;
  data?: T;
  stack?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface Course {
  id: number;
  title: string;
  description?: string;
  price: number;
  currency: string;
  instructorId: number;
  categoryId: number;
  level: CourseLevel;
  status: CourseStatus;
  metadata: Record<string, any>;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export enum CourseLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  ALL_LEVELS = 'ALL_LEVELS'
}

export enum CourseStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

export interface Video {
  id: number;
  courseId: number;
  title: string;
  description?: string;
  duration: number;
  order: number;
  videoUrl: string;
  metadata: Record<string, any>;
  isPreview: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceResponse<T = any> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Express augmentation
declare global {
  namespace Express {
    interface Response {
      success(data?: unknown, message?: string, code?: number): this;
    }
    interface Request {
      user?: User;
      id?: string;
    }
  }
}
