const Joi = require('joi');

const signUpSchema = Joi.object({
  name: Joi.string().trim().min(2).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().trim().allow('').optional(),
  city: Joi.string().trim().allow('').optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(6).required(),
});

const verifyEmailSchema = Joi.object({
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).optional(),
  phone: Joi.string().trim().allow('').optional(),
  city: Joi.string().trim().allow('').optional(),
  profileImage: Joi.string().trim().uri().allow('').optional(),
}).min(1);

const recordTestResultSchema = Joi.object({
  correctAnswers: Joi.number().integer().min(0).required(),
  incorrectAnswers: Joi.number().integer().min(0).required(),
  score: Joi.number().min(0).max(100).required(),
  totalQuestions: Joi.number().integer().min(1).optional(),
  unattempted: Joi.number().integer().min(0).optional(),
  subject: Joi.string().trim().allow('').optional(),
  source: Joi.string().valid('practice', 'mock').optional(),
});

module.exports = {
  signUpSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  updateProfileSchema,
  recordTestResultSchema,
};
