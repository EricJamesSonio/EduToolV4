// client/src/modules/admin/system/pages/GradeLockPage.tsx

import { useState } from 'react';
import { toast } from 'sonner';
import Modal from '@/components/Modal';
import SchoolYearSelector from '@/components/shared/SchoolYearSelector';
import { useSchoolYears } from '../../academic/hooks/useSchoolYears';
import {
  useGradeLockSettings,
  useDeleteGradeLockSetting,
  useClassLocks,
  useUnlockClass,
  useOverrideGradeLock,
  useAutoLock,
} from '../hooks/useGradeLock';
import SettingCard from '../components/grade-lock/SettingCard';
import SettingFormModal from '../components/grade-lock/SettingFormModal';
import ClassLockRow from '../components/grade-lock/ClassLockRow';
import {
  AssignSettingModal,
  ReasonModal,
  ClassLockEventsModal,
} from '../components/grade-lock/modals';
import type { GradeLockSetting, GradeLock } from '../types/grade-lock.types';
import type { ClassLockAction } from '../components/grade-lock/ClassLockRow';

type PageView = 'settings' | 'classes';

interface Props {
  onBack: () => void;
}

const GradeLockPage: React.FC<Props> = ({ onBack }) => {
  const [view, setView]                                 = useState<PageView>('settings');
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string | null>(null);

  const [modalSetting, setModalSetting]   = useState<GradeLockSetting | null | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = useState<GradeLockSetting | null>(null);
  const [assignModal, setAssignModal]     = useState<GradeLock | null>(null);
  const [unlockModal, setUnlockModal]     = useState<GradeLock | null>(null);
  const [overrideModal, setOverrideModal] = useState<GradeLock | null>(null);
  const [historyModal, setHistoryModal]   = useState<GradeLock | null>(null);

  const { data: schoolYears = [], isLoading: schoolYearsLoading } = useSchoolYears();
  const { data: settings = [],   isLoading: settingsLoading }     = useGradeLockSettings();
  const { data: classLocks = [], isLoading: classLocksLoading }   = useClassLocks(
    selectedSchoolYearId ?? undefined,
  );

  const deleteMutation   = useDeleteGradeLockSetting();
  const unlockMutation   = useUnlockClass();
  const overrideMutation = useOverrideGradeLock();
  const autoLockMutation = useAutoLock();

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    try {
      await deleteMutation.mutateAsync(pendingDelete.id);
      toast.success('Setting deleted.');
    } catch { /* handled by apiClient */ }
    finally { setPendingDelete(null); }
  };

  const handleUnlock = async (reason: string) => {
    if (!unlockModal) return;
    await unlockMutation.mutateAsync({ classId: unlockModal.class_id, data: { reason } });
    toast.success('Class unlocked.');
    setUnlockModal(null);
  };

  const handleOverride = async (reason: string) => {
    if (!overrideModal) return;
    await overrideMutation.mutateAsync({ classId: overrideModal.class_id, data: { reason } });
    toast.success('Lock overridden.');
    setOverrideModal(null);
  };

  const handleAutoLock = async () => {
    try {
      const result = await autoLockMutation.mutateAsync();
      toast.success(`Auto-lock complete. ${result.lockedCount} class${result.lockedCount !== 1 ? 'es' : ''} locked.`);
    } catch { /* handled by apiClient */ }
  };

  const handleClassAction = (action: ClassLockAction) => {
    if (action.type === 'assign')   setAssignModal(action.lock);
    if (action.type === 'unlock')   setUnlockModal(action.lock);
    if (action.type === 'override') setOverrideModal(action.lock);
    if (action.type === 'history')  setHistoryModal(action.lock);
  };

  const lockedCount   = classLocks.filter((l) => l.is_locked).length;
  const unlockedCount = classLocks.filter((l) => !l.is_locked).length;

  return (
    <div className="system-detail-page">
      <div className="view-container">
        <div className="view-header">
          <button type="button" onClick={onBack} className="back-button">
            Back to System
          </button>
          <div className="header-title">
            <h2 className="dashboard-section-title">Grade Lock</h2>
            <p className="dashboard-section-subtitle">
              Manage grade lock settings and control class locking by school year.
            </p>
          </div>
        </div>
      </div>

      <div className="card grading-scale-filters">
        <div className="filter-row">
          {view === 'classes' && (
            <div className="form-group filter-group">
              <label className="form-label">School Year</label>
              <SchoolYearSelector
                schoolYears={schoolYears}
                isLoading={schoolYearsLoading}
                selectedId={selectedSchoolYearId}
                onSelect={setSelectedSchoolYearId}
              />
            </div>
          )}

          <div className="view-toggle-group">
            <button
              type="button"
              className={`view-toggle-btn${view === 'settings' ? ' active' : ''}`}
              onClick={() => setView('settings')}
            >
              Settings
              {settings.length > 0 && (
                <span className="view-toggle-badge">{settings.length}</span>
              )}
            </button>
            <button
              type="button"
              className={`view-toggle-btn${view === 'classes' ? ' active' : ''}`}
              onClick={() => setView('classes')}
            >
              Classes
            </button>
          </div>

          {view === 'settings' && (
            <button type="button" className="btn-primary" onClick={() => setModalSetting(null)}>
              + New Setting
            </button>
          )}
          {view === 'classes' && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleAutoLock}
              disabled={autoLockMutation.isPending}
            >
              {autoLockMutation.isPending ? 'Running…' : '⚡ Run Auto-Lock'}
            </button>
          )}
        </div>

        {view === 'classes' && classLocks.length > 0 && (
          <div className="filter-row" style={{ marginTop: 8 }}>
            <span className="scale-stat passing">🔒 {lockedCount} locked</span>
            <span className="scale-stat">🔓 {unlockedCount} unlocked</span>
          </div>
        )}
      </div>

      {view === 'settings' && (
        <div className="grading-scales-grid">
          {settingsLoading ? (
            <div className="dashboard-loading">
              <div className="loading-spinner" />
              <span className="loading-text">Loading settings…</span>
            </div>
          ) : settings.length === 0 ? (
            <div className="empty-state">
              <p>No grade lock settings yet.</p>
              <button type="button" className="btn-primary" onClick={() => setModalSetting(null)}>
                Create First Setting
              </button>
            </div>
          ) : (
            settings.map((s) => (
              <SettingCard
                key={s.id}
                setting={s}
                onEdit={setModalSetting}
                onDelete={setPendingDelete}
              />
            ))
          )}
        </div>
      )}

      {view === 'classes' && (
        <div className="card">
          {classLocksLoading ? (
            <div className="dashboard-loading">
              <div className="loading-spinner" />
              <span className="loading-text">Loading class locks…</span>
            </div>
          ) : classLocks.length === 0 ? (
            <div className="empty-state">
              <p>
                {selectedSchoolYearId
                  ? 'No classes found for this school year.'
                  : 'Select a school year to view class locks.'}
              </p>
            </div>
          ) : (
            <div className="class-locks-list">
              {classLocks.map((lock) => (
                <ClassLockRow
                  key={lock.id}
                  lock={lock}
                  settings={settings}
                  onAction={handleClassAction}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {modalSetting !== undefined && (
        <SettingFormModal setting={modalSetting} onClose={() => setModalSetting(undefined)} />
      )}

      {pendingDelete && (
        <Modal isOpen onClose={() => setPendingDelete(null)} title="Delete Grade Lock Setting" size="sm">
          <p>
            Are you sure you want to delete <strong>{pendingDelete.name}</strong>?
            {pendingDelete.used_in_classes > 0 && (
              <span className="form-hint" style={{ display: 'block', marginTop: 6 }}>
                ⚠️ Used in {pendingDelete.used_in_classes} class{pendingDelete.used_in_classes !== 1 ? 'es' : ''}.
                All associated locks will be removed.
              </span>
            )}
          </p>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={() => setPendingDelete(null)} disabled={deleteMutation.isPending}>Cancel</button>
            <button type="button" className="btn-danger" onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}

      {assignModal && (
        <AssignSettingModal
          classId={assignModal.class_id}
          className={assignModal.className}
          settings={settings}
          currentSettingId={assignModal.setting?.id}
          onClose={() => setAssignModal(null)}
        />
      )}

      {unlockModal && (
        <ReasonModal
          title={`Unlock — ${unlockModal.className}`}
          actionLabel="Unlock Class"
          onConfirm={handleUnlock}
          onClose={() => setUnlockModal(null)}
          isPending={unlockMutation.isPending}
        />
      )}

      {overrideModal && (
        <ReasonModal
          title={`Override Lock — ${overrideModal.className}`}
          actionLabel="Override Lock"
          onConfirm={handleOverride}
          onClose={() => setOverrideModal(null)}
          isPending={overrideMutation.isPending}
        />
      )}

      {historyModal && (
        <ClassLockEventsModal
          classId={historyModal.class_id}
          className={historyModal.className}
          onClose={() => setHistoryModal(null)}
        />
      )}
    </div>
  );
};

export default GradeLockPage;