// AlertCard Component
// Reusable alert component for displaying important notices and warnings

import React from 'react';
import { cn } from '../../utils/helpers';
import type { Alert } from '../../api/dashboard.api';

export interface AlertCardProps {
  alert: Alert;
  className?: string;
}

const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  className
}) => {
  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  const baseClasses = 'alert-card';
  const typeClasses = `alert-card-${alert.type}`;

  const classes = cn(
    baseClasses,
    typeClasses,
    className
  );

  const handleClick = () => {
    if (alert.actionUrl) {
      window.location.href = alert.actionUrl;
    }
  };

  return (
    <div 
      className={classes}
      onClick={handleClick}
      role={alert.actionUrl ? 'button' : 'alert'}
      tabIndex={alert.actionUrl ? 0 : undefined}
    >
      <div className="alert-card-content">
        <div className="alert-card-icon">
          {getAlertIcon(alert.type)}
        </div>
        <div className="alert-card-message">
          {alert.message}
          {alert.count !== undefined && alert.count > 0 && (
            <span className="alert-card-count">
              ({alert.count})
            </span>
          )}
        </div>
        {alert.actionUrl && (
          <div className="alert-card-action">
            →
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertCard;
