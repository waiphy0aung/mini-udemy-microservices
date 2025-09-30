import Joi from "joi";

export const registerSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    // Limit public registration roles; default to STUDENT
    role: Joi.string()
      .valid('STUDENT', 'INSTRUCTOR')
      .default('STUDENT'),
    firstName: Joi.string().required(),
    lastName: Joi.string().required()
  })
}

export const loginSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  })
}
