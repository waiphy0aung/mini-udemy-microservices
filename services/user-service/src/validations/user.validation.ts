import Joi from "joi";

export const updateProfileSchema = {
  body: Joi.object({
    firstName: Joi.string().min(1).max(50).optional(),
    lastName: Joi.string().min(1).max(50).optional(),
    bio: Joi.string().max(1000).optional(),
    dateOfBirth: Joi.date().max('now').optional(),
    phone: Joi.string().pattern(/^[+]?[0-9\s\-()]+$/).optional(),
    country: Joi.string().min(2).max(50).optional(),
    timezone: Joi.string().optional(),
    language: Joi.string().min(2).max(10).optional()
  })
};

export const updateInstructorProfileSchema = {
  body: Joi.object({
    expertise: Joi.array().items(Joi.string().min(1).max(50)).max(10).optional(),
    experience: Joi.string().max(2000).optional(),
    education: Joi.string().max(1000).optional(),
    website: Joi.string().uri().optional(),
    linkedIn: Joi.string().uri().optional(),
    youtube: Joi.string().uri().optional()
  })
};

export const changePasswordSchema = {
  body: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required()
  })
};

export const forgotPasswordSchema = {
  body: Joi.object({
    email: Joi.string().email().required()
  })
};

export const resetPasswordSchema = {
  body: Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().min(8).required()
  })
};

export const getUsersQuerySchema = {
  query: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    role: Joi.string().valid('STUDENT', 'INSTRUCTOR', 'ADMIN').optional(),
    search: Joi.string().max(100).optional(),
    isActive: Joi.boolean().optional()
  })
};

export const getInstructorsQuerySchema = {
  query: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    isApproved: Joi.boolean().optional(),
    expertise: Joi.string().max(50).optional()
  })
};
