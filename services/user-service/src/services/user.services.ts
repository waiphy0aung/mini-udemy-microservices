import { InstructorProfile, User, UserProfile } from "@prisma/client"
import prisma from "../db/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { ChangePasswordRequest, RegisterRequest, UpdateInstructorProfileRequest, UpdateProfileRequest, UserWithRelations } from "../types";
import { ApiError } from "@shared";
import { parse } from "path";


export const createUser = async (payload: RegisterRequest): Promise<UserWithRelations> => {
  const { email, password, role, firstName, lastName } = payload;

  const normalizeEmail = email.toLowerCase().trim()

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizeEmail }
  })

  if (existingUser) {
    throw ApiError.badRequest("User already exists with this email")
  }

  const hashedPassword = await bcrypt.hash(password, 12)
  const assignedRole = role === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT';

  const user = await prisma.user.create({
    data: {
      email: normalizeEmail,
      password: hashedPassword,
      role: assignedRole,
      profile: {
        create: {
          firstName,
          lastName
        }
      },
      ...(assignedRole === "INSTRUCTOR" && {
        instructorProfile: {
          create: {
            expertise: []
          }
        }
      })
    },
    include: {
      profile: true,
      instructorProfile: true
    }
  });

  return user;
}

export const getUserById = async (id: number): Promise<UserWithRelations | null> => {
  return await prisma.user.findUnique({
    where: { id, isActive: true },
    include: {
      profile: true,
      instructorProfile: true
    }
  })
}

export const getUserByEmail = async (email: string): Promise<UserWithRelations | null> => {
  const normalizeEmail = email.toLowerCase().trim()
  return await prisma.user.findUnique({
    where: {
      email: normalizeEmail,
      isActive: true
    },
    include: {
      profile: true,
      instructorProfile: true
    }
  })
}

export const getAllUsers = async (filters: {
  page?: number;
  limit?: number;
  role?: string;
  isActive?: boolean;
  search?: string;
}) => {
  const { page = 1, limit = 10, role, isActive = true, search } = filters
  const skip = (page - 1) * limit;

  const where: any = { isActive };

  if (role) where.role = role;

  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { profile: { firstName: { contains: search, mode: "insensitive" } } },
      { profile: { lastName: { contains: search, mode: "insensitive" } } }
    ]
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        profile: true,
        instructorProfile: true
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
  ])

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }
}

export const updateUserProfile = async (
  userId: number,
  data: UpdateProfileRequest
): Promise<UserProfile> => {
  const user = await getUserById(userId)
  if (!user) throw ApiError.notFound("User not found");

  return await prisma.userProfile.upsert({
    where: { userId },
    create: {
      userId,
      ...data
    },
    update: data
  })
}

export const updateInstructorProfile = async (
  userId: number,
  data: UpdateInstructorProfileRequest
): Promise<InstructorProfile> => {
  const user = await getUserById(userId);
  if (!user) throw ApiError.notFound("User not found");
  if (user?.role !== "INSTRUCTOR") throw ApiError.forbidden("Only instructors can update instructor profile")

  return await prisma.instructorProfile.upsert({
    where: { userId },
    create: {
      userId,
      ...data,
      expertise: data.expertise || []
    },
    update: data
  })
}

// Password Management
export const changePassword = async (
  userId: number,
  { currentPassword, newPassword }: ChangePasswordRequest
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId, isActive: true }
  })

  if (!user) throw ApiError.notFound("User not found");

  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
  if (!isCurrentPasswordValid) throw ApiError.badRequest('Current password is incorrect');

  const hashedPassword = await bcrypt.hash(newPassword.trim(), 12)
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });
}

// Account Management
export const deactivateUser = async (userId: number): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false }
  })
}

export const reactivateUser = async (userId: number): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: true }
  })
}

export const verifyUser = async (userId: number): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data: { isVerified: true }
  })
}

// Instructor Management
export const approveInstructor = async (userId: number): Promise<void> => {
  const user = await getUserById(userId)
  if (!user) throw ApiError.notFound("User not found");
  if (user.role !== "INSTRUCTOR") throw ApiError.forbidden("User is not an instructor");

  await prisma.instructorProfile.upsert({
    where: { userId },
    create: {
      userId,
      isApproved: true,
      expertise: []
    },
    update: { isApproved: true }
  })
}

export const getAllInstructors = async (filters: {
  page?: number;
  limit?: number;
  isApproved?: boolean;
  expertise?: string;
}) => {
  const { page = 1, limit = 10, isApproved, expertise } = filters
  const skip = (page - 1) * limit;

  const where: any = {
    user: { isActive: true, role: "INSTRUCTOR" }
  }

  if (typeof isApproved === "boolean") {
    where.isApproved = isApproved
  }

  if (expertise) {
    where.expertise = {
      has: expertise
    }
  }

  const [instructors, total] = await Promise.all([
    prisma.instructorProfile.findMany({
      where,
      include: {
        user: {
          include: { profile: true }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" }
    }),
    prisma.instructorProfile.count({ where })
  ]);

  return {
    instructors,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

// Utility Functions
export const safeUser = (user: UserWithRelations): Omit<UserWithRelations, 'password'> => {
  const { password, ...safeUser } = user;
  return safeUser;
};

export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const hashResetToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Password Reset
export const createPasswordRefreshToken = async (email: string): Promise<string> => {
  const user = await getUserByEmail(email);
  if (!user) throw ApiError.notFound("User not found");

  await prisma.passwordReset.deleteMany({
    where: { userId: user.id }
  })

  const resetToken = generateResetToken()
  const hashedToken = hashResetToken(resetToken)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token: hashedToken,
      expiresAt
    }
  })

  return resetToken;
}

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  const hashedToken = hashResetToken(token);

  const resetRecord = await prisma.passwordReset.findUnique({
    where: { token: hashedToken },
    include: { user: true }
  })

  if (!resetRecord || resetRecord.used || resetRecord.expiresAt < new Date()) {
    throw ApiError.badRequest("Invalid or expired reset token");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetRecord.userId },
      data: { password: hashedPassword }
    }),
    prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { used: true }
    })
  ])
}
