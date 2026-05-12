// Base Card Component
// Reusable card component with consistent styling

import React from 'react';

interface BaseCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

const BaseCard: React.FC<BaseCardProps> = ({ 
  children, 
  className = '', 
  onClick,
  hover = true 
}) => {
  const cardClasses = `card ${className}${hover ? ' hover-effect' : ''}`;

  return (
    <div 
      className={cardClasses}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default BaseCard;
