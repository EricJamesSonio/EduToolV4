// FeatureCard Component
// Reusable card component for displaying features with image, title, and description

import React from 'react';
import { cn } from '@/utils/helpers';

export interface FeatureCardProps {
  image?: string;
  title: string;
  description: string;
  variant?: 'default' | 'compact';
  className?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  image,
  title,
  description,
  variant = 'default',
  className
}) => {
  const baseClasses = 'feature-card';
  const variantClasses = `feature-card-${variant}`;

  const classes = cn(
    baseClasses,
    variantClasses,
    className
  );

  return (
    <div className={classes}>
      {image && (
        <div className="feature-card-image">
          <img
            src={image}
            alt={title}
            loading="lazy"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = '🎓';
                parent.style.fontSize = '2.5rem';
                parent.style.display = 'flex';
                parent.style.alignItems = 'center';
                parent.style.justifyContent = 'center';
              }
            }}
          />
        </div>
      )}
      <div className="feature-card-content">
        <h3 className="feature-card-title">{title}</h3>
        <p className="feature-card-description">{description}</p>
      </div>
    </div>
  );
};

export default FeatureCard;
