// Toast Error Component
// Wrapper for toast error notifications using sonner

import { toast } from 'sonner';
import type { AppError } from '../../utils/errorHandler';

export const showErrorToast = (error: AppError | string) => {
  const message = typeof error === 'string' ? error : error.userMessage;
  toast.error(message);
};

export const showSuccessToast = (message: string) => {
  toast.success(message);
};

export const showInfoToast = (message: string) => {
  toast.info(message);
};

export const showWarningToast = (message: string) => {
  toast.warning(message);
};
