import { notify } from "@/lib/toast";

/**
 * Standardized error handling utilities for React Query hooks
 */

export interface ApiError {
  response?: {
    data?: {
      message?: string;
      errors?: Record<string, string[]>;
    };
    status?: number;
  };
  message?: string;
}

const TECHNICAL_PATTERN =
  /(\bat\s+\S+\s*\(|stack|exception|status code|ECONN|ETIMEDOUT|axios|prisma|sql|typeerror|referenceerror|node_modules|undefined)/i;

function pickMessage(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

function isSafeMessage(message: string): boolean {
  return (
    message.length > 0 &&
    message.length <= 300 &&
    !TECHNICAL_PATTERN.test(message)
  );
}

/**
 * Extracts the most relevant user-safe error message from an API error.
 * Technical or internal messages are never returned.
 */
export function getErrorMessage(error: unknown): string {
  const apiError = error as ApiError;

  const fromResponse = pickMessage(apiError?.response?.data?.message);
  if (fromResponse && isSafeMessage(fromResponse)) {
    return fromResponse;
  }

  const errors = apiError?.response?.data?.errors;
  if (errors) {
    const firstError = Object.values(errors)[0];
    if (firstError && firstError.length > 0 && isSafeMessage(firstError[0])) {
      return firstError[0];
    }
  }

  if (apiError?.message && isSafeMessage(apiError.message)) {
    return apiError.message;
  }

  return "An unexpected error occurred";
}

/**
 * Standard success message handlers
 */
export const SUCCESS_MESSAGES = {
  create: (entity: string) => `${entity} created successfully`,
  update: (entity: string) => `${entity} updated successfully`,
  delete: (entity: string) => `${entity} deleted successfully`,
  archive: (entity: string) => `${entity} archived successfully`,
  restore: (entity: string) => `${entity} restored successfully`,
  enroll: () => "Student enrolled successfully",
  unenroll: () => "Student removed successfully",
  resetPassword: () => "Password reset successfully",
  bulkImport: (count: number) => `Successfully imported ${count} items`,
  generic: () => "Operation completed successfully",
} as const;

/**
 * Standard error message handlers
 */
export const ERROR_MESSAGES = {
  create: (entity: string) => `Failed to create ${entity}`,
  update: (entity: string) => `Failed to update ${entity}`,
  delete: (entity: string) => `Failed to delete ${entity}`,
  archive: (entity: string) => `Failed to archive ${entity}`,
  restore: (entity: string) => `Failed to restore ${entity}`,
  enroll: () => "Failed to enroll student",
  unenroll: () => "Failed to remove student",
  resetPassword: () => "Failed to reset password",
  bulkImport: () => "Failed to import data",
  network: () => "Network error. Please check your connection",
  unauthorized: () => "You are not authorized to perform this action",
  forbidden: () => "You don't have permission to perform this action",
  notFound: () => "The requested resource was not found",
  server: () => "Server error. Please try again later",
  generic: () => "Something went wrong. Please try again",
} as const;

/**
 * Shows appropriate error toast based on error status
 */
export function showErrorToast(error: unknown, fallbackMessage?: string) {
  const apiError = error as ApiError;
  const status = apiError?.response?.status;

  let message = fallbackMessage || ERROR_MESSAGES.generic();

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    notify.error(ERROR_MESSAGES.network());
    return;
  }

  switch (status) {
    case 400:
      message = getErrorMessage(error);
      break;
    case 401:
      message = ERROR_MESSAGES.unauthorized();
      break;
    case 403:
      message = ERROR_MESSAGES.forbidden();
      break;
    case 404:
      message = ERROR_MESSAGES.notFound();
      break;
    case 409:
      message = getErrorMessage(error);
      break;
    case 422:
      message = getErrorMessage(error);
      break;
    case 429:
      message = "Too many requests. Please try again later";
      break;
    case 500:
    case 502:
    case 503:
    case 504:
      message = ERROR_MESSAGES.server();
      break;
    default:
      if (apiError?.message?.includes("Network Error")) {
        message = ERROR_MESSAGES.network();
      } else {
        message = getErrorMessage(error);
      }
  }

  notify.error(message);
}

/**
 * Shows success toast with standardized messages
 */
export function showSuccessToast(
  operation: keyof typeof SUCCESS_MESSAGES,
  entity?: string,
  count?: number
) {
  let message: string;

  if (operation === "bulkImport" && count !== undefined) {
    message = SUCCESS_MESSAGES.bulkImport(count);
  } else if (entity) {
    const messageFn = SUCCESS_MESSAGES[operation] as (entity: string) => string;
    message = messageFn(entity);
  } else {
    message = SUCCESS_MESSAGES.generic();
  }

  notify.success(message);
}

/**
 * Shows warning toast for special cases
 */
export function showWarningToast(message: string) {
  notify.warning(message);
}

/**
 * Shows info toast for neutral status updates
 */
export function showInfoToast(message: string) {
  notify.info(message);
}

/**
 * Standard mutation callbacks for common operations
 */
export function createMutationCallbacks<T = any>(options: {
  entity?: string;
  operation: keyof typeof SUCCESS_MESSAGES;
  onSuccess?: (data: T) => void;
  onError?: (error: unknown) => void;
  invalidateQueries?: () => void;
}) {
  return {
    onSuccess: (data: T) => {
      showSuccessToast(options.operation, options.entity);
      options.onSuccess?.(data);
      options.invalidateQueries?.();
    },
    onError: (error: unknown) => {
      const errorFn = ERROR_MESSAGES[options.operation] as (entity: string) => string;
      showErrorToast(error, errorFn(options.entity || "item"));
      options.onError?.(error);
    },
  };
}

/**
 * Type-safe mutation options for React Query
 */
export interface MutationOptions<TData = unknown, TError = Error, TVariables = void> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
  onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables) => void;
  entity?: string;
  operation?: keyof typeof SUCCESS_MESSAGES;
  silent?: boolean;
}

/**
 * Creates standardized mutation options with error handling
 */
export function createStandardMutationOptions<TData = unknown, TError = Error, TVariables = void>(
  options: MutationOptions<TData, TError, TVariables> = {}
) {
  return {
    onSuccess: (data: TData) => {
      if (!options.silent && options.operation && options.entity) {
        showSuccessToast(options.operation, options.entity);
      }
      options.onSuccess?.(data);
    },
    onError: (error: TError) => {
      if (!options.silent) {
        if (options.operation && options.entity) {
          const errorFn = ERROR_MESSAGES[options.operation] as (entity: string) => string;
          showErrorToast(error, errorFn(options.entity));
        } else {
          showErrorToast(error);
        }
      }
      options.onError?.(error);
    },
    onSettled: options.onSettled,
  };
}