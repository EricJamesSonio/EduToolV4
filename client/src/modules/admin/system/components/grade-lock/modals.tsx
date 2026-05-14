// client/src/modules/admin/system/components/grade-lock/modals.tsx

import { useState } from 'react';
import { toast } from 'sonner';
import Modal from '@/components/Modal';
import { useAssignGradeLockSetting, useGradeLockEvents } from '../../hooks/useGradeLock';
import { LOCK_TYPE_LABELS } from '../../types/grade-lock.types';
import type { GradeLockSetting, GradeLockEvent } from '../../types/grade-lock.types';

// ── AssignSettingModal ────────────────────────────────────────────────────────

interface AssignSettingModalProps {
  classId: string;
  className: string;
  settings: GradeLockSetting[];
  currentSettingId?: string | null;
  onClose: () => void;
}

export const AssignSettingModal: React.FC<AssignSettingModalProps> = ({
  classId,
  className,
  settings,
  currentSettingId,
  onClose,
}) => {
  const [selectedId, setSelectedId] = useState(currentSettingId ?? '');
  const assignMutation = useAssignGradeLockSetting();

  const handleAssign = async () => {
    if (!selectedId) { toast.error('Select a setting.'); return; }
    try {
      await assignMutation.mutateAsync({ class_id: classId, setting_id: selectedId });
      toast.success('Setting assigned.');
      onClose();
    } catch { /* handled by apiClient */ }
  };

  return (
    <Modal isOpen onClose={onClose} title={`Assign Lock Setting — ${className}`} size="sm">
      <div className="form-group">
        <label className="form-label">Grade Lock Setting</label>
        <div className="program-select-wrapper">
          <select
            className="program-select"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            disabled={assignMutation.isPending}
          >
            <option value="">Select setting…</option>
            {settings.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {LOCK_TYPE_LABELS[s.lockType]}
                {s.is_default ? ' (Default)' : ''}
              </option>
            ))}
          </select>
          <div className="program-select__chevron" aria-hidden="true">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={assignMutation.isPending}>
          Cancel
        </button>
        <button type="button" className="btn-primary" onClick={handleAssign} disabled={assignMutation.isPending}>
          {assignMutation.isPending ? 'Assigning…' : 'Assign'}
        </button>
      </div>
    </Modal>
  );
};

// ── ReasonModal ───────────────────────────────────────────────────────────────

interface ReasonModalProps {
  title: string;
  actionLabel: string;
  onConfirm: (reason: string) => Promise<void>;
  onClose: () => void;
  isPending: boolean;
}

export const ReasonModal: React.FC<ReasonModalProps> = ({
  title,
  actionLabel,
  onConfirm,
  onClose,
  isPending,
}) => {
  const [reason, setReason] = useState('');

  const handleConfirm = async () => {
    if (!reason.trim()) { toast.error('Reason is required.'); return; }
    await onConfirm(reason.trim());
  };

  return (
    <Modal isOpen onClose={onClose} title={title} size="sm">
      <div className="form-group">
        <label className="form-label">Reason</label>
        <input
          type="text"
          className="form-input"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter reason…"
          disabled={isPending}
          autoFocus
        />
      </div>
      <div className="modal-footer">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={isPending}>
          Cancel
        </button>
        <button type="button" className="btn-danger" onClick={handleConfirm} disabled={isPending}>
          {isPending ? 'Processing…' : actionLabel}
        </button>
      </div>
    </Modal>
  );
};

// ── ClassLockEventsModal ──────────────────────────────────────────────────────

const EVENT_LABELS: Record<string, string> = {
  lock:     '🔒 Locked',
  unlock:   '🔓 Unlocked',
  override: '⚡ Override',
  request:  '📋 Request',
};

interface ClassLockEventsModalProps {
  classId: string;
  className: string;
  onClose: () => void;
}

export const ClassLockEventsModal: React.FC<ClassLockEventsModalProps> = ({
  classId,
  className,
  onClose,
}) => {
  const { data: events = [], isLoading } = useGradeLockEvents(classId);

  return (
    <Modal isOpen onClose={onClose} title={`Lock History — ${className}`} size="md">
      {isLoading ? (
        <div className="dashboard-loading">
          <div className="loading-spinner" />
          <span className="loading-text">Loading events…</span>
        </div>
      ) : events.length === 0 ? (
        <p className="empty-ranges-hint">No lock events recorded for this class.</p>
      ) : (
        <div className="events-list">
          {events.map((ev: GradeLockEvent) => (
            <div key={ev.id} className="event-row">
              <span className="event-type">{EVENT_LABELS[ev.type] ?? ev.type}</span>
              <span className="event-actor">
                {ev.actor_id === 'system' ? 'System' : ev.actor_id}
              </span>
              <span className="event-date">
                {new Date(ev.created_at).toLocaleString()}
              </span>
              {ev.reason && (
                <span className="event-reason">"{ev.reason}"</span>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="modal-footer">
        <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
};