// Button Component
// Unified button component with consistent styling across the application

import React from 'react';
import { cn } from '../../utils/helpers';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  iconPosition = 'left',
  children,
  className,
  disabled,
  ...props
}) => {
  const baseClasses = 'btn';
  const variantClasses = `btn-${variant}`;
  const sizeClasses = size === 'md' ? '' : `btn-${size}`;
  const widthClasses = fullWidth ? 'btn-full' : '';
  const loadingClasses = loading ? 'btn-loading' : '';
  const iconClasses = icon ? 'btn-icon' : '';

  const classes = cn(
    baseClasses,
    variantClasses,
    sizeClasses,
    widthClasses,
    loadingClasses,
    iconClasses,
    className
  );

  const iconElement = icon && (
    <span className={`icon icon-${iconPosition}`}>
      {icon}
    </span>
  );

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {iconPosition === 'left' && iconElement}
      {children}
      {iconPosition === 'right' && iconElement}
    </button>
  );
};

export default Button;
