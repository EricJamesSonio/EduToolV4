// src/configs/jwt.config.ts
export default () => ({
  jwt: {
    secret: process.env.JWT_SECRET || 'supersecret',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
});