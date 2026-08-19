import {
  expect,
  type APIRequestContext,
  type APIResponse,
  type Locator,
  type Page,
} from "@playwright/test";
import { API_BASE, apiLogin, uniqueName } from "../helpers";

// Serial: every phase depends on the previous phase's data. Shared state flows
// through `run` so later tests (Phases 1-6) reuse the same entities.
export const run: {
  platformEmail: string;
  platformPassword: string;
  adminEmail?: string;
  adminPassword?: string;
  adminId?: string;
  orgName?: string;
  orgId?: string;
  orgExtension?: string;
  schoolYearName?: string;
  schoolYearId?: string;
  schoolYearRoute?: string;
  educatorEmail?: string;
  educatorPassword?: string;
  educatorName?: string;
  educatorId?: string;
  jhsProgramName?: string;
  jhsProgramId?: string;
  levelIds?: string[];
  sectionName?: string;
  sectionId?: string;
  student1?: { id: string; fullName: string };
  student2?: { id: string; fullName: string };
  student3?: { id: string; fullName: string };
  subject?: { id: string; title: string; programId: string };
  semesterId?: string;
  programEnrollmentId?: string;
  classItem?: {
    id: string;
    subject_id: string;
    educator_id: string;
    section_id: string;
    school_year_id: string;
    semester_id: string;
    capacity: number;
    schedules: Array<{ weekday: number; start_time: string; end_time: string }>;
  };
  programIds: Record<string, string>;
  // Per-department placement condition, captured after the Phase 7b enrollment
  // wizard places a student (keyed by programId). A student must be placed into
  // the department → level → section of a class before being eligible for it.
  placements: Record<
    string,
    {
      programId: string;
      name: string;
      levelId: string;
      levelName: string;
      sectionId: string;
      sectionName: string;
    }
  >;
  courseId?: string;
  scaleName?: string;
  scaleId?: string;
  schemeTemplateIds: Record<string, string>;
  schemeTemplateName?: string;
  semesterTemplateName?: string;
  semesterTemplateId?: string;
} = {
  platformEmail: "platform@edutool.dev",
  platformPassword: "platform123",
  programIds: {},
  placements: {},
  schemeTemplateIds: {},
};

// Authenticated API headers for the run's admin account.
export const adminHeaders = async (
  request: APIRequestContext,
): Promise<{ Authorization: string }> => {
  const token = await apiLogin(request, run.adminEmail!, run.adminPassword!);
  return { Authorization: `Bearer ${token}` };
};

// Unwrap the ResponseInterceptor envelope `{ success, data }`.
export const unwrapData = async <T>(res: APIResponse): Promise<T> =>
  (await res.json()).data as T;

// Several admin pages wrap dialog-open buttons in `ensureOrganization()`,
// which silently drops the click while the org query is still loading. Retry
// the click until the dialog actually appears so the test is timing-proof.
export const openDialog = async (
  page: Page,
  trigger: Locator,
  content: Locator,
): Promise<void> => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await trigger.click();
    try {
      await content.waitFor({ state: "visible", timeout: 1500 });
      return;
    } catch {
      // The click was dropped (org still loading); try again.
    }
  }
  await content.waitFor({ state: "visible", timeout: 15_000 });
};

// Unwrap the `{ success, data }` envelope for LIST-shaped responses (either
// `data: T[]` or `data: { data: T[] }`).
export const unwrapList = async <T>(res: APIResponse): Promise<T[]> => {
  const body = (await res.json()) as { data?: T[] | { data?: T[] } };
  const d = body?.data;
  return (Array.isArray(d) ? d : (d?.data ?? [])) as T[];
};

// Distinct weekly slots for the module-scope createClass below. Every
// readiness class is bound to the same run.educatorId, so reusing one
// (weekday 6, 08:00-09:30) slot tripped assertNoEducatorConflict the moment a
// second class landed in the same phase. Each call takes the next free slot.
const CLASS_SLOT_POOL: Array<{ weekday: number; startTime: string; endTime: string }> = [
  { weekday: 6, startTime: "08:00", endTime: "09:30" },
  { weekday: 6, startTime: "10:00", endTime: "11:30" },
  { weekday: 6, startTime: "13:00", endTime: "14:30" },
  { weekday: 6, startTime: "15:00", endTime: "16:30" },
  { weekday: 6, startTime: "17:00", endTime: "18:30" },
];
let classSlotCursor = 0;
export const nextClassSchedule = () => {
  const schedule = [CLASS_SLOT_POOL[classSlotCursor % CLASS_SLOT_POOL.length]];
  classSlotCursor += 1;
  return schedule;
};

export const createSection = async (
  request: APIRequestContext,
  headers: { Authorization: string },
  levelId: string,
  baseName: string,
): Promise<string> => {
  const res = await request.post(`${API_BASE}/sections`, {
    data: {
      levelId,
      schoolYearId: run.schoolYearId,
      name: uniqueName(baseName),
      capacity: 30,
    },
    headers,
  });
  expect(res.status()).toBe(201);
  return (await unwrapData<{ id: string }>(res)).id;
};

export const createSubject = async (
  request: APIRequestContext,
  headers: { Authorization: string },
  baseName: string,
  opts: { programId?: string; levelId?: string } = {},
): Promise<{ id: string; title: string }> => {
  const res = await request.post(`${API_BASE}/subjects`, {
    data: {
      name: uniqueName(baseName),
      subjectType: opts.levelId ? "minor" : "major",
      programId: opts.programId ?? run.jhsProgramId,
      ...(opts.levelId ? { levelId: opts.levelId } : {}),
    },
    headers,
  });
  expect(res.status()).toBe(201);
  return await unwrapData<{ id: string; title: string }>(res);
};

export const createClass = async (
  request: APIRequestContext,
  headers: { Authorization: string },
  subjectId: string,
  sectionId?: string,
): Promise<string> => {
  const res = await request.post(`${API_BASE}/classes`, {
    data: {
      subjectId,
      educatorId: run.educatorId,
      ...(sectionId ? { sectionId } : {}),
      schoolYearId: run.schoolYearId,
      semesterId: run.semesterId,
      capacity: 30,
      schedules: nextClassSchedule(),
    },
    headers,
  });
  expect(res.status()).toBe(201);
  return (await unwrapData<{ id: string }>(res)).id;
};