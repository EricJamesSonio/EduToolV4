// ===== File: frontend\src\hooks\admin\useSchoolProfile.ts =====
import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { schoolProfileApi } from "@/api/admin/school-profile.api";
import type {
  SchoolProfileDepartment,
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

const profileKey = queryKeys.admin.schoolProfile.list();

export const useSchoolProfile = () => {
  return useAsyncQuery<SchoolProfileDepartment[]>(
    profileKey,
    schoolProfileApi.getProfile,
    { meta: { preset: "list", feature: "school-profile" } },
  );
};

export const useSelectDepartment = () => {
  return useMutationWithInvalidation<SchoolProfileDepartment, Error, string>(
    (type) => schoolProfileApi.selectDepartment(type),
    { invalidateKeys: [profileKey] },
  );
};

export const useDeselectDepartment = () => {
  return useMutationWithInvalidation<void, Error, string>(
    (type) => schoolProfileApi.deselectDepartment(type),
    { invalidateKeys: [profileKey] },
  );
};

export const useCreateProfileCourse = () => {
  return useMutationWithInvalidation<
    unknown,
    Error,
    { departmentId: string; data: CreateProfileCourseRequest }
  >(
    ({ departmentId, data }) => schoolProfileApi.createCourse(departmentId, data),
    { invalidateKeys: [profileKey] },
  );
};

export const useUpdateProfileCourse = () => {
  return useMutationWithInvalidation<
    unknown,
    Error,
    { id: string; data: UpdateProfileCourseRequest }
  >(
    ({ id, data }) => schoolProfileApi.updateCourse(id, data),
    { invalidateKeys: [profileKey] },
  );
};

export const useDeleteProfileCourse = () => {
  return useMutationWithInvalidation<void, Error, string>(
    (id) => schoolProfileApi.deleteCourse(id),
    { invalidateKeys: [profileKey] },
  );
};

export const useCreateProfileStrand = () => {
  return useMutationWithInvalidation<
    unknown,
    Error,
    { departmentId: string; data: CreateProfileStrandRequest }
  >(
    ({ departmentId, data }) => schoolProfileApi.createStrand(departmentId, data),
    { invalidateKeys: [profileKey] },
  );
};

export const useUpdateProfileStrand = () => {
  return useMutationWithInvalidation<
    unknown,
    Error,
    { id: string; data: UpdateProfileStrandRequest }
  >(
    ({ id, data }) => schoolProfileApi.updateStrand(id, data),
    { invalidateKeys: [profileKey] },
  );
};

export const useDeleteProfileStrand = () => {
  return useMutationWithInvalidation<void, Error, string>(
    (id) => schoolProfileApi.deleteStrand(id),
    { invalidateKeys: [profileKey] },
  );
};

export const useCreateProfileLevel = () => {
  return useMutationWithInvalidation<
    unknown,
    Error,
    { departmentId: string; data: CreateProfileLevelRequest }
  >(
    ({ departmentId, data }) => schoolProfileApi.createLevel(departmentId, data),
    { invalidateKeys: [profileKey] },
  );
};

export const useUpdateProfileLevel = () => {
  return useMutationWithInvalidation<
    unknown,
    Error,
    { id: string; data: UpdateProfileLevelRequest }
  >(
    ({ id, data }) => schoolProfileApi.updateLevel(id, data),
    { invalidateKeys: [profileKey] },
  );
};

export const useDeleteProfileLevel = () => {
  return useMutationWithInvalidation<void, Error, string>(
    (id) => schoolProfileApi.deleteLevel(id),
    { invalidateKeys: [profileKey] },
  );
};

export const useCreateProfileSection = () => {
  return useMutationWithInvalidation<
    unknown,
    Error,
    { levelId: string; data: CreateProfileSectionRequest }
  >(
    ({ levelId, data }) => schoolProfileApi.createSection(levelId, data),
    { invalidateKeys: [profileKey] },
  );
};

export const useUpdateProfileSection = () => {
  return useMutationWithInvalidation<
    unknown,
    Error,
    { id: string; data: UpdateProfileSectionRequest }
  >(
    ({ id, data }) => schoolProfileApi.updateSection(id, data),
    { invalidateKeys: [profileKey] },
  );
};

export const useDeleteProfileSection = () => {
  return useMutationWithInvalidation<void, Error, string>(
    (id) => schoolProfileApi.deleteSection(id),
    { invalidateKeys: [profileKey] },
  );
};

export const useCreateProfileSubject = () => {
  return useMutationWithInvalidation<
    unknown,
    Error,
    { levelId: string; data: CreateProfileSubjectRequest }
  >(
    ({ levelId, data }) => schoolProfileApi.createSubject(levelId, data),
    { invalidateKeys: [profileKey] },
  );
};

export const useUpdateProfileSubject = () => {
  return useMutationWithInvalidation<
    unknown,
    Error,
    { id: string; data: UpdateProfileSubjectRequest }
  >(
    ({ id, data }) => schoolProfileApi.updateSubject(id, data),
    { invalidateKeys: [profileKey] },
  );
};

export const useDeleteProfileSubject = () => {
  return useMutationWithInvalidation<void, Error, string>(
    (id) => schoolProfileApi.deleteSubject(id),
    { invalidateKeys: [profileKey] },
  );
};
