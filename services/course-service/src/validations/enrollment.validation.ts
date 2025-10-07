import Joi from "joi"

export const createEnrollmentSchema = {
  body: Joi.object({
    courseId: Joi.number().integer().positive().required()
  })
}

export const updateEnrollmentSchema = {
  body: Joi.object({
    progress: Joi.number().min(0).max(100).optional(),
    status: Joi.string().valid("ACTIVE", "COMPLETED", "DROPPED").optional(),
    lastaccessedAt: Joi.date().optional()
  })
}

export const getEnrollmentsQuerySchema = {
  query: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    userId: Joi.number().integer().positive().optional(),
    courseId: Joi.number().integer().positive().optional(),
    status: Joi.string().valid("ACTIVE", "COMPLETED", "DROPPED").optional()
  })
}
