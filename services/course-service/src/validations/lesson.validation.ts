import Joi from "joi";

export const createLessonSchema = {
  body: Joi.object({
    sectionId: Joi.number().integer().positive().required(),
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().max(1000).optional(),
    type: Joi.string().valid("VIDEO", "ARTICLE", "QUIZ", "ASSETMENT", "RESOURCE").default("VIDEO"),
    content: Joi.string().max(1000).optional(),
    duration: Joi.number().integer().min(0).default(0),
    order: Joi.number().integer().min(0).optional(),
    isFree: Joi.boolean().default(false)
  })
};

export const updateLessonSchema = {
  body: Joi.object({
    title: Joi.string().min(3).max(200).optional(),
    description: Joi.string().max(1000).optional(),
    type: Joi.string().valid("VIDEO", "ARTICLE", "QUIZ", "ASSETMENT", "RESOURCE").default("VIDEO"),
    content: Joi.string().max(1000).optional(),
    duration: Joi.number().integer().min(0).default(0),
    order: Joi.number().integer().min(0).optional(),
    isFree: Joi.boolean().optional()
  })
}

export const reorderLessonSchema = {
  body: Joi.object({
    lessonIds: Joi.array().items(Joi.number().integer().positive()).min(1).required()
  })
}
