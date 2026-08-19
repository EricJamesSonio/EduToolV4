import { test, expect } from "@playwright/test";
import {
  API_BASE,
  uniqueName,
  uniqueStudentNumber,
  uniqueUsername,
} from "../helpers";
import {
  run,
  adminHeaders,
  unwrapData,
} from "./shared";

export function registerPhase6dAnd6e() {
  test("Phase 6d — students enrolled in the school year with program + section (API)", async ({
    request,
  }) => {
    const headers = await adminHeaders(request);

    const createStudent = async (base: string) => {
      const res = await request.post(`${API_BASE}/students`, {
        data: {
          fullName: uniqueName(base),
          emailName: uniqueUsername("stu"),
          studentId: uniqueStudentNumber("STU"),
        },
        headers,
      });
      expect(res.status()).toBe(201);
      return await unwrapData<{ id: string; fullName: string; status: string }>(res);
    };

    await test.step("create two students", async () => {
      const s1 = await createStudent("Student One");
      const s2 = await createStudent("Student Two");
      run.student1 = s1;
      run.student2 = s2;
      expect(s1.id).toBeTruthy();
      expect(s2.id).toBeTruthy();
    });

    await test.step("school-year enrollment for student1", async () => {
      const res = await request.post(
        `${API_BASE}/school-years/${run.schoolYearId}/enrollments`,
        { data: { student_id: run.student1!.id }, headers },
      );
      expect(res.status()).toBe(201);
      const sye = await unwrapData<{
        id: string;
        student_id: string;
        school_year_id: string;
      }>(res);
      expect(sye.student_id).toBe(run.student1!.id);
      expect(sye.school_year_id).toBe(run.schoolYearId);
    });

    await test.step("program enrollment pins the JHS level", async () => {
      const res = await request.post(
        `${API_BASE}/school-years/${run.schoolYearId}/enrollments/students/${run.student1!.id}/programs`,
        { data: { program_id: run.jhsProgramId, level_id: run.levelIds![0] }, headers },
      );
      expect(res.status()).toBe(201);
      const pe = await unwrapData<{
        id: string;
        program_id: string;
        level: { id: string } | null;
        section: { id: string } | null;
      }>(res);
      expect(pe.program_id).toBe(run.jhsProgramId);
      expect(pe.level?.id).toBe(run.levelIds![0]);
      expect(pe.section).toBeNull();
      run.programEnrollmentId = pe.id;
    });

    await test.step("assign the created section", async () => {
      const res = await request.patch(
        `${API_BASE}/school-years/${run.schoolYearId}/enrollments/programs/${run.programEnrollmentId}`,
        { data: { section_id: run.sectionId }, headers },
      );
      expect(res.status()).toBe(200);
      const pe = await unwrapData<{ section: { id: string } | null }>(res);
      expect(pe.section?.id).toBe(run.sectionId);
    });

    await test.step("enrollment list reflects student1 only", async () => {
      const res = await request.get(
        `${API_BASE}/school-years/${run.schoolYearId}/enrollments`,
        { headers, params: { limit: 100 } },
      );
      expect(res.status()).toBe(200);
      const list = await unwrapData<{ data: Array<{ student_id: string }> }>(res);
      expect(list.data.some((e) => e.student_id === run.student1!.id)).toBe(true);
      expect(list.data.some((e) => e.student_id === run.student2!.id)).toBe(false);
    });
  });

  test("Phase 6e — class enrollment is gated on academic placement (API)", async ({
    request,
  }) => {
    const headers = await adminHeaders(request);

    await test.step("student1 (JHS placement) can be enrolled", async () => {
      const res = await request.post(`${API_BASE}/classes/${run.classItem!.id}/enroll`, {
        data: { studentId: run.student1!.id },
        headers,
      });
      expect(res.status()).toBe(201);
      const enr = await unwrapData<{ student_id: string; status: string }>(res);
      expect(enr.student_id).toBe(run.student1!.id);
      expect(enr.status).toBe("active");
    });

    await test.step("enrollments endpoint lists student1", async () => {
      const res = await request.get(`${API_BASE}/classes/${run.classItem!.id}/enrollments`, {
        headers,
      });
      expect(res.status()).toBe(200);
      const list = await unwrapData<Array<{ student_id: string; status: string }>>(res);
      expect(
        list.some((e) => e.student_id === run.student1!.id && e.status === "active"),
      ).toBe(true);
    });

    await test.step("student2 (no placement) is rejected with exact reason", async () => {
      const res = await request.post(`${API_BASE}/classes/${run.classItem!.id}/enroll`, {
        data: { studentId: run.student2!.id },
        headers,
      });
      expect(res.status()).toBe(400);
      const body = (await res.json()) as { message: string };
      expect(body.message).toContain("Student is not eligible for this class");
      expect(body.message).toContain(
        "The student has no active academic placement for this school year.",
      );
    });

    // The elementary-department cross-program rejection is covered by the
    // class-level gating check in Phase 7a (a student placed at the wrong JHS
    // level for a level-bound class is rejected with the same "same program,
    // course/strand, or level" reason).

    await test.step("eligible-students only surfaces non-enrolled candidates", async () => {
      const res = await request.get(
        `${API_BASE}/classes/${run.classItem!.id}/eligible-students`,
        { headers },
      );
      expect(res.status()).toBe(200);
      const list = await unwrapData<Array<{ id: string }>>(res);
      const ids = list.map((s) => s.id);
      expect(ids).not.toContain(run.student1!.id);
      expect(ids).not.toContain(run.student2!.id);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 7 — Class enrollment lifecycle (UI + API): enrolling the students
  // created in Phase 2 into the class, the gating rule (same department AND level
  // where the class is registered), duplicate/capacity/removal behaviors, and the
  // year-end guard. The auto-unenroll SCRUB itself is proven at the backend layer
  // (backend/test/lane1-item9-enrollment-auto-unenroll.e2e-spec.ts) because the
  // API only ends an ACTIVE school year while this suite's year is `pending`.
  // ─────────────────────────────────────────────────────────────────────────────

}