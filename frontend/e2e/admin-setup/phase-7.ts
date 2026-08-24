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
  createSubjectViaUI,
  createClassViaUI,
} from "./shared";

// Phase 7 — Class enrollment lifecycle (7a) + the enrollment wizard (7c), both
// driven against entities created through the REAL class modal (fixtures use
// createSubjectViaUI/createClassViaUI). 7a covers the gating rule (same
// department AND level where the class is registered), duplicate/capacity/removal
// behaviors, and the year-end guard. 7c drives the /admin/enrollment wizard end
// to end: it places a student department → level → section through the UI, and
// only THEN does the student become eligible for a section-bound class in the
// wizard's class panel — proving the placement-before-class rule without any API
// bypass on the enrollment side.
export function registerPhase7() {
  test("Phase 7 — class enrollment lifecycle (7a) + enrollment wizard (7c)", async ({
    page,
    request,
  }) => {
    // 9 UI dialogs (4 subjects + 5 classes) + many API calls; under Turbopack
    // dev-compile slowness this routinely exceeds the 180s global timeout.
    test.setTimeout(300_000);
    const headers = await adminHeaders(request);

    let classBId = "";
    let classCId = "";
    let classDId = "";
    let classEId = "";
    let classFId = "";
    let subjectFTitle = "";
    let level0Name = "";
    let student4Id = "";
    let student5Id = "";
    let student5Name = "";
    let student6Id = "";
    let student6Name = "";
    let wrongLevelId = "";
    let wrongLevelName = "";

    const enrollStudent = (classId: string, studentId: string) =>
      request.post(`${API_BASE}/classes/${classId}/enroll`, {
        data: { studentId },
        headers,
      });

    const enrollmentsOf = async (classId: string) =>
      unwrapData<Array<{ id: string; student_id: string; status: string }>>(
        await request.get(`${API_BASE}/classes/${classId}/enrollments`, { headers }),
      );

    const eligibleOf = async (classId: string) =>
      unwrapData<Array<{ id: string }>>(
        await request.get(`${API_BASE}/classes/${classId}/eligible-students`, { headers }),
      );

    const placeJhsStudent = async (name: string, levelId: string) => {
      const created = await request.post(`${API_BASE}/students`, {
        data: {
          fullName: uniqueName(name),
          emailName: uniqueUsername("stu"),
          studentId: uniqueStudentNumber("STU"),
        },
        headers,
      });
      expect(created.status()).toBe(201);
      const student = await unwrapData<{ id: string; fullName: string }>(created);
      await request.post(`${API_BASE}/school-years/${run.schoolYearId}/enrollments`, {
        data: { student_id: student.id },
        headers,
      });
      const pe = await request.post(
        `${API_BASE}/school-years/${run.schoolYearId}/enrollments/students/${student.id}/programs`,
        { data: { program_id: run.jhsProgramId, level_id: levelId }, headers },
      );
      expect(pe.status()).toBe(201);
      return {
        studentId: student.id,
        fullName: student.fullName,
        programEnrollmentId: (await unwrapData<{ id: string }>(pe)).id,
      };
    };

    const uiParams = {
      programName: run.jhsProgramName!,
      levelId: run.levelIds![0],
      sectionName: run.sectionName!,
      educatorFullName: run.educatorName!,
    };

    // ── 3. Fixtures (all through the real admin dialogs) ──────────────────────
    await test.step("fixtures: subjects + classes via the class modal; candidate students", async () => {
      const levels = await unwrapList<{ id: string; name: string }>(
        await request.get(`${API_BASE}/levels`, {
          params: { schoolYearId: run.schoolYearId! },
          headers,
        }),
      );
      const level0 = levels.find((l) => l.id === run.levelIds![0]);
      expect(level0, "expected the generated JHS level 1").toBeTruthy();
      level0Name = level0!.name;

      // Elective Math majors + Elective English/Wizard Elective minors, all
      // bound to level[0]. The JHS subject dialog requires a level pick, so the
      // created majors are level-bound like the minors.
      const subjectB = await createSubjectViaUI(page, {
        ...uiParams,
        subjectType: "major",
        name: uniqueName("Elective Math"),
      });
      const subjectD = await createSubjectViaUI(page, {
        ...uiParams,
        subjectType: "major",
        name: uniqueName("Elective Science"),
      });
      const subjectE = await createSubjectViaUI(page, {
        ...uiParams,
        subjectType: "minor",
        name: uniqueName("Elective English"),
      });
      const subjectF = await createSubjectViaUI(page, {
        ...uiParams,
        subjectType: "minor",
        name: uniqueName("Wizard Elective"),
      });
      subjectFTitle = subjectF.title;

      // classB = UI enroll target; classC reuses subjectB to prove the
      // "same subject in the same semester" duplicate guard; classD has
      // capacity 1 to prove the overflow branch; classE is the level-gating
      // target (minor subject bound to level[0]); classF feeds the wizard.
      classBId = (
        await createClassViaUI(page, { ...uiParams, subjectTitle: subjectB.title, capacity: 30 })
      ).id;
      classCId = (
        await createClassViaUI(page, { ...uiParams, subjectTitle: subjectB.title, capacity: 30 })
      ).id;
      classDId = (
        await createClassViaUI(page, { ...uiParams, subjectTitle: subjectD.title, capacity: 1 })
      ).id;
      classEId = (
        await createClassViaUI(page, { ...uiParams, subjectTitle: subjectE.title, capacity: 30 })
      ).id;
      classFId = (
        await createClassViaUI(page, { ...uiParams, subjectTitle: subjectF.title, capacity: 30 })
      ).id;

      // student4: JHS + level[0] + Section A → eligible for the level/section
      // bound classes (used for the overflow candidate).
      const s4 = await placeJhsStudent("Student Four", run.levelIds![0]);
      student4Id = s4.studentId;
      await request.patch(
        `${API_BASE}/school-years/${run.schoolYearId}/enrollments/programs/${s4.programEnrollmentId}`,
        { data: { section_id: run.sectionId }, headers },
      );

      // student5: JHS but on a DIFFERENT level → proves the same-level rule.
      const s5 = await placeJhsStudent("Student Five", run.levelIds![1]);
      student5Id = s5.studentId;
      student5Name = s5.fullName;

      // student6: brand-new, nothing placed yet → the wizard will place it.
      student6Name = uniqueName("Student Wizard");
      const created6 = await request.post(`${API_BASE}/students`, {
        data: {
          studentId: uniqueStudentNumber("STU"),
          fullName: student6Name,
          emailName: uniqueUsername("stu"),
        },
        headers,
      });
      expect(created6.status()).toBe(201);
      student6Id = (await unwrapData<{ id: string }>(created6)).id;

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
      wrongLevelId = (await unwrapData<{ id: string }>(wrong)).id;
      const wrongSye = await request.post(
        `${API_BASE}/school-years/${run.schoolYearId}/enrollments`,
        { data: { student_id: wrongLevelId }, headers },
      );
      expect(wrongSye.status()).toBe(201);
      const wrongPe = await request.post(
        `${API_BASE}/school-years/${run.schoolYearId}/enrollments/students/${wrongLevelId}/programs`,
        { data: { program_id: run.jhsProgramId, level_id: run.levelIds![1] }, headers },
      );
      expect(wrongPe.status()).toBe(201);

      // The roster dialog only lists ACTIVE student accounts, while POST /students
      // creates them as `pending`. Activate the candidates we expect to appear
      // (student1 was created in Phase 6; student5 stays pending on purpose).
      for (const id of [run.student1!.id, student4Id]) {
        const act = await request.patch(`${API_BASE}/students/${id}/status`, {
          data: { status: "active" },
          headers,
        });
        expect(act.status()).toBe(200);
      }

      // Record the per-program placement condition the wizard drives into.
      run.placements[run.jhsProgramId!] = {
        programId: run.jhsProgramId!,
        name: run.jhsProgramName!,
        levelId: run.levelIds![0],
        levelName: level0Name,
        sectionId: run.sectionId!,
        sectionName: run.sectionName!,
      };

      expect(classBId).toBeTruthy();
      expect(student4Id).toBeTruthy();
      expect(student5Id).toBeTruthy();
      expect(student6Id).toBeTruthy();
    });

    // ── 7a. Class enrollment lifecycle ──────────────────────────────────────
    await test.step("7a UI: admin enrolls the eligible JHS student via the class roster", async () => {
      await login(page, run.adminEmail!, run.adminPassword!, "/admin/dashboard");
      await page.goto(`/admin/classes/${classBId}`);

      await expect(page.getByRole("heading", { level: 2, name: /Enrolled Students/ })).toBeVisible();
      await expect(page.getByText("No students enrolled yet.", { exact: true })).toBeVisible();

      await page.getByRole("button", { name: "Enroll Student" }).click();
      const dialog = page.locator('[data-slot="dialog-content"]');
      await expect(dialog).toBeVisible();

      // The dialog itself states the gating rule under test.
      await expect(
        dialog.getByText(
          "Only students matching this class's program, course/strand, and level are listed.",
          { exact: true },
        ),
      ).toBeVisible();

      // student1 (same JHS program + level + section) is the ONLY eligible one;
      // student2 is unplaced and student5 is on a different level → excluded.
      await expect(
        dialog.getByRole("button").filter({ hasText: run.student1!.fullName }),
      ).toBeVisible();
      await expect(
        dialog.getByRole("button").filter({ hasText: run.student2!.fullName }),
      ).toHaveCount(0);
      await expect(
        dialog.getByRole("button").filter({ hasText: student5Name }),
      ).toHaveCount(0);

      await dialog.getByRole("button").filter({ hasText: run.student1!.fullName }).click();
      await waitForToast(page, "Student enrolled.");
      await expect(dialog).toBeHidden();

      // Roster now lists student1 (active).
      await expect(
        page
          .locator("div.rounded-lg.border.bg-card.overflow-hidden.divide-y")
          .first()
          .getByText(run.student1!.fullName),
      ).toBeVisible();
    });

    await test.step("7a API: duplicate enrollments are rejected (same class + same subject/semester)", async () => {
      // The duplicate-subject check runs before the same-class check, so both a
      // re-enroll into the very same class and a parallel class for the same
      // subject/semester surface the subject-scoped 409.
      const sameClass = await enrollStudent(classBId, run.student1!.id);
      expect(sameClass.status()).toBe(409);
      expect(((await sameClass.json()) as { message: string }).message).toContain(
        "Student is already enrolled in a class for this subject in the same semester.",
      );

      const sameSubjectSem = await enrollStudent(classCId, run.student1!.id);
      expect(sameSubjectSem.status()).toBe(409);
      expect(((await sameSubjectSem.json()) as { message: string }).message).toContain(
        "Student is already enrolled in a class for this subject in the same semester.",
      );
    });

    await test.step("7a API: enrollment requires the same department AND level where the class is registered", async () => {
      // classE is registered against level[0] (minor subject binding). student1 is
      // placed on level[0] → enrollable; student5 is on level[1] → rejected.
      const ok = await enrollStudent(classEId, run.student1!.id);
      expect(ok.status()).toBe(201);

      const wrongLevel = await enrollStudent(classEId, student5Id);
      expect(wrongLevel.status()).toBe(400);
      expect(((await wrongLevel.json()) as { message: string }).message).toContain(
        "Student is not eligible for this class",
      );
      expect(((await wrongLevel.json()) as { message: string }).message).toContain(
        "The student does not belong to the same program, course/strand, or level assigned to this class.",
      );

      // eligible-students mirrors the rule: only the level[0] JHS candidate is
      // offered; the enrolled student and the wrong-level student are not.
      const eligible = await eligibleOf(classEId);
      const ids = eligible.map((s) => s.id);
      expect(ids).toContain(student4Id);
      expect(ids).not.toContain(run.student1!.id);
      expect(ids).not.toContain(student5Id);
    });

    await test.step("7a API: status transitions + removal + re-enroll on a class enrollment", async () => {
      let enrollments = await enrollmentsOf(classBId);
      const enr = enrollments.find((e) => e.student_id === run.student1!.id)!;
      expect(enr.status).toBe("active");

      const pending = await request.patch(
        `${API_BASE}/classes/${classBId}/enrollments/${enr.id}`,
        { data: { status: "pending" }, headers },
      );
      expect(pending.status()).toBe(200);
      enrollments = await enrollmentsOf(classBId);
      expect(enrollments.find((e) => e.id === enr.id)?.status).toBe("pending");

      const backToActive = await request.patch(
        `${API_BASE}/classes/${classBId}/enrollments/${enr.id}`,
        { data: { status: "active" }, headers },
      );
      expect(backToActive.status()).toBe(200);

      const removed = await request.delete(
        `${API_BASE}/classes/${classBId}/enrollments/${enr.id}`,
        { headers },
      );
      expect(removed.status()).toBe(200);
      enrollments = await enrollmentsOf(classBId);
      expect(enrollments.some((e) => e.student_id === run.student1!.id)).toBe(false);

      // A previously-removed enrollment does not block a fresh row.
      const reEnroll = await enrollStudent(classBId, run.student1!.id);
      expect(reEnroll.status()).toBe(201);
      enrollments = await enrollmentsOf(classBId);
      expect(
        enrollments.some((e) => e.student_id === run.student1!.id && e.status === "active"),
      ).toBe(true);

      // Removing the already-removed original row is a conflict.
      const doubleRemove = await request.delete(
        `${API_BASE}/classes/${classBId}/enrollments/${enr.id}`,
        { headers },
      );
      expect(doubleRemove.status()).toBe(409);
      expect(((await doubleRemove.json()) as { message: string }).message).toContain(
        "Enrollment has already been removed.",
      );
    });

    await test.step("7a API: capacity overflow is reported, not an error", async () => {
      const fill = await enrollStudent(classDId, run.student1!.id);
      expect(fill.status()).toBe(201);
      expect(((await fill.json()) as { data: { status: string } }).data.status).toBe("active");

      const overflow = await enrollStudent(classDId, student4Id);
      expect(overflow.status()).toBe(201);
      const body = (await overflow.json()) as {
        data: { overflow: boolean; message: string };
      };
      expect(body.data.overflow).toBe(true);
      expect(body.data.message).toContain("Class is at full capacity (1 students)");
    });

    await test.step("7a API: a pending school year cannot be ended directly (guard)", async () => {
      const res = await request.patch(
        `${API_BASE}/school-years/${run.schoolYearId}/end`,
        { headers },
      );
      expect(res.status()).toBe(400);
      expect(((await res.json()) as { message: string }).message).toContain(
        "A pending school year cannot be ended. Activate it first.",
      );
    });

    // ── 7c. Enrollment wizard (UI) ───────────────────────────────────────────
    await test.step("7c wizard: unlock via /admin/enrollment and pick department + level", async () => {
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

    await test.step("7c wizard: class panel BEFORE placement — unplaced and wrong-level students are NOT eligible", async () => {
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

    await test.step("7c wizard: enroll the student into the department and level (Enroll Student tab)", async () => {
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

    await test.step("7c wizard: assign the section on the Pending Section tab", async () => {
      await page.getByRole("tab", { name: "Pending Section" }).click();
      const row = page.locator("tr").filter({ hasText: student6Name }).first();
      await expect(row).toBeVisible();
      await row.getByRole("combobox").click();
      await page.getByRole("option", { name: run.sectionName!, exact: true }).click();
      await row.getByRole("button", { name: "Assign" }).click();
      await waitForToast(page, "Section assigned.");
    });

    await test.step("7c wizard: placed student6 is now eligible for classF and enrolls in it", async () => {
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

    // ── 5. API verification ──────────────────────────────────────────────────
    await test.step("7c verify: student6 is placed (dept → level → section) and enrolled in classF", async () => {
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
      `[Phase 7] enrolled ${run.student1!.fullName} into ${classBId}; gating/dup/overflow/status guards verified; wizard placed ${student6Name} (JHS → level "${level0Name}" → ${run.sectionName}) and enrolled in class ${classFId}`,
    );
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 7's wizard (7c) now runs inside the single Phase 7 test above against
  // a school year that is ALREADY ready — enrollment cannot happen until every
  // department is structurally ready (proved by the Phase 6b readiness gate).
  // ─────────────────────────────────────────────────────────────────────────────
}