import Joi from "joi"

export const createSectionSchema = {
  body: Joi.object({
    courseId: Joi.number().integer().positive().required(),
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().max(1000).optional(),
    order: Joi.number().integer().min(0).optional()
  })
}

export const updateSectionSchema = {
  body: Joi.object({
    title: Joi.string().min(3).max(200).optional(),
    description: Joi.string().max(1000).optional(),
    order: Joi.number().integer().min(0).optional()
  })
}

export const reorderSectionSchema = {
  body: Joi.object({
    sectionIds: Joi.array().items(Joi.number().integer().positive()).min(1).required()
  })
}
