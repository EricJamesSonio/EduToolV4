// Unified Error Display Component
// Reusable component for all error types (toast, modal, inline)

import React from 'react';
import { toast } from 'sonner';
import type { AppError } from '../../utils/errorHandler';

// Toast error display component
export const ErrorToast: React.FC<{
  message: string;
}> = ({ message }) => {
  React.useEffect(() => {
    toast.error(message);
  }, [message]);
  return null;
};

// Modal error display component
export const ErrorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  onAction?: () => void;
  actionText?: string;
}> = ({ isOpen, onClose, title = 'Error', message, onAction, actionText = 'OK' }) => {
  if (!isOpen) return null;
}

// Modal errors
if (type === 'modal') {
  return (
    <div
      className="modal-error"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-error-title" style={{ margin: '0 0 16px 0', fontSize: '1.25rem' }}>
          {title || 'Error'}
        </h2>
        <p className="modal-error-message" style={{ margin: '0 0 24px 0', lineHeight: '1.5' }}>
          {message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          {onAction && (
            <button
              onClick={() => {
                onAction();
                onClose?.();
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              {actionText}
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#e5e7eb',
              color: '#1f2937',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Inline errors
if (type === 'inline') {
  return (
    <div className={`inline-error ${className}`}>
      {message}
    </div>
  );
}

return null;
};

// Convenience hooks for different error types
export const useErrorToast = () => {
  const showError = (error: AppError | string) => {
    const message = typeof error === 'string' ? error : error.userMessage;
    toast.error(message);
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
    <ErrorDisplay
      type="modal"
      onClose={closeModal}
      title={modalProps.title}
      message={modalProps.message}
      onAction={modalProps.onAction}
      actionText={modalProps.actionText}
    />
  );

  return { showModal, closeModal, ErrorModalComponent };
};
