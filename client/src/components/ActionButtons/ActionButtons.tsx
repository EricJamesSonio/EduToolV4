// ActionButtons Component
// Reusable Edit and Delete action buttons for lists and cards

import React from 'react';

interface ActionButtonsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  editLabel?: string;
  deleteLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact';
  disabled?: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onEdit,
  onDelete,
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  size = 'md',
  variant = 'default',
  disabled = false,
}) => {
  return (
    <div className={`action-buttons action-buttons-${variant} action-buttons-${size}`}>
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
