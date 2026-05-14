import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  className = '',
}) => {
  const classes = ['empty-state', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <div className="empty-state-content">
        <h3 className="empty-state-title">{title}</h3>
        {description && <p className="empty-state-text">{description}</p>}
        {action && <div className="empty-state-action">{action}</div>}
      </div>
    </div>
  );
};

export default EmptyState;
