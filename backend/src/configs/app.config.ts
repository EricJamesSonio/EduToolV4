// src/configs/app.config.ts
export default () => ({
  app: {
    name: process.env.APP_NAME || 'EduTool',
    port: parseInt(process.env.PORT || '5000', 10),
    env: process.env.NODE_ENV || 'development',
  },
});
