export function resolveDeadline(setting: {
  lock_deadline?: Date | null;
  deadlineDays?: number | null;
}): { isExpired: boolean; deadline: Date | null } {
  if (setting.lock_deadline) {
    return {
      isExpired: new Date() > setting.lock_deadline,
      deadline: setting.lock_deadline,
    };
  }
  return { isExpired: false, deadline: null };
}

export async function hydrateLocks(
  locks: any[],
  orgId: string,
  findProfilesByAccountIds: (
    accountIds: string[],
  ) => Promise<{ account_id: string; full_name: string | null }[]>,
) {
  const educatorIds = [...new Set(locks.map((l) => l.class.educator_id))];
  const profiles = await findProfilesByAccountIds(educatorIds);
  const educatorMap = new Map(
    profiles.map((p) => [p.account_id, p.full_name ?? 'Unknown Educator']),
  );

  return locks.map((lock) => mapLock(lock, orgId, educatorMap));
}

function mapLock(lock: any, orgId: string, educatorMap: Map<string, string>) {
  const setting = lock.setting ?? null;

  const educatorName =
    educatorMap.get(lock.class.educator_id) ?? 'Unknown Educator';

  const subjectName = lock.class.subject?.name ?? 'Unknown Subject';

  const lockStatus = lock.is_locked
    ? lock.locked_by === 'system'
      ? 'auto_locked'
      : 'locked'
    : 'unlocked';

  const { deadline } = setting ? resolveDeadline(setting) : { deadline: null };

  return {
    id: lock.id,
    org_id: orgId,
    class_id: lock.class_id,
    is_locked: lock.is_locked,
    locked_by: lock.locked_by,
    locked_at: lock.locked_at,
    created_at: lock.created_at,
    lockStatus,
    deadline,

    setting: setting
      ? {
          id: setting.id,
          name: setting.name,
          lockType: setting.lockType,
          allowOverride: setting.allowOverride,
        }
      : null,

    className: subjectName,
    educatorName,

    class: {
      id: lock.class.id,
      subject_id: lock.class.subject_id,
      educator_id: lock.class.educator_id,
      school_year_id: lock.class.school_year_id,
      subject: lock.class.subject ?? null,
    },
  };
}
