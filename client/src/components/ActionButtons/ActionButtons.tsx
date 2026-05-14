// ActionButtons Component
// Reusable Edit and Delete action buttons for lists and cards

import React from 'react';

interface ActionButtonsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  viewLabel?: string;
  editLabel?: string;
  deleteLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact';
  disabled?: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onView,
  onEdit,
  onDelete,
  viewLabel = 'View',
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  size = 'md',
  variant = 'default',
  disabled = false,
}) => {
  return (
    <div className={`action-buttons action-buttons-${variant} action-buttons-${size}`}>
      {onView && (
        <button
          type="button"
          className="action-button action-button-view"
          onClick={onView}
          disabled={disabled}
          aria-label={viewLabel}
        >
          {viewLabel}
        </button>
      )}

      {onEdit && (
        <button
          type="button"
          className="action-button action-button-edit"
          onClick={onEdit}
          disabled={disabled}
          aria-label={editLabel}
        >
          {editLabel}
        </button>
      )}

      {onDelete && (
        <button
          type="button"
          className="action-button action-button-delete"
          onClick={onDelete}
          disabled={disabled}
          aria-label={deleteLabel}
        >
          {deleteLabel}
        </button>
      )}
    </div>
  );
};

export default ActionButtons;
