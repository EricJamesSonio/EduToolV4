// src/configs/env.validation.ts
import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),

  PORT: Joi.number().default(3000),

  DATABASE_URL: Joi.string().required(),

  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),

  APP_NAME: Joi.string().default('EduTool'),

  GMAIL_EMAIL: Joi.string().email().required(),
  GMAIL_APP_PASSWORD: Joi.string().required(),
});