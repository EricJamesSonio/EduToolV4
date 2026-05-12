// Inline Error Component
// Displays inline error messages for forms and inputs

import React from 'react';

interface InlineErrorProps {
  message: string;
  className?: string;
}

export const InlineError: React.FC<InlineErrorProps> = ({ message, className = '' }) => {
  if (!message) return null;

  return (
    <div className={`inline-error ${className}`}>
      {message}
    </div>
  );
};

interface FormFieldErrorProps {
  errors?: Record<string, string>;
  fieldName: string;
  className?: string;
}

export const FormFieldError: React.FC<FormFieldErrorProps> = ({ errors, fieldName, className = '' }) => {
  const errorMessage = errors?.[fieldName];

  if (!errorMessage) return null;

  return <InlineError message={errorMessage} className={className} />;
};
