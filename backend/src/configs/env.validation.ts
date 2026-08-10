// src/configs/env.validation.ts
import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),

  PORT: Joi.number().default(3000),

  DATABASE_URL: Joi.string().required(),

  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),

  APP_NAME: Joi.string().default('EduTool'),

  // Comma-separated list of allowed CORS origins (e.g. https://app.onrender.com).
  CORS_ORIGIN: Joi.string().optional(),

  // Email is optional: if GMAIL_EMAIL / GMAIL_APP_PASSWORD are not set the app
  // boots and only email-dependent flows (OTP / credentials) will fail at send
  // time with a logged error.
  GMAIL_EMAIL: Joi.string().email().optional(),
  GMAIL_APP_PASSWORD: Joi.string().optional(),

  // Giphy (Groupy GIF search). Optional — if unset the app still boots and
  // GIF search returns a clear "not configured" error at request time.
  GIPHY_API_KEY: Joi.string().optional(),
});