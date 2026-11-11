import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import {
  schoolProfileDepartmentsApi,
  type SchoolProfileDepartmentSummary,
} from "@/api/admin/school-profile-departments.api";

const departmentTypesKey = [
  ...queryKeys.admin.schoolProfile.list(),
  "department-types",
] as const;

export const useSchoolProfileDepartmentTypes = () => {
  return useAsyncQuery<SchoolProfileDepartmentSummary[]>(
    departmentTypesKey,
    schoolProfileDepartmentsApi.getDepartments,
    { meta: { preset: "list", feature: "school-profile" } },
  );
};