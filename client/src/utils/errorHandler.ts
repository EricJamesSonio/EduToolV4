// Error Handler - Error types and error mapper
// Centralized error handling with user-friendly messages

export type ErrorType = 'NETWORK' | 'API' | 'VALIDATION' | 'AUTH' | 'PERMISSION' | 'SERVER' | 'UNKNOWN';

export const ErrorType: Record<ErrorType, ErrorType> = {
  NETWORK: 'NETWORK',
  API: 'API',
  VALIDATION: 'VALIDATION',
  AUTH: 'AUTH',
  PERMISSION: 'PERMISSION',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN',
};

export interface AppError {
  type: ErrorType;
  message: string;
  userMessage: string;
  statusCode?: number;
  originalError?: any;
  timestamp: Date;
}

// Error mapper: backend error → user-friendly message
export const getErrorMessage = (error: any): string => {
  // Network errors
  if (!navigator.onLine) {
    return 'You are offline. Please check your internet connection.';
  }

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return 'Request timed out. Please try again.';
  }

  if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
    return 'Network error. Please check your connection.';
  }

  // API errors with status codes
  if (error.response?.status) {
    const status = error.response.status;

    switch (status) {
      case 400:
        return error.response.data?.message || 'Invalid request. Please check your input.';
      case 401:
        return 'Session expired. Please log in again.';
      case 403:
        return "You don't have permission to perform this action.";
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return error.response.data?.message || 'This resource already exists.';
      case 422:
        return error.response.data?.message || 'Validation failed. Please check your input.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Something went wrong on our end. Please try again later.';
      case 502:
      case 503:
      case 504:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        if (status >= 400 && status < 500) {
          return 'Client error. Please check your request.';
        }
        if (status >= 500) {
          return 'Server error. Please try again later.';
        }
    }
  }

  // Fetch errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return 'Network error. Please check your connection.';
  }

  // Generic error messages
  if (error.message) {
    // Don't expose technical details
    const technicalMessages = [
      'SQL',
      'database',
      'internal',
      'stack trace',
      'undefined',
      'null',
    ];

    const hasTechnicalDetails = technicalMessages.some((msg) =>
      error.message.toLowerCase().includes(msg)
    );

    if (hasTechnicalDetails) {
      return 'Something went wrong. Please try again.';
    }

    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
};

// Get error type from error object
export const getErrorType = (error: any): ErrorType => {
  if (!navigator.onLine) {
    return ErrorType.NETWORK;
  }

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return ErrorType.NETWORK;
  }

  if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
    return ErrorType.NETWORK;
  }

  if (error.response?.status) {
    const status = error.response.status;

    if (status === 401) return ErrorType.AUTH;
    if (status === 403) return ErrorType.PERMISSION;
    if (status === 400 || status === 422 || status === 409) return ErrorType.VALIDATION;
    if (status >= 500) return ErrorType.SERVER;
    return ErrorType.API;
  }

  if (error instanceof TypeError) {
    return ErrorType.NETWORK;
  }

  return ErrorType.UNKNOWN;
};

// Create standardized AppError
export const createAppError = (error: any): AppError => {
  const errorType = getErrorType(error);
  const userMessage = getErrorMessage(error);

  return {
    type: errorType,
    message: error.message || 'Unknown error',
    userMessage,
    statusCode: error.response?.status,
    originalError: error,
    timestamp: new Date(),
  };
};

// Check if error is auth error (401)
export const isAuthError = (error: any): boolean => {
  return getErrorType(error) === ErrorType.AUTH;
};

// Check if error is permission error (403)
export const isPermissionError = (error: any): boolean => {
  return getErrorType(error) === ErrorType.PERMISSION;
};

// Check if error is network error
export const isNetworkError = (error: any): boolean => {
  return getErrorType(error) === ErrorType.NETWORK;
};

// Check if error is server error (5xx)
export const isServerError = (error: any): boolean => {
  return getErrorType(error) === ErrorType.SERVER;
};

// Check if error is validation error (400, 422, 409)
export const isValidationError = (error: any): boolean => {
  return getErrorType(error) === ErrorType.VALIDATION;
};
