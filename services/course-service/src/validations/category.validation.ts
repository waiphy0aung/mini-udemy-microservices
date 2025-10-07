import Joi from "joi"

export const createCategorySchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).optional(),
    icon: Joi.string().max(50).optional(),
    parentId: Joi.number().integer().positive().allow(null).optional()
  })
}

export const updateCategorySchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    description: Joi.string().max(500).optional(),
    icon: Joi.string().max(50).optional(),
    parentId: Joi.number().integer().positive().allow(null).optional()
  })
}

export const getCategoriesQuerySchema = {
  query: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(50),
    search: Joi.string().max(100).optional(),
    parentId: Joi.number().integer().positive().optional()
  })
}
