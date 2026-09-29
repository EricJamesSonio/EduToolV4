import client from "@/api/client";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface HierarchyLevel {
  id: string;
  name: string;
  rank: number;
}

export interface HierarchyNode {
  id: string;
  name: string;
  levelId: string | null;
  levelName: string | null;
  yearRank: number;
  courseName: string | null;
  strandName: string | null;
  termLabel: string | null;
}

export interface HierarchyEdge {
  from: string;
  to: string;
}

export interface SubjectHierarchy {
  levels: HierarchyLevel[];
  nodes: HierarchyNode[];
  edges: HierarchyEdge[];
  truncated: boolean;
}

export interface HierarchyScope {
  schoolYearId?: string;
  programId?: string;
  courseId?: string;
  strandId?: string;
}

export type SubjectStatus = "completed" | "pending" | "none";

export interface SubjectStatusInfo {
  status: SubjectStatus;
  source: "override" | "grade" | "none";
}

export const subjectHierarchyApi = {
  get: async (scope: HierarchyScope): Promise<SubjectHierarchy> => {
    const res = await client.get<ApiResponse<SubjectHierarchy>>("/subjects/hierarchy", {
      params: {
        ...(scope.schoolYearId ? { schoolYearId: scope.schoolYearId } : {}),
        ...(scope.programId ? { programId: scope.programId } : {}),
        ...(scope.courseId ? { courseId: scope.courseId } : {}),
        ...(scope.strandId ? { strandId: scope.strandId } : {}),
      },
    });
    return (
      res.data.data ?? { levels: [], nodes: [], edges: [], truncated: false }
    );
  },
  statuses: async (
    studentId: string,
    subjectIds: string[],
  ): Promise<Record<string, SubjectStatusInfo>> => {
    if (subjectIds.length === 0) return {};
    const res = await client.get<ApiResponse<Record<string, SubjectStatusInfo>>>(
      `/students/${studentId}/subject-completions/statuses`,
      { params: { subjectIds: subjectIds.join(",") } },
    );
    return res.data.data ?? {};
  },
};
