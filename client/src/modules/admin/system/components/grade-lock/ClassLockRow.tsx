// client/src/modules/admin/system/components/grade-lock/ClassLockRow.tsx

import { toast } from 'sonner';
import { useLockClass } from '../../hooks/useGradeLock';
import type { GradeLock, GradeLockSetting } from '../../types/grade-lock.types';

export type ClassLockAction =
  | { type: 'assign';   lock: GradeLock }
  | { type: 'unlock';   lock: GradeLock }
  | { type: 'override'; lock: GradeLock }
  | { type: 'history';  lock: GradeLock };

const STATUS_MAP = {
  locked:      { label: '🔒 Locked',      cls: 'locked-badge' },
  auto_locked: { label: '🔒 Auto-Locked', cls: 'locked-badge locked-badge-auto' },
  unlocked:    { label: '🔓 Unlocked',    cls: 'scale-stat' },
} as const;

interface Props {
  lock: GradeLock;
  settings: GradeLockSetting[];
  onAction: (action: ClassLockAction) => void;
}

const ClassLockRow: React.FC<Props> = ({ lock, onAction }) => {
  const lockMutation = useLockClass();

  const handleLock = async () => {
    try {
      await lockMutation.mutateAsync({ classId: lock.class_id });
      toast.success('Class locked.');
    } catch { /* handled by apiClient */ }
  };

  const { label, cls } = STATUS_MAP[lock.lockStatus];

  return (
    <div className="class-lock-row">
      <div className="class-lock-info">
        <span className="class-lock-name">{lock.className}</span>
        <span className="class-lock-educator">{lock.educatorName}</span>
      </div>

      <div className="class-lock-setting">
        {lock.setting
          ? <span className="template-term-chip">{lock.setting.name}</span>
          : <span className="empty-ranges-hint">No setting</span>}
      </div>

      <span className={cls}>{label}</span>

      {lock.deadline && (
        <span className="class-lock-deadline">
          Due {new Date(lock.deadline).toLocaleDateString()}
        </span>
      )}

      <div className="class-lock-actions action-buttons action-buttons-sm">
        {!lock.is_locked && (
          <button
            type="button"
            className="action-button action-button-edit"
            onClick={() => onAction({ type: 'assign', lock })}
          >
            {lock.setting ? 'Reassign' : 'Assign'}
          </button>
        )}

        {!lock.is_locked && lock.setting && (
          <button
            type="button"
            className="action-button action-button-edit"
            onClick={handleLock}
            disabled={lockMutation.isPending}
          >
            Lock
          </button>
        )}

        {lock.is_locked && (
          <button
            type="button"
            className="action-button action-button-delete"
            onClick={() => onAction({ type: 'unlock', lock })}
          >
            Unlock
          </button>
        )}

        {lock.is_locked && lock.setting?.allowOverride && (
          <button
            type="button"
            className="action-button action-button-edit"
            onClick={() => onAction({ type: 'override', lock })}
          >
            Override
          </button>
        )}

        <button
          type="button"
          className="action-button"
          onClick={() => onAction({ type: 'history', lock })}
        >
          History
        </button>
      </div>
    </div>
  );
};

export default ClassLockRow;