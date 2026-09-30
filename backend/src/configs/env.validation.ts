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

  // Express `trust proxy`. Optional — when unset this resolves to 1 in
  // production and false elsewhere (see core/config/trust-proxy.util.ts).
  // Accepted values:
  //   - a non-negative integer  -> hop count, e.g. 1
  //   - "true" / "false"        -> trust (or ignore) all proxies
  //   - anything else           -> comma-separated IP/subnet list,
  //                                e.g. "10.0.0.1,192.168.0.0/16"
  // The hop count MUST match the real proxy chain. Too low and every user
  // shares one rate-limit bucket; too high and a client can spoof
  // X-Forwarded-For to evade limits. Not verified for Render — confirm with
  // TRUST_PROXY_DEBUG after deploy.
  TRUST_PROXY: Joi.string().optional(),

  // When true, log req.ip and X-Forwarded-For once on the first HTTP request
  // so the TRUST_PROXY value can be verified against the real proxy chain.
  // Temporary diagnostic — leave unset/false in production.
  TRUST_PROXY_DEBUG: Joi.string().optional(),

  // Email is optional: if GMAIL_EMAIL / GMAIL_APP_PASSWORD are not set the app
  // boots and only email-dependent flows (OTP / credentials) will fail at send
  // time with a logged error.
  GMAIL_EMAIL: Joi.string().email().optional(),
  GMAIL_APP_PASSWORD: Joi.string().optional(),

  // Giphy (Groupy GIF search). Optional — if unset the app still boots and
  // GIF search returns a clear "not configured" error at request time.
  GIPHY_API_KEY: Joi.string().optional(),
});
