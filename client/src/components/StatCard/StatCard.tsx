// StatCard Component
// Reusable card component for displaying statistics with counters

import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/helpers';

export interface StatCardProps {
  label: string;
  value: number;
  icon?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning';
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  color = 'primary',
  className
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const duration = 2000; // 2 seconds animation
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  const baseClasses = 'stat-card';
  const colorClasses = `stat-card-${color}`;

  const classes = cn(
    baseClasses,
    colorClasses,
    className
  );

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M+';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K+';
    }
    return num.toString();
  };

  return (
    <div className={classes}>
      <div className="stat-card-content">
        {icon && (
          <div className="stat-card-icon">
            {icon}
          </div>
        )}
        <div className="stat-card-value">
          <span className={`stat-number ${isAnimating ? 'animate' : ''}`}>
            {formatNumber(displayValue)}
          </span>
        </div>
        <div className="stat-card-label">
          {label}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
