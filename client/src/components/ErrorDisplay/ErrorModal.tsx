// Error Modal Component
// Modal for critical errors that require user acknowledgment

import React from 'react';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  onAction?: () => void;
  actionText?: string;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  title = 'Error',
  message,
  onAction,
  actionText = 'OK',
}) => {
  if (!isOpen) return null;

  return (
    <div
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
        className="modal-error"
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
        <h2 className="modal-error-title" style={{ margin: '0 0 16px 0', fontSize: '1.25rem' }}>{title}</h2>
        <p className="modal-error-message" style={{ margin: '0 0 24px 0', lineHeight: '1.5' }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          {onAction && (
            <button
              onClick={() => {
                onAction();
                onClose();
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
};

// Hook for showing error modal
export const useErrorModal = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [modalProps, setModalProps] = React.useState<Omit<ErrorModalProps, 'isOpen' | 'onClose'>>({
    title: 'Error',
    message: '',
  });

  const showModal = (props: Omit<ErrorModalProps, 'isOpen' | 'onClose'>) => {
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
