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
} from "./shared";

export function registerPhase7() {
  test("Phase 7 — class enrollment lifecycle: gating, duplicates, capacity, and year-end guard", async ({
    page,
    request,
  }) => {
    const headers = await adminHeaders(request);

    let classBId = "";
    let classCId = "";
    let classDId = "";
    let classEId = "";
    let student4Id = "";
    let student5Id = "";

    const createSubject = async (name: string, minorLevelId?: string) => {
      const res = await request.post(`${API_BASE}/subjects`, {
        data: {
          name: uniqueName(name),
          subjectType: minorLevelId ? "minor" : "major",
          programId: run.jhsProgramId,
          ...(minorLevelId ? { levelId: minorLevelId } : {}),
        },
        headers,
      });
      expect(res.status()).toBe(201);
      return (await unwrapData<{ id: string }>(res)).id;
    };

    const createClass = async (subjectId: string, capacity: number, weekday: number, sectionId?: string) => {
      const res = await request.post(`${API_BASE}/classes`, {
        data: {
          subjectId,
          educatorId: run.educatorId,
          ...(sectionId ? { sectionId } : {}),
          schoolYearId: run.schoolYearId,
          semesterId: run.semesterId,
          capacity,
          schedules: [{ weekday, startTime: "08:00", endTime: "09:30" }],
        },
        headers,
      });
      expect(res.status()).toBe(201);
      return (await unwrapData<{ id: string }>(res)).id;
    };

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
      const student = await unwrapData<{ id: string }>(created);
      await request.post(`${API_BASE}/school-years/${run.schoolYearId}/enrollments`, {
        data: { student_id: student.id },
        headers,
      });
      const pe = await request.post(
        `${API_BASE}/school-years/${run.schoolYearId}/enrollments/students/${student.id}/programs`,
        { data: { program_id: run.jhsProgramId, level_id: levelId }, headers },
      );
      expect(pe.status()).toBe(201);
      return { studentId: student.id, programEnrollmentId: (await unwrapData<{ id: string }>(pe)).id };
    };

    await test.step("build extra JHS classes and students for the enrollment tests", async () => {
      const subjectB = await createSubject("Elective Math");
      const subjectD = await createSubject("Elective Science");
      // Minor subject bound to level[0] → the class inherits a LEVEL constraint.
      const subjectE = await createSubject("Elective English", run.levelIds![0]);

      // classB = UI enroll target; classC reuses subjectB to prove the
      // "same subject in the same semester" duplicate guard; classD has
      // capacity 1 to prove the overflow branch; classE is the level-gating target.
      classBId = await createClass(subjectB, 30, 2, run.sectionId);
      classCId = await createClass(subjectB, 30, 3, run.sectionId);
      classDId = await createClass(subjectD, 1, 4, run.sectionId);
      classEId = await createClass(subjectE, 30, 5);

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

      // The roster dialog only lists ACTIVE student accounts, while POST /students
      // creates them as `pending`. Activate the candidates we expect to appear
      // (student1 was created in Phase 2; student5 intentionally stays pending).
      for (const id of [run.student1!.id, student4Id]) {
        const act = await request.patch(`${API_BASE}/students/${id}/status`, {
          data: { status: "active" },
          headers,
        });
        expect(act.status()).toBe(200);
      }

      expect(classBId).toBeTruthy();
      expect(student4Id).toBeTruthy();
      expect(student5Id).toBeTruthy();
    });

    await test.step("UI: admin enrolls the eligible JHS student via the class roster", async () => {
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

      // student1 (same JHS program + level + section) is the ONLY eligible one.
      await expect(
        dialog.getByRole("button").filter({ hasText: run.student1!.fullName }),
      ).toBeVisible();
      await expect(
        dialog.getByRole("button").filter({ hasText: run.student2!.fullName }),
      ).toHaveCount(0);
      await expect(
        dialog.getByRole("button").filter({ hasText: run.student3!.fullName }),
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

    await test.step("duplicate enrollments are rejected (same class + same subject/semester)", async () => {
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

    await test.step("enrollment requires the same department AND level where the class is registered", async () => {
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

    await test.step("status transitions + removal + re-enroll on the class enrollment", async () => {
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

    await test.step("capacity overflow is reported, not an error", async () => {
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

    await test.step("a pending school year cannot be ended directly (guard)", async () => {
      const res = await request.patch(
        `${API_BASE}/school-years/${run.schoolYearId}/end`,
        { headers },
      );
      expect(res.status()).toBe(400);
      expect(((await res.json()) as { message: string }).message).toContain(
        "A pending school year cannot be ended. Activate it first.",
      );
    });

    console.log(
      `[Phase 7] enrolled ${run.student1!.fullName} into ${classBId}; gating/dup/overflow/status guards verified; SY end guard verified for ${run.schoolYearId}`,
    );
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 7b — /admin/enrollment wizard (UI). Readiness setup now lives in
  // Phase 6b/6c (a school year cannot enroll students until EVERY department is
  // structurally ready), so this test only drives the wizard end to end: it
  // places a student department → level → section through the UI, and only THEN
  // does the student become eligible for a section-bound class in the wizard's
  // class panel — proving the placement-before-class rule without any API bypass
  // on the enrollment side.
  // ─────────────────────────────────────────────────────────────────────────────

}