import { test, expect } from "@playwright/test";
import {
  API_BASE,
  login,
  uniqueName,
} from "../helpers";
import {
  run,
  adminHeaders,
  unwrapData,
  unwrapList,
  createSection,
  createSubject,
  createClass,
} from "./shared";

export function registerPhase6bAnd6c() {
  test("Phase 6b — readiness gate: school year not ready before full setup", async ({
    page,
    request,
  }) => {
    const headers = await adminHeaders(request);

    // The program_* blockers below are only observable when the org contains a
    // program that isn't fully configured. JHS is already configured by Phases
    // 3-6, so create the elementary department here (unconfigured); Phase 6c
    // completes it, and Phase 6e's "placed in another program" case reuses it.
    await test.step("readiness: create the unconfigured elementary department", async () => {
      const progRes = await request.post(`${API_BASE}/programs`, {
        data: {
          schoolYearId: run.schoolYearId,
          name: uniqueName("Elem Dept"),
          type: "elementary",
        },
        headers,
      });
      expect(progRes.status()).toBe(201);
      const elemProgram = await unwrapData<{ id: string }>(progRes);

      const lvlRes = await request.post(`${API_BASE}/levels`, {
        data: { programId: elemProgram.id, name: "Grade 1", schoolYearId: run.schoolYearId },
        headers,
      });
      expect(lvlRes.status()).toBe(201);
      const elemLevel = await unwrapData<{ id: string }>(lvlRes);

      const secRes = await request.post(`${API_BASE}/sections`, {
        data: {
          levelId: elemLevel.id,
          schoolYearId: run.schoolYearId,
          name: uniqueName("Section G1"),
          capacity: 30,
        },
        headers,
      });
      expect(secRes.status()).toBe(201);
    });

    await test.step("readiness gate: school year not ready, wizard locked in the UI", async () => {
      const res = await request.get(`${API_BASE}/school-years/${run.schoolYearId}/readiness`, {
        headers,
      });
      expect(res.status()).toBe(200);
      const readiness = await unwrapData<{ ready: boolean; issues: Array<{ code: string }> }>(res);
      expect(readiness.ready).toBe(false);
      const codes = readiness.issues.map((i) => i.code);
      // Org-wide blockers: JHS levels 2-3 lack sections/subjects/classes; the
      // Elem department lacks its calendar, grading scale, and semester template.
      expect(codes).toContain("level_no_sections");
      expect(codes).toContain("level_no_subjects");
      expect(codes).toContain("program_no_calendar");
      expect(codes).toContain("program_no_grading_scale");
      expect(codes).toContain("program_no_semester_assignment");

      await login(page, run.adminEmail!, run.adminPassword!, "/admin/dashboard");
      await page.goto(`/admin/enrollment?schoolYearId=${run.schoolYearId}`);
      await expect(
        page.getByText(/this school year is not ready/i).first(),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "Enroll Students" })).toBeDisabled();
    });
  });

  test("Phase 6c — complete school-year readiness (JHS levels 2-3 + elementary department)", async ({
    page,
    request,
  }) => {
    const headers = await adminHeaders(request);

    await test.step("readiness: add sections/subjects/classes for JHS levels 2 and 3", async () => {
      for (const [i, levelId] of (run.levelIds ?? []).slice(1).entries()) {
        const sectionId = await createSection(request, headers, levelId, `Section L${i + 2}`);
        const subject = await createSubject(request, headers, `Level ${i + 2} Elective`, {
          levelId,
        });
        await createClass(request, headers, subject.id, sectionId);
      }
      // Level 1 counts toward the readiness contract too: every level needs a
      // level-bound subject and every subject needs a class. Section A already
      // has classItem, so only the subject + its class are missing here.
      const level1Subject = await createSubject(request, headers, "Level 1 Elective", {
        levelId: run.levelIds![0],
      });
      await createClass(request, headers, level1Subject.id, run.sectionId);
    });

    await test.step("readiness: complete the elementary department setup", async () => {
      const programs = await unwrapList<{
        id: string;
        name: string;
        type?: string;
        program_type?: string;
      }>(
        await request.get(`${API_BASE}/programs`, {
          params: { schoolYearId: run.schoolYearId! },
          headers,
        }),
      );
      const elem = programs.find((p) => (p.type ?? p.program_type) === "elementary");
      expect(elem, "expected an elementary department in the school year").toBeTruthy();

      const levels = await unwrapList<{ id: string; programId?: string; program_id?: string }>(
        await request.get(`${API_BASE}/levels`, {
          params: { schoolYearId: run.schoolYearId! },
          headers,
        }),
      );
      const elemLevel = levels.find((l) => (l.programId ?? l.program_id) === elem!.id);
      expect(elemLevel, "expected the elementary level (Grade 1)").toBeTruthy();

      const sections = await unwrapList<{ id: string; levelId?: string; level_id?: string }>(
        await request.get(`${API_BASE}/sections`, {
          params: { schoolYearId: run.schoolYearId! },
          headers,
        }),
      );
      const elemSection = sections.find((s) => (s.levelId ?? s.level_id) === elemLevel!.id);
      expect(elemSection, "expected the elementary section (Section G1)").toBeTruthy();

      // 1. Calendar — the semester-template assignment requires one.
      const cal = await request.post(`${API_BASE}/program-calendars`, {
        data: {
          programId: elem!.id,
          schoolYearId: run.schoolYearId,
          startDate: "2026-08-20",
          endDate: "2027-06-30",
          breaks: [
            { label: "Break 1", startDate: "2026-08-20", endDate: "2026-12-18" },
            { label: "Break 2", startDate: "2026-12-19", endDate: "2027-06-30" },
          ],
        },
        headers,
      });
      expect(cal.status()).toBe(201);

      // 2. Elementary grading scale + program assignment.
      const scale = await request.post(`${API_BASE}/grading-scales`, {
        data: {
          name: uniqueName("E2E Elem Scale"),
          programType: "elementary",
          ranges: [
            { minPercent: 75, maxPercent: 100, gradeValue: "Pass", remark: "Pass", isPassing: true },
            { minPercent: 0, maxPercent: 74, gradeValue: "Needs Improvement", remark: "Below passing", isPassing: false },
          ],
        },
        headers,
      });
      expect(scale.status()).toBe(201);
      const elemScale = await unwrapData<{ id: string }>(scale);
      const assignScale = await request.post(
        `${API_BASE}/grading-scales/programs/${elem!.id}/grading-scale`,
        { data: { scaleId: elemScale.id, schoolYearId: run.schoolYearId }, headers },
      );
      expect(assignScale.status()).toBe(201);

      // 3. Elementary semester template + assignment + auto-configured term dates.
      const sem = await request.post(`${API_BASE}/semester-templates`, {
        data: {
          name: uniqueName("E2E Elem Semester"),
          programType: "elementary",
          semesters: [
            {
              name: "Semester 1",
              orderIndex: 1,
              terms: [1, 2, 3, 4].map((n) => ({ name: `Term ${n}`, orderIndex: n })),
            },
            {
              name: "Semester 2",
              orderIndex: 2,
              terms: [1, 2, 3, 4].map((n) => ({ name: `Term ${n}`, orderIndex: n })),
            },
          ],
        },
        headers,
      });
      expect(sem.status()).toBe(201);
      const elemSemTemplate = await unwrapData<{ id: string }>(sem);
      const assignSem = await request.post(`${API_BASE}/semester-templates/assignments`, {
        data: { programId: elem!.id, templateId: elemSemTemplate.id },
        headers,
      });
      expect(assignSem.status()).toBe(201);
      const datesRes = await request.get(
        `${API_BASE}/semester-templates/assignments/${elem!.id}/default-term-dates`,
        { params: { templateId: elemSemTemplate.id }, headers },
      );
      expect(datesRes.status()).toBe(200);
      const termDates = await unwrapList<{ termId: string; startDate: string; endDate: string }>(
        datesRes,
      );
      expect(termDates.length).toBe(8);
      const saveDates = await request.post(
        `${API_BASE}/semester-templates/assignments/${elem!.id}/term-dates`,
        { data: { termDates }, headers },
      );
      expect([200, 201]).toContain(saveDates.status());

      // 4. Elementary scheme template — applied to the class after it exists
      //    (Elem has no pre-existing classes to auto-inherit from, so the first
      //    Elem class is the anchor that stamps the program template).
      const scheme = await request.post(`${API_BASE}/grading-scheme-templates`, {
        data: {
          name: uniqueName("E2E Elem Scheme"),
          programType: "elementary",
          components: [
            { name: "Written Work", type: "written_work", weight: 25 },
            { name: "Performance Task", type: "performance_task", weight: 25 },
            { name: "Quarterly Assessment", type: "quarterly_assessment", weight: 25 },
            { name: "Exam", type: "exam", weight: 25 },
          ],
        },
        headers,
      });
      expect(scheme.status()).toBe(201);
      const elemScheme = await unwrapData<{ id: string }>(scheme);

      // 5. Elem minor subject (bound to Grade 1) + class in Section G1.
      const elemSubject = await createSubject(request, headers, "Elem Grade 1", {
        programId: elem!.id,
        levelId: elemLevel!.id,
      });
      const elemClassId = await createClass(request, headers, elemSubject.id, elemSection!.id);
      const applyScheme = await request.post(
        `${API_BASE}/grading-scheme-templates/apply/class`,
        { data: { classId: elemClassId, templateId: elemScheme.id }, headers },
      );
      expect([200, 201]).toContain(applyScheme.status());
    });

    await test.step("readiness gate: the school year is now ready", async () => {
      let ready = false;
      for (let attempt = 0; attempt < 10 && !ready; attempt += 1) {
        const res = await request.get(`${API_BASE}/school-years/${run.schoolYearId}/readiness`, {
          headers,
        });
        expect(res.status()).toBe(200);
        ready = (await unwrapData<{ ready: boolean }>(res)).ready;
        if (!ready) await page.waitForTimeout(200);
      }
      expect(ready).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 6d/6e — school-year enrollment + class-eligibility lifecycle that Phase
  // 2 originally ran while readiness was still incomplete. Moved to run AFTER
  // Phase 6c so the gated enrollment endpoints and the placement-before-class
  // rule are exercised against a school year that is actually ready.
  // ─────────────────────────────────────────────────────────────────────────────

}