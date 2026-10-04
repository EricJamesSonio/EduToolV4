import client from "@/api/client";
import type {
  GeneratePreview,
  GenerateReadiness,
  GenerateRequest,
  GeneratorRoster,
  CommitGenerateRequest,
  CommitGenerateResponse,
} from "@/types/admin/class-generator.types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/**
 * All three endpoints are POST/read-only helpers around the generator. The
 * names make the side effects obvious at the call site: `preview` writes
 * nothing, `commit` does.
 */
export const classGeneratorApi = {
  readiness: async (params: {
    schoolYearId: string;
    programIds: string;
  }): Promise<GenerateReadiness> => {
    const res = await client.get<ApiResponse<GenerateReadiness>>(
      "/class-generator/readiness",
      { params },
    );
    return res.data.data;
  },

  /** Who can teach what this school year. Read-only. */
  roster: async (schoolYearId: string): Promise<GeneratorRoster> => {
    const res = await client.get<ApiResponse<GeneratorRoster>>(
      "/class-generator/roster",
      { params: { schoolYearId } },
    );
    return res.data.data;
  },

  /** Builds a plan. Writes nothing. */
  preview: async (data: GenerateRequest): Promise<GeneratePreview> => {
    const res = await client.post<ApiResponse<GeneratePreview>>(
      "/class-generator/preview",
      data,
    );
    return res.data.data;
  },

  /** Writes the approved plan. Requires `confirmed: true`. */
  commit: async (data: CommitGenerateRequest): Promise<CommitGenerateResponse> => {
    const res = await client.post<ApiResponse<CommitGenerateResponse>>(
      "/class-generator/commit",
      data,
    );
    return res.data.data;
  },
};