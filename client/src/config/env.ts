// Environment variables configuration
// Centralized access to all environment variables with type safety

interface EnvConfig {
  // API Configuration
  apiUrl: string;
  socketUrl: string;

  // External services
  agoraAppId: string;

  // Application settings
  isDevelopment: boolean;
  isProduction: boolean;
  nodeEnv: string;
}

// Get environment variables with fallbacks
const getEnvVar = (key: string, fallback: string = ''): string => {
  // For Vite, environment variables are available on import.meta.env
  // and must be prefixed with VITE_ or they won't be exposed to the browser
  const envVar = import.meta.env[key];

  if (envVar === undefined) {
    if (fallback) {
      console.warn(`Environment variable ${key} is not defined, using fallback: ${fallback}`);
      return fallback;
    }

    throw new Error(`Environment variable ${key} is required but not defined`);
  }

  return envVar;
};

// Export environment configuration
export const env: EnvConfig = {
  // API URLs from .env file
  apiUrl: getEnvVar('VITE_PUBLIC_API_URL', 'http://localhost:3000'),
  socketUrl: getEnvVar('VITE_PUBLIC_SOCKET_URL', 'http://localhost:3000'),

  // External services
  agoraAppId: getEnvVar('VITE_PUBLIC_AGORA_APP_ID', ''),

  // Application settings
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  nodeEnv: import.meta.env.MODE,
};

// Validate required environment variables
export const validateEnv = (): void => {
  const requiredVars: (keyof EnvConfig)[] = ['apiUrl', 'socketUrl'];
  const missingVars: string[] = [];

  requiredVars.forEach(varName => {
    if (!env[varName]) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Log environment configuration in development
  if (env.isDevelopment) {
    console.log('Environment configuration:', {
      apiUrl: env.apiUrl,
      socketUrl: env.socketUrl,
      agoraAppId: env.agoraAppId ? '***' : 'not set',
      nodeEnv: env.nodeEnv,
    });
  }
};

// Export individual environment variables for convenience
export const { apiUrl, socketUrl, agoraAppId, isDevelopment, isProduction, nodeEnv } = env;
