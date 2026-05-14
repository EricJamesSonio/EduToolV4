// client/src/modules/admin/system/components/grade-lock/SettingFormModal.tsx

import { useState } from 'react';
import { toast } from 'sonner';
import Modal from '@/components/Modal';
import { LOCK_TYPES, LOCK_TYPE_LABELS } from '../../types/grade-lock.types';
import {
  useCreateGradeLockSetting,
  useUpdateGradeLockSetting,
} from '../../hooks/useGradeLock';
import type {
  GradeLockSetting,
  LockType,
  CreateGradeLockSettingDto,
  UpdateGradeLockSettingDto,
} from '../../types/grade-lock.types';

interface Props {
  setting?: GradeLockSetting | null;
  onClose: () => void;
}

const SettingFormModal: React.FC<Props> = ({ setting, onClose }) => {
  const isEdit = !!setting;
  const createMutation = useCreateGradeLockSetting();
  const updateMutation = useUpdateGradeLockSetting();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const [name, setName]                   = useState(setting?.name ?? '');
  const [description, setDescription]     = useState(setting?.description ?? '');
  const [lockType, setLockType]           = useState<LockType>(setting?.lockType ?? 'soft');
  const [lockDeadline, setLockDeadline]   = useState(
    setting?.lock_deadline ? setting.lock_deadline.slice(0, 10) : '',
  );
  const [deadlineDays, setDeadlineDays]   = useState(
    setting?.deadlineDays != null ? String(setting.deadlineDays) : '',
  );
  const [allowOverride, setAllowOverride] = useState(setting?.allowOverride ?? false);
  const [isDefault, setIsDefault]         = useState(setting?.is_default ?? false);

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Name is required.'); return; }

    const payload: CreateGradeLockSettingDto | UpdateGradeLockSettingDto = {
      name: name.trim(),
      description: description.trim() || undefined,
      lockType,
      lock_deadline: lockDeadline || undefined,
      deadlineDays: deadlineDays !== '' ? Number(deadlineDays) : undefined,
      allowOverride,
      is_default: isDefault,
    };

    try {
      if (isEdit && setting) {
        await updateMutation.mutateAsync({ id: setting.id, data: payload });
        toast.success('Setting updated.');
      } else {
        await createMutation.mutateAsync(payload as CreateGradeLockSettingDto);
        toast.success('Setting created.');
      }
      onClose();
    } catch { /* handled by apiClient */ }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? 'Edit Grade Lock Setting' : 'New Grade Lock Setting'}
      size="md"
    >
      <div className="form-group">
        <label className="form-label">Name</label>
        <input
          type="text"
          className="form-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. End-of-Semester Lock"
          maxLength={100}
          disabled={isSaving}
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          Description <span className="form-label-optional">(optional)</span>
        </label>
        <input
          type="text"
          className="form-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description"
          maxLength={255}
          disabled={isSaving}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Lock Type</label>
        <div className="program-select-wrapper">
          <select
            className="program-select"
            value={lockType}
            onChange={(e) => setLockType(e.target.value as LockType)}
            disabled={isSaving}
          >
            {LOCK_TYPES.map((t) => (
              <option key={t} value={t}>{LOCK_TYPE_LABELS[t]}</option>
            ))}
          </select>
          <div className="program-select__chevron" aria-hidden="true">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <p className="form-hint">
          {lockType === 'hard'     && 'Hard: only admins can unlock after deadline.'}
          {lockType === 'soft'     && 'Soft: educators can unlock before deadline.'}
          {lockType === 'flexible' && 'Flexible: no automatic enforcement.'}
        </p>
      </div>

      <div className="form-row">
        <div className="form-group form-group-half">
          <label className="form-label">
            Absolute Deadline <span className="form-label-optional">(optional)</span>
          </label>
          <input
            type="date"
            className="form-input"
            value={lockDeadline}
            onChange={(e) => setLockDeadline(e.target.value)}
            disabled={isSaving}
          />
        </div>

        <div className="form-group form-group-half">
          <label className="form-label">
            Days before year end <span className="form-label-optional">(optional)</span>
          </label>
          <input
            type="number"
            className="form-input"
            value={deadlineDays}
            min={0}
            onChange={(e) => setDeadlineDays(e.target.value)}
            placeholder="e.g. 7"
            disabled={isSaving}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="passing-toggle">
          <input
            type="checkbox"
            checked={allowOverride}
            onChange={(e) => setAllowOverride(e.target.checked)}
            disabled={isSaving}
          />
          <span>Allow admin override after lock</span>
        </label>
      </div>

      <div className="form-group">
        <label className="passing-toggle">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            disabled={isSaving}
          />
          <span>Set as org default</span>
        </label>
      </div>

      <div className="modal-footer">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={isSaving}>
          Cancel
        </button>
        <button type="button" className="btn-primary" onClick={handleSubmit} disabled={isSaving}>
          {isSaving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Setting'}
        </button>
      </div>
    </Modal>
  );
};

export default SettingFormModal;