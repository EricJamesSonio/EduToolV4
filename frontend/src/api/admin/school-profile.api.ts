import client from "@/api/client";
import type {
  SchoolProfileDepartment,
  SchoolProfileCourse,
  SchoolProfileStrand,
  SchoolProfileLevel,
  SchoolProfileSection,
  SchoolProfileSubject,
  CreateProfileCourseRequest,
  UpdateProfileCourseRequest,
  CreateProfileStrandRequest,
  UpdateProfileStrandRequest,
  CreateProfileLevelRequest,
  UpdateProfileLevelRequest,
  CreateProfileSectionRequest,
  UpdateProfileSectionRequest,
  CreateProfileSubjectRequest,
  UpdateProfileSubjectRequest,
} from "@/types/admin/school-profile.types";
import type { DraftDepartment } from "@/hooks/admin/useSchoolProfileDraft"

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}


export const schoolProfileApi = {
  getProfile: async (): Promise<SchoolProfileDepartment[]> => {
    const res = await client.get<ApiEnvelope<SchoolProfileDepartment[]>>("/school-profile");
    return res.data.data;
  },

  selectDepartment: async (type: string): Promise<SchoolProfileDepartment> => {
    const res = await client.post<ApiEnvelope<SchoolProfileDepartment>>(
      `/school-profile/departments/${type}/select`,
    );
    return res.data.data;
  },

  deselectDepartment: async (type: string): Promise<void> => {
    await client.delete(`/school-profile/departments/${type}`);
  },

  createCourse: async (
    departmentId: string,
    data: CreateProfileCourseRequest,
  ): Promise<SchoolProfileCourse> => {
    const res = await client.post<ApiEnvelope<SchoolProfileCourse>>(
      `/school-profile/departments/${departmentId}/courses`,
      data,
    );
    return res.data.data;
  },

  updateCourse: async (
    id: string,
    data: UpdateProfileCourseRequest,
  ): Promise<SchoolProfileCourse> => {
    const res = await client.patch<ApiEnvelope<SchoolProfileCourse>>(
      `/school-profile/courses/${id}`,
      data,
    );
    return res.data.data;
  },

  deleteCourse: async (id: string): Promise<void> => {
    await client.delete(`/school-profile/courses/${id}`);
  },

  createStrand: async (
    departmentId: string,
    data: CreateProfileStrandRequest,
  ): Promise<SchoolProfileStrand> => {
    const res = await client.post<ApiEnvelope<SchoolProfileStrand>>(
      `/school-profile/departments/${departmentId}/strands`,
      data,
    );
    return res.data.data;
  },

  updateStrand: async (
    id: string,
    data: UpdateProfileStrandRequest,
  ): Promise<SchoolProfileStrand> => {
    const res = await client.patch<ApiEnvelope<SchoolProfileStrand>>(
      `/school-profile/strands/${id}`,
      data,
    );
    return res.data.data;
  },

  deleteStrand: async (id: string): Promise<void> => {
    await client.delete(`/school-profile/strands/${id}`);
  },

  createLevel: async (
    departmentId: string,
    data: CreateProfileLevelRequest,
  ): Promise<SchoolProfileLevel> => {
    const res = await client.post<ApiEnvelope<SchoolProfileLevel>>(
      `/school-profile/departments/${departmentId}/levels`,
      data,
    );
    return res.data.data;
  },

  updateLevel: async (
    id: string,
    data: UpdateProfileLevelRequest,
  ): Promise<SchoolProfileLevel> => {
    const res = await client.patch<ApiEnvelope<SchoolProfileLevel>>(
      `/school-profile/levels/${id}`,
      data,
    );
    return res.data.data;
  },

  deleteLevel: async (id: string): Promise<void> => {
    await client.delete(`/school-profile/levels/${id}`);
  },

  createSection: async (
    levelId: string,
    data: CreateProfileSectionRequest,
  ): Promise<SchoolProfileSection> => {
    const res = await client.post<ApiEnvelope<SchoolProfileSection>>(
      `/school-profile/levels/${levelId}/sections`,
      data,
    );
    return res.data.data;
  },

  updateSection: async (
    id: string,
    data: UpdateProfileSectionRequest,
  ): Promise<SchoolProfileSection> => {
    const res = await client.patch<ApiEnvelope<SchoolProfileSection>>(
      `/school-profile/sections/${id}`,
      data,
    );
    return res.data.data;
  },

  deleteSection: async (id: string): Promise<void> => {
    await client.delete(`/school-profile/sections/${id}`);
  },

  createSubject: async (
    levelId: string,
    data: CreateProfileSubjectRequest,
  ): Promise<SchoolProfileSubject> => {
    const res = await client.post<ApiEnvelope<SchoolProfileSubject>>(
      `/school-profile/levels/${levelId}/subjects`,
      data,
    );
    return res.data.data;
  },

  updateSubject: async (
    id: string,
    data: UpdateProfileSubjectRequest,
  ): Promise<SchoolProfileSubject> => {
    const res = await client.patch<ApiEnvelope<SchoolProfileSubject>>(
      `/school-profile/subjects/${id}`,
      data,
    );
    return res.data.data;
  },

  deleteSubject: async (id: string): Promise<void> => {
    await client.delete(`/school-profile/subjects/${id}`);
  },
  saveProfile: async (departments: DraftDepartment[]): Promise<void> => {
  const payload = departments.map((d) => ({
    type: d.type,
    courses: d.courses.map((c) => ({
      name: c.name,
      code: c.code,
      levels: c.levels.map((l) => ({
        name: l.name,
        orderIndex: l.orderIndex,
        sections: l.sections.map((s) => ({ name: s.name, capacity: s.capacity })),
        subjects: l.subjects.map((s) => ({ name: s.name, subjectType: s.subjectType })),
      })),
    })),
    strands: d.strands.map((s) => ({
      name: s.name,
      levels: s.levels.map((l) => ({
        name: l.name,
        orderIndex: l.orderIndex,
        sections: l.sections.map((sec) => ({ name: sec.name, capacity: sec.capacity })),
        subjects: l.subjects.map((sub) => ({ name: sub.name, subjectType: sub.subjectType })),
      })),
    })),
    levels: d.levels.map((l) => ({
      name: l.name,
      orderIndex: l.orderIndex,
      sections: l.sections.map((s) => ({ name: s.name, capacity: s.capacity })),
      subjects: l.subjects.map((s) => ({ name: s.name, subjectType: s.subjectType })),
    })),
    subjects: d.subjects.map((s) => ({ name: s.name, subjectType: s.subjectType })),
  }))
  await client.post("/school-profile/save", { departments: payload })
},
};