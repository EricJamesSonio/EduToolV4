import { test, expect } from "@playwright/test";
import { API_BASE, apiLogin, login, uniqueName } from "../helpers";
import {
  run,
  adminHeaders,
  unwrapData,
  createSubjectViaUI,
  createClassViaUI,
} from "./shared";

// Phase 2e/2f/2g — the ORM entities every later phase depends on (a minor
// subject per JHS level, a class per level) are now created through the real
// admin UI — the /admin/subjects dialog and the /admin/classes "New Class"
// modal (department → semester → level → section → subject → educator →
// capacity → schedule). These run AFTER Phase 5/6 so the semester template is
// assigned and the modal's semester picker is populated.
export function registerPhaseClasses() {
  test("Phase 2e — per-level minor subjects created via the subject UI (JHS)", async ({
    page,
  }) => {
    await test.step("create a minor subject for each JHS level", async () => {
      for (const [i, levelId] of (run.levelIds ?? []).entries()) {
        const created = await createSubjectViaUI(page, {
          programName: run.jhsProgramName!,
          subjectType: "minor",
          levelId,
          name: uniqueName(`Level ${i + 1} Elective`),
        });
        run.subjectByLevel[levelId] = created;
        expect(created.id).toBeTruthy();
        expect(created.title).toBe(run.subjectByLevel[levelId].title);
      }
      expect(run.subjectByLevel[run.levelIds![0]].title).toBeTruthy();
    });

    await test.step("every minor subject is listed on the subjects page", async () => {
      await login(page, run.adminEmail!, run.adminPassword!, "/admin/dashboard");
      await page.goto("/admin/subjects");
      await page.getByRole("tab", { name: "Minor Subjects" }).click();
      for (const levelId of run.levelIds!) {
        await expect(
          page.getByText(run.subjectByLevel[levelId].title, { exact: false }).first(),
        ).toBeVisible();
      }
    });
  });

  test("Phase 2f — classes created via the class modal for each JHS level", async ({
    page,
    request,
  }) => {
    await test.step("create one class per JHS level through the modal", async () => {
      for (const [i, levelId] of (run.levelIds ?? []).entries()) {
        const created = await createClassViaUI(page, {
          programName: run.jhsProgramName!,
          levelId,
          sectionName: run.sectionByLevel[levelId].name,
          subjectTitle: run.subjectByLevel[levelId].title,
          educatorFullName: run.educatorName!,
          capacity: 30,
        });
        expect(created.id).toBeTruthy();
        expect(created.capacity).toBe(30);
        if (i === 0) {
          // The level-1 class is the anchor the enrollment phases reuse.
          run.classItem = created;
          expect(created.subject_id).toBe(run.subjectByLevel[levelId].id);
          expect(created.educator_id).toBe(run.educatorId);
          expect(created.section_id).toBe(run.sectionByLevel[levelId].id);
          expect(created.school_year_id).toBe(run.schoolYearId);
          expect(created.schedules).toHaveLength(1);
        }
      }
    });

    await test.step("the level-1 class is listed via the API", async () => {
      const headers = await adminHeaders(request);
      const res = await request.get(
        `${API_BASE}/classes?schoolYearId=${run.schoolYearId}`,
        { headers },
      );
      expect(res.status()).toBe(200);
      const pageData = await unwrapData<{ data: Array<{ id: string }> }>(res);
      expect(pageData.data.some((c) => c.id === run.classItem!.id)).toBe(true);
    });
  });

  test("Phase 2g — educator role cannot create classes (RBAC)", async ({ request }) => {
    const educatorToken = await apiLogin(request, run.educatorEmail!, run.educatorPassword!);
    const headers = { Authorization: `Bearer ${educatorToken}` };

    await test.step("educator may read classes", async () => {
      const res = await request.get(`${API_BASE}/classes`, { headers });
      expect(res.status()).toBe(200);
    });

    await test.step("educator may NOT create classes (admin-only)", async () => {
      const res = await request.post(`${API_BASE}/classes`, {
        data: {
          subjectId: run.subjectByLevel[run.levelIds![0]].id,
          educatorId: run.educatorId,
          sectionId: run.sectionId,
          schoolYearId: run.schoolYearId,
          semesterId: run.classItem!.semester_id,
          capacity: 30,
          schedules: [{ weekday: 2, startTime: "10:00", endTime: "11:30" }],
        },
        headers,
      });
      expect(res.status()).toBe(403);
      const body = (await res.json()) as { message: string };
      expect(body.message).toBe("Access denied");
    });

    console.log(
      `[Phase 2e/2f/2g] subjects=${run.levelIds?.length} classes=${run.levelIds?.length} | level-1 class=${run.classItem?.id}`,
    );
  });
}