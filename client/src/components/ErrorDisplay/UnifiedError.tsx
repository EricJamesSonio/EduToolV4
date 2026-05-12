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
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '48px',
          maxWidth: '520px',
          width: '94%',
          boxShadow: '0 30px 60px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          transform: 'scale(1)',
          animation: 'slideUp 0.4s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with icon */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '32px',
          paddingBottom: '20px',
          borderBottom: '1px solid var(--color-error-100)',
        }}>
          <div
            className="modal-error-icon"
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              backgroundColor: 'var(--color-error-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '20px',
              flexShrink: '0',
              boxShadow: '0 6px 16px rgba(239, 68, 68, 0.4)',
            }}
          >
            <span style={{
              fontSize: '28px',
              color: 'white',
              fontWeight: 'bold',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}>⚠️</span>
          </div>
          <div style={{ flex: 1 }}>
            <div>
              <h2
                className="modal-error-title"
                style={{
                  margin: 0,
                  fontSize: '1.75rem',
                  fontWeight: '700',
                  color: 'var(--color-error-700)',
                  lineHeight: '1.3',
                  letterSpacing: '-0.02em',
                }}
              >
                {title}
              </h2>
              <p
                className="modal-error-subtitle"
                style={{
                  margin: '8px 0 0 0',
                  fontSize: '1rem',
                  color: 'var(--color-error-500)',
                  fontWeight: '500',
                  opacity: 0.9,
                }}
              >
                Something went wrong
              </p>
            </div>
          </div>
        </div>

        {/* Message content */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <p
            className="modal-error-message"
            style={{
              margin: 0,
              lineHeight: '1.7',
              color: 'var(--color-text-secondary)',
              fontSize: '1.125rem',
              textAlign: 'left',
            }}
          >
            {message}
          </p>
        </div>

        {/* Action buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
          paddingTop: '32px',
          borderTop: '1px solid var(--color-error-100)',
        }}>
          {onAction && (
            <button
              onClick={() => {
                onAction();
                onClose();
              }}
              className="modal-error-action-btn"
              style={{
                padding: '16px 32px',
                backgroundColor: 'var(--color-error-500)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '1.125rem',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                boxShadow: '0 6px 16px rgba(239, 68, 68, 0.3)',
                minWidth: '120px',
                letterSpacing: '0.01em',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(239, 68, 68, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.3)';
              }}
            >
              {actionText}
            </button>
          )}
          <button
            onClick={onClose}
            className="modal-error-cancel-btn"
            style={{
              padding: '16px 32px',
              backgroundColor: 'transparent',
              color: 'var(--color-text-secondary)',
              border: '2px solid var(--color-border-primary)',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '1.125rem',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              minWidth: '120px',
              letterSpacing: '0.01em',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
              e.currentTarget.style.borderColor = 'var(--color-border-secondary)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'var(--color-border-primary)';
            }}
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
