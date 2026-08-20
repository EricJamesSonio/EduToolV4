import { adminQueryKeys } from './admin.keys';
import { educatorQueryKeys } from './educator.keys';
import { studentQueryKeys } from './student.keys';
import { authQueryKeys } from './auth.keys';
import { platformQueryKeys } from './platform.keys';

export type { QueryFilters } from './types';

export const queryKeys = {
  admin: adminQueryKeys,
  educator: educatorQueryKeys,
  student: studentQueryKeys,
  auth: authQueryKeys,
  platform: platformQueryKeys,
} as const;

export default queryKeys;
