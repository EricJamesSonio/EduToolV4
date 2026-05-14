// client/src/modules/admin/system/components/grade-lock/SettingCard.tsx

import { ActionButtons } from '@/components/ActionButtons';
import { LOCK_TYPE_LABELS } from '../../types/grade-lock.types';
import type { GradeLockSetting } from '../../types/grade-lock.types';

interface Props {
  setting: GradeLockSetting;
  onEdit: (s: GradeLockSetting) => void;
  onDelete: (s: GradeLockSetting) => void;
}

const SettingCard: React.FC<Props> = ({ setting, onEdit, onDelete }) => (
  <div className={`grading-scale-card card${setting.is_default ? ' is-locked' : ''}`}>
    <div className="scale-card-header">
      <div>
        <h4 className="scale-name">
          {setting.name}
          {setting.is_default && (
            <span className="locked-badge" style={{ marginLeft: 8 }}>Default</span>
          )}
        </h4>
        <span className="scale-range-count">{LOCK_TYPE_LABELS[setting.lockType]}</span>
      </div>
      <ActionButtons
        onEdit={() => onEdit(setting)}
        onDelete={() => onDelete(setting)}
        size="sm"
      />
    </div>

    {setting.description && (
      <p className="scale-description">{setting.description}</p>
    )}

    <div className="ranges-preview">
      {setting.lock_deadline && (
        <div className="range-chip passing">
          <span className="range-chip-grade">Deadline</span>
          <span className="range-chip-pct">
            {new Date(setting.lock_deadline).toLocaleDateString()}
          </span>
        </div>
      )}
      {setting.deadlineDays != null && (
        <div className="range-chip">
          <span className="range-chip-grade">Relative</span>
          <span className="range-chip-pct">{setting.deadlineDays}d before year end</span>
        </div>
      )}
      <div className={`range-chip ${setting.allowOverride ? 'passing' : 'failing'}`}>
        <span className="range-chip-grade">Override</span>
        <span className="range-chip-remark">{setting.allowOverride ? 'Allowed' : 'Blocked'}</span>
      </div>
    </div>

    <div className="scale-card-footer">
      <span className="scale-stat">
        Used in {setting.used_in_classes} class{setting.used_in_classes !== 1 ? 'es' : ''}
      </span>
    </div>
  </div>
);

export default SettingCard;