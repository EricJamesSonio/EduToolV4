// TestimonialCard Component
// Reusable card component for displaying user testimonials (image and info only)

import React from 'react';
import { cn } from '../../utils/helpers';

export interface TestimonialCardProps {
  author: string;
  role: string;
  school: string;
  avatar?: string;
  className?: string;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({
  author,
  role,
  school,
  avatar,
  className
}) => {
  const baseClasses = 'testimonial-card';

  const classes = cn(
    baseClasses,
    className
  );

  return (
    <div className={classes}>
      <div className="testimonial-card-content">
        <div className="testimonial-author">
          {avatar && (
            <div className="testimonial-avatar">
              <img
                src={avatar}
                alt={author}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '👤';
                    parent.style.fontSize = '2rem';
                    parent.style.display = 'flex';
                    parent.style.alignItems = 'center';
                    parent.style.justifyContent = 'center';
                  }
                }}
              />
            </div>
          )}
          <div className="testimonial-info">
            <div className="testimonial-name">{author}</div>
            <div className="testimonial-role">{role}</div>
            <div className="testimonial-school">{school}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestimonialCard;
