import { InstructorProfile, Role, User, UserProfile } from "@prisma/client";

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  bio?: string;
  dataOfBirth?: Date;
  phone?: string;
  country?: string;
  timezone?: string;
  language?: string;
}

export interface UpdateInstructorProfileRequest {
  expertise?: string[];
  experience?: string;
  education?: string;
  website?: string;
  linkedIn?: string;
  youtube?: string;
}

export interface UserWithRelations extends User {
  profile: UserProfile | null;
  instructorProfile: InstructorProfile | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}
