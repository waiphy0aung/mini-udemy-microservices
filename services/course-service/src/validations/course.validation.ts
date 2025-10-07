import Joi from "joi";

export const createCourseSchema = {
  body: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().max(5000).optional(),
    thumbnail: Joi.string().uri().optional(),
    price: Joi.number().min(0).default(0),
    currency: Joi.string().length(3).uppercase().default("USD"),
    categoryId: Joi.number().integer().positive().optional(),
    level: Joi.string().valid("BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS").optional(),
    language: Joi.string().min(2).max(10).default("en"),
    tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
    requirements: Joi.array().items(Joi.string().max(200)).max(20).optional(),
    objectives: Joi.array().items(Joi.string().max(200)).max(20).optional()
  })
}

export const updateCourseSchema = {
  body: Joi.object({
    title: Joi.string().min(3).max(200).optional(),
    description: Joi.string().max(5000).optional(),
    thumbnail: Joi.string().uri().optional(),
    price: Joi.number().min(0).optional(),
    currency: Joi.string().length(3).uppercase().optional(),
    categoryId: Joi.number().integer().positive().allow(null).optional(),
    level: Joi.string().valid("BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS").optional(),
    status: Joi.string().valid("DRAFT", "PUBLISHED", "ARCHIVED").optional(),
    language: Joi.string().min(2).max(10).optional(),
    tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
    requirements: Joi.array().items(Joi.string().max(200)).max(20).optional(),
    objectives: Joi.array().items(Joi.string().max(200)).max(20).optional(),
  }),
};

export const getCoursesQuerySchema = {
  query: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    search: Joi.string().max(100).optional(),
    categoryId: Joi.number().integer().positive().optional(),
    level: Joi.string().valid("BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS").optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    tags: Joi.string().optional(),
    language: Joi.string().min(2).max(10).optional(),
    status: Joi.string().valid("DRAFT", "PUBLISHED", "ARCHIVED").optional()
  })
}
