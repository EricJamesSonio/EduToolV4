import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { schoolProfileApi } from "@/api/admin/school-profile.api";
import type {
  SchoolProfileDepartment,
  SchoolProfileCourse,
  SchoolProfileStrand,
  SchoolProfileLevel,
  SchoolProfileSection,
  SchoolProfileSubject,
  SchoolProfileData,
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
import type { DraftDepartment, DraftGradingScale, DraftGradingScheme, DraftSemesterTermConfig } from "./useSchoolProfileDraft"


const profileKey = queryKeys.admin.schoolProfile.list();
// Dedicated sub-key so OrgHeroCard's array-shaped query does not collide with
// the object-shaped SchoolProfileData cache (same fetch, different `select`).
const profileDepartmentsKey = [...profileKey, "departments"] as const;

export const useSchoolProfile = () => {
  return useAsyncQuery<SchoolProfileDepartment[]>(
    profileDepartmentsKey,
    async () => {
      const data = await schoolProfileApi.getProfile();
      // getProfile normalizes array-legacy vs object responses; defensive fallback
      // if cache was ever poisoned with the full object.
      if (Array.isArray(data)) return data as unknown as SchoolProfileDepartment[];
      if (Array.isArray((data as SchoolProfileData)?.departments)) {
        return (data as SchoolProfileData).departments;
      }
      return [];
    },
    { meta: { preset: "list", feature: "school-profile" } },
  );
};

export const useSchoolProfileData = () => {
  return useAsyncQuery<SchoolProfileData>(
    profileKey,
    schoolProfileApi.getProfile,
    { meta: { preset: "list", feature: "school-profile" } },
  );
};

export const useSaveSchoolProfile = () => {
  return useMutationWithInvalidation<
    void,
    Error,
    DraftDepartment[] | { departments: DraftDepartment[]; gradingScales?: DraftGradingScale[]; gradingSchemes?: DraftGradingScheme[]; semesterTermConfigs?: DraftSemesterTermConfig[] }
  >(
    (payload) => {
      if (Array.isArray(payload)) return schoolProfileApi.saveProfile(payload as DraftDepartment[]);
      return schoolProfileApi.saveProfile(payload as any);
    },
    { invalidateKeys: [profileKey, profileDepartmentsKey] },
  )
}

export const useSelectDepartment = () => {
  return useMutationWithInvalidation<SchoolProfileDepartment, Error, string>(
    (type) => schoolProfileApi.selectDepartment(type),
    { invalidateKeys: [profileKey, profileDepartmentsKey] },
  );
};

export const useDeselectDepartment = () => {
  return useMutationWithInvalidation<void, Error, string>(
    (type) => schoolProfileApi.deselectDepartment(type),
    { invalidateKeys: [profileKey, profileDepartmentsKey] },
  );
};

export const useCreateProfileCourse = () => {
  return useMutationWithInvalidation<
    SchoolProfileCourse,
    Error,
    { departmentId: string; data: CreateProfileCourseRequest }
  >(
    ({ departmentId, data }) => schoolProfileApi.createCourse(departmentId, data),
    { invalidateKeys: [profileKey, profileDepartmentsKey] },
  );
};

export const useUpdateProfileCourse = () => {
  return useMutationWithInvalidation<
    SchoolProfileCourse,
    Error,
    { id: string; data: UpdateProfileCourseRequest }
  >(
    ({ id, data }) => schoolProfileApi.updateCourse(id, data),
    { invalidateKeys: [profileKey, profileDepartmentsKey] },
  );
};

export const useDeleteProfileCourse = () => {
  return useMutationWithInvalidation<void, Error, string>(
    (id) => schoolProfileApi.deleteCourse(id),
    { invalidateKeys: [profileKey, profileDepartmentsKey] },
  );
};

export const useCreateProfileStrand = () => {
  return useMutationWithInvalidation<
    SchoolProfileStrand,
    Error,
    { departmentId: string; data: CreateProfileStrandRequest }
  >(
    ({ departmentId, data }) => schoolProfileApi.createStrand(departmentId, data),
    { invalidateKeys: [profileKey, profileDepartmentsKey] },
  );
};

export const useUpdateProfileStrand = () => {
  return useMutationWithInvalidation<
    SchoolProfileStrand,
    Error,
    { id: string; data: UpdateProfileStrandRequest }
  >(
    ({ id, data }) => schoolProfileApi.updateStrand(id, data),
    { invalidateKeys: [profileKey, profileDepartmentsKey] },
  );
};

export const useDeleteProfileStrand = () => {
  return useMutationWithInvalidation<void, Error, string>(
    (id) => schoolProfileApi.deleteStrand(id),
    { invalidateKeys: [profileKey, profileDepartmentsKey] },
  );
};

export const useCreateProfileLevel = () => {
  return useMutationWithInvalidation<
    SchoolProfileLevel,
    Error,
    { departmentId: string; data: CreateProfileLevelRequest }
  >(
    ({ departmentId, data }) => schoolProfileApi.createLevel(departmentId, data),
    { invalidateKeys: [profileKey, profileDepartmentsKey] },
  );
};

export const useUpdateProfileLevel = () => {
  return useMutationWithInvalidation<
    SchoolProfileLevel,
    Error,
    { id: string; data: UpdateProfileLevelRequest }
  >(
    ({ id, data }) => schoolProfileApi.updateLevel(id, data),
    { invalidateKeys: [profileKey, profileDepartmentsKey] },
  );
};

export const useDeleteProfileLevel = () => {
  return useMutationWithInvalidation<void, Error, string>(
    (id) => schoolProfileApi.deleteLevel(id),
    { invalidateKeys: [profileKey, profileDepartmentsKey] },
  );
};

export const useCreateProfileSection = () => {
  return useMutationWithInvalidation<
    SchoolProfileSection,
    Error,
    { levelId: string; data: CreateProfileSectionRequest }
  >(
    ({ levelId, data }) => schoolProfileApi.createSection(levelId, data),
    { invalidateKeys: [profileKey, profileDepartmentsKey] },
  );
};

export const useUpdateProfileSection = () => {
  return useMutationWithInvalidation<
    SchoolProfileSection,
    Error,
    { id: string; data: UpdateProfileSectionRequest }
  >(
    ({ id, data }) => schoolProfileApi.updateSection(id, data),
    { invalidateKeys: [profileKey, profileDepartmentsKey] },
  );
};

export const useDeleteProfileSection = () => {
  return useMutationWithInvalidation<void, Error, string>(
    (id) => schoolProfileApi.deleteSection(id),
    { invalidateKeys: [profileKey, profileDepartmentsKey] },
  );
};

export const useCreateProfileSubject = () => {
  return useMutationWithInvalidation<
    SchoolProfileSubject,
    Error,
    { levelId: string; data: CreateProfileSubjectRequest }
  >(
    ({ levelId, data }) => schoolProfileApi.createSubject(levelId, data),
    { invalidateKeys: [profileKey, profileDepartmentsKey] },
  );
};

export const useUpdateProfileSubject = () => {
  return useMutationWithInvalidation<
    SchoolProfileSubject,
    Error,
    { id: string; data: UpdateProfileSubjectRequest }
  >(
    ({ id, data }) => schoolProfileApi.updateSubject(id, data),
    { invalidateKeys: [profileKey, profileDepartmentsKey] },
  );
};

export const useDeleteProfileSubject = () => {
  return useMutationWithInvalidation<void, Error, string>(
    (id) => schoolProfileApi.deleteSubject(id),
    { invalidateKeys: [profileKey, profileDepartmentsKey] },
  );
};
