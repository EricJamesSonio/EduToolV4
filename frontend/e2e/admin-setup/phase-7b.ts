import { test, expect } from "@playwright/test";
import {
  API_BASE,
  login,
  uniqueName,
  uniqueStudentNumber,
  uniqueUsername,
  waitForToast,
} from "../helpers";
import {
  run,
  adminHeaders,
  unwrapData,
  unwrapList,
  createSubject,
  createClass,
} from "./shared";

export function registerPhase7b() {
  test("Phase 7b — enrollment locked until SY ready; wizard places student dept → level → section → class (UI)", async ({
    page,
    request,
  }) => {
    const headers = await adminHeaders(request);

    let level0Name = "";
    let subjectFTitle = "";
    let classFId = "";
    let student6Name = "";
    let student6Id = "";
    let wrongLevelName = "";

    // ── 3. Wizard fixtures ─────────────────────────────────────────────────────
    await test.step("wizard fixtures: level-bound class + placed/not-yet-placed candidates", async () => {
      const levels = await unwrapList<{ id: string; name: string }>(
        await request.get(`${API_BASE}/levels`, {
          params: { schoolYearId: run.schoolYearId! },
          headers,
        }),
      );
      const level0 = levels.find((l) => l.id === run.levelIds![0]);
      expect(level0, "expected the generated JHS level 1").toBeTruthy();
      level0Name = level0!.name;

      // classF: minor subject bound to level[0] + Section A → listed under level[0]
      // in the wizard class panel; its eligible set comes from the section.
      const subjectF = await createSubject(request, headers, "Wizard Elective", {
        levelId: run.levelIds![0],
      });
      subjectFTitle = subjectF.title;
      classFId = await createClass(request, headers, subjectF.id, run.sectionId);

      // student6: brand-new, nothing placed yet → the wizard will place it.
      student6Name = uniqueName("Student Wizard");
      const created = await request.post(`${API_BASE}/students`, {
        data: {
          studentId: uniqueStudentNumber("STU"),
          fullName: student6Name,
          emailName: uniqueUsername("stu"),
        },
        headers,
      });
      expect(created.status()).toBe(201);
      student6Id = (await unwrapData<{ id: string }>(created)).id;

      // wrong-level candidate: placed at level 2 (no section) via API → must NEVER
      // surface in classF's eligible list (level-mismatch negative control).
      wrongLevelName = uniqueName("Wrong Level Student");
      const wrong = await request.post(`${API_BASE}/students`, {
        data: {
          studentId: uniqueStudentNumber("STU"),
          fullName: wrongLevelName,
          emailName: uniqueUsername("stu"),
        },
        headers,
      });
      expect(wrong.status()).toBe(201);
      const wrongId = (await unwrapData<{ id: string }>(wrong)).id;
      const sye = await request.post(
        `${API_BASE}/school-years/${run.schoolYearId}/enrollments`,
        { data: { student_id: wrongId }, headers },
      );
      expect(sye.status()).toBe(201);
      const pe = await request.post(
        `${API_BASE}/school-years/${run.schoolYearId}/enrollments/students/${wrongId}/programs`,
        { data: { program_id: run.jhsProgramId, level_id: run.levelIds![1] }, headers },
      );
      expect(pe.status()).toBe(201);

      // Record the per-program placement condition the wizard drives into.
      run.placements[run.jhsProgramId!] = {
        programId: run.jhsProgramId!,
        name: run.jhsProgramName!,
        levelId: run.levelIds![0],
        levelName: level0Name,
        sectionId: run.sectionId!,
        sectionName: run.sectionName!,
      };
    });

    // ── 4. Wizard UI ───────────────────────────────────────────────────────────
    await test.step("wizard UI: unlock via /admin/enrollment and pick department + level", async () => {
      await login(page, run.adminEmail!, run.adminPassword!, "/admin/dashboard");
      await page.goto(`/admin/enrollment?schoolYearId=${run.schoolYearId}`);

      const enrollBtn = page.getByRole("button", { name: "Enroll Students" });
      await expect(enrollBtn).toBeEnabled();
      await enrollBtn.click();
      await page.waitForURL("**/admin/enrollment/enroll**", { timeout: 20_000 });

      const programCard = page.getByRole("button").filter({ hasText: run.jhsProgramName! }).first();
      await programCard.click();

      await page.getByRole("button", { name: level0Name, exact: true }).first().click();
    });

    await test.step("wizard UI: class panel BEFORE placement — unplaced and wrong-level students are NOT eligible", async () => {
      const header = page.getByRole("button").filter({ hasText: subjectFTitle }).first();
      await header.click();

      const card = page
        .locator("div.rounded-lg.border.bg-card.overflow-hidden")
        .filter({ hasText: subjectFTitle })
        .last();
      // Anchor on the eligible-list footer so the empty checks are meaningful.
      await expect(
        card.getByText(/select students to enroll in this class/i).first(),
      ).toBeVisible();
      await expect(card.getByText(student6Name, { exact: true })).toHaveCount(0);
      await expect(card.getByText(wrongLevelName, { exact: true })).toHaveCount(0);

      // Collapse again so the left panel's "Enroll (1)" button is unambiguous.
      await header.click();
    });

    await test.step("wizard UI: enroll the student into the department and level (Enroll Student tab)", async () => {
      await page.getByRole("tab", { name: "Enroll Student" }).click();
      await page
        .getByPlaceholder("Search by name, student ID, or email")
        .fill(student6Name);

      const row = page.getByRole("button").filter({ hasText: student6Name }).first();
      await expect(row).toBeVisible();
      await row.click();

      await page.getByRole("button", { name: "Enroll (1)" }).click();
      const dialog = page.locator('[data-slot="dialog-content"]');
      await expect(dialog.getByText("Enroll students?", { exact: true })).toBeVisible();
      await dialog.getByRole("button", { name: "Enroll", exact: true }).click();
      await waitForToast(page, "student(s) enrolled.");
    });

    await test.step("wizard UI: assign the section on the Pending Section tab", async () => {
      await page.getByRole("tab", { name: "Pending Section" }).click();
      const row = page.locator("tr").filter({ hasText: student6Name }).first();
      await expect(row).toBeVisible();
      await row.getByRole("combobox").click();
      await page.getByRole("option", { name: run.sectionName!, exact: true }).click();
      await row.getByRole("button", { name: "Assign" }).click();
      await waitForToast(page, "Section assigned.");
    });

    await test.step("wizard UI: placed student6 is now eligible for classF and enrolls in it", async () => {
      const header = page.getByRole("button").filter({ hasText: subjectFTitle }).first();
      await header.click();

      const card = page
        .locator("div.rounded-lg.border.bg-card.overflow-hidden")
        .filter({ hasText: subjectFTitle })
        .last();
      await expect(card.getByText(student6Name, { exact: true })).toBeVisible();
      await expect(card.getByText(wrongLevelName, { exact: true })).toHaveCount(0);

      await card.getByRole("button").filter({ hasText: student6Name }).click();
      await card.getByRole("button", { name: "Enroll (1)" }).click();
      await waitForToast(page, "student(s) enrolled in");
    });

    // ── 5. API verification ────────────────────────────────────────────────────
    await test.step("verify: student6 is placed (dept → level → section) and enrolled in classF", async () => {
      const sye = await request.get(`${API_BASE}/school-years/${run.schoolYearId}/enrollments`, {
        headers,
      });
      expect(sye.status()).toBe(200);
      const enrollList = await unwrapList<{
        student_id: string;
        programEnrollments: Array<{
          program_id: string;
          level: { id: string } | null;
          section: { id: string } | null;
        }>;
      }>(sye);
      const enr = enrollList.find((e) => e.student_id === student6Id);
      expect(enr, "expected student6 in the school-year enrollments").toBeTruthy();
      const pe = enr?.programEnrollments.find((p) => p.program_id === run.jhsProgramId);
      expect(pe?.level?.id).toBe(run.levelIds![0]);
      expect(pe?.section?.id).toBe(run.sectionId);

      const classEnr = await request.get(`${API_BASE}/classes/${classFId}/enrollments`, {
        headers,
      });
      expect(classEnr.status()).toBe(200);
      const classList = await unwrapList<{ student_id: string; status: string }>(classEnr);
      expect(classList.some((e) => e.student_id === student6Id && e.status === "active")).toBe(true);
    });

    console.log(
      `[Phase 7b] readiness gate verified; wizard placed ${student6Name} (JHS → level "${level0Name}" → ${run.sectionName}) and enrolled in class ${classFId}`,
    );
  });
}