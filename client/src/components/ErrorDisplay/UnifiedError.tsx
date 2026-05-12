// Unified Error Display Components
// Clean, reusable components for all error types

import React from 'react';
import { toast } from 'sonner';
import type { AppError } from '../../utils/errorHandler';

// Toast Error Component
export const ErrorToast: React.FC<{ message: string }> = ({ message }) => {
  toast.error(message);
  return null;
};

// Modal Error Component
export const ErrorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  onAction?: () => void;
  actionText?: string;
}> = ({ isOpen, onClose, title = 'Error', message, onAction, actionText = 'OK' }) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal-error"
      onClick={onClose}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with icon */}
        <div className="modal-header">
          <div className="modal-error-icon">
            <span>⚠️</span>
          </div>
          <div className="modal-header-content">
            <div>
              <h2 className="modal-error-title">
                {title}
              </h2>
              <p className="modal-error-subtitle">
                Something went wrong
              </p>
            </div>
          </div>
        </div>

        {/* Message content */}
        <div className="modal-body">
          <p className="modal-error-message">
            {message}
          </p>
        </div>

        {/* Action buttons */}
        <div className="modal-actions">
          {onAction && (
            <button
              onClick={() => {
                onAction();
                onClose();
              }}
              className="modal-error-action-btn"
            >
              {actionText}
            </button>
          )}
          <button
            onClick={onClose}
            className="modal-error-cancel-btn"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Inline Error Component
export const InlineError: React.FC<{
  message: string;
  className?: string;
}> = ({ message, className = '' }) => {
  if (!message) return null;

  return (
    <div className={`inline-error ${className}`}>
      {message}
    </div>
  );
};

// Error Modal Hook
export const useErrorModal = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [modalProps, setModalProps] = React.useState<{
    title?: string;
    message: string;
    onAction?: () => void;
    actionText?: string;
  }>({
    message: '',
  });

  const showModal = (props: typeof modalProps) => {
    setModalProps(props);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const ErrorModalComponent = () => (
    <ErrorModal
      isOpen={isOpen}
      onClose={closeModal}
      {...modalProps}
    />
  );

  return { showModal, closeModal, ErrorModalComponent };
};

// Error Toast Hook
export const useErrorToast = () => {
  const showError = (error: AppError | string) => {
    const message = typeof error === 'string' ? error : error.userMessage;
    toast.error(message, {
      className: 'toast-error',
    });
  };

  const showSuccess = (message: string) => {
    toast.success(message);
  };

  const showInfo = (message: string) => {
    toast.info(message);
  };

  const showWarning = (message: string) => {
    toast.warning(message);
  };

  return { showError, showSuccess, showInfo, showWarning };
};
