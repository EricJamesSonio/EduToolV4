import apiClient from "@/api/client";

type Envelope<T> = { success: boolean; data: T };

export interface SheetMapping {
  headerRow: number;
  dataStartRow?: number | null;
  idCol: number | null;
  nameCols: number[];
  subjectCols: number[];
  termCols: Array<{ col: number; termIndex: number }>;
  finalCol: number | null;
  remarkCol: number | null;
  valueMode?: "grade" | "score" | null;
}

export interface TemplateAnalysis {
  sheets: Array<{
    sheetName: string;
    headerRow: number;
    studentRows: number;
    hasIdColumn: boolean;
    nameColumns: number;
    subjectColumns: number;
    mapped: boolean;
    gradeColumns: Array<{ header: string; kind: string; termIndex?: number }>;
  }>;
  untouchedSheets: string[];
  totalStudentRows: number;
}

export interface SheetInfo {
  name: string;
  detected: boolean;
  mapped: boolean;
}

export interface TemplatePreviewData {
  sheets: SheetInfo[];
  sheetName: string;
  offset: number;
  limit: number;
  rowCount: number;
  colCount: number;
  rows: Array<{ row: number; cells: string[] }>;
  mapping: SheetMapping | null;
}

export interface MappingColumn {
  col: number;
  letter: string;
  header: string;
  sample: string;
}

export interface MappingInfo {
  sheets: SheetInfo[];
  sheetName: string;
  rowCount: number;
  colCount: number;
  headerRow: number;
  columns: MappingColumn[];
  auto: SheetMapping | null;
  saved: SheetMapping | null;
  effective: SheetMapping | null;
}

export interface GradeTemplateMeta {
  id: string;
  name: string;
  fileName: string;
  schoolYearId: string;
  schoolYearName: string;
  programId: string | null;
  programName: string | null;
  submissionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramOption {
  id: string;
  name: string;
  type: string;
}

export interface ProgressRow {
  classId: string;
  subjectName: string;
  sectionName: string | null;
  educatorName: string;
  status: "submitted" | "pending";
  submittedAt: string | null;
  rowsWritten: number;
  ungraded: number;
  unmatched: number;
}

export interface TemplateProgress {
  total: number;
  submitted: number;
  rows: ProgressRow[];
}

export interface MyTemplateClass {
  classId: string;
  subjectName: string;
  sectionName: string | null;
  submittedAt: string | null;
}

export interface MyTemplate extends GradeTemplateMeta {
  classes: MyTemplateClass[];
}

export interface SubmitResult {
  totalRowsWritten: number;
  ambiguousRows: number;
  classes: Array<{
    classId: string;
    subjectName: string;
    rowsWritten: number;
    ungraded: number;
    unmatched: number;
  }>;
}

export interface UploadInput {
  file: File;
  schoolYearId: string;
  programId?: string;
  name?: string;
  idHeader?: string;
  nameHeader?: string;
  replace?: boolean;
}

export function colLetter(n: number): string {
  let s = "";
  let x = n;
  while (x > 0) {
    const m = (x - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    x = Math.floor((x - 1) / 26);
  }
  return s;
}

function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Errors on blob downloads arrive as a Blob; read the server message out of it. */
export async function readErrorMessage(err: unknown): Promise<string> {
  const e = err as {
    response?: { data?: unknown };
    message?: string;
  };
  const data = e?.response?.data;
  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text()) as { message?: string };
      if (parsed.message) return parsed.message;
    } catch {
      // fall through
    }
  } else if (data && typeof data === "object") {
    const msg = (data as { message?: string | string[] }).message;
    if (Array.isArray(msg)) return msg.join(", ");
    if (msg) return msg;
  }
  return e?.message ?? "Something went wrong.";
}

export const gradeTemplateApi = {
  // ── Admin ──
  programs: async (schoolYearId: string): Promise<ProgramOption[]> => {
    const { data } = await apiClient.get<Envelope<ProgramOption[]>>(
      "/grade-templates/programs",
      { params: { schoolYearId } },
    );
    return data.data;
  },

  list: async (schoolYearId?: string): Promise<GradeTemplateMeta[]> => {
    const { data } = await apiClient.get<Envelope<GradeTemplateMeta[]>>(
      "/grade-templates",
      { params: schoolYearId ? { schoolYearId } : undefined },
    );
    return data.data;
  },

  upload: async (
    input: UploadInput,
  ): Promise<{ id: string; name: string; analysis: TemplateAnalysis }> => {
    const form = new FormData();
    form.append("file", input.file);
    form.append("schoolYearId", input.schoolYearId);
    if (input.programId) form.append("programId", input.programId);
    if (input.name?.trim()) form.append("name", input.name.trim());
    if (input.idHeader?.trim()) form.append("idHeader", input.idHeader.trim());
    if (input.nameHeader?.trim()) {
      form.append("nameHeader", input.nameHeader.trim());
    }
    if (input.replace) form.append("replace", "true");
    const { data } = await apiClient.post<
      Envelope<{ id: string; name: string; analysis: TemplateAnalysis }>
    >("/grade-templates", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  analysis: async (id: string): Promise<TemplateAnalysis> => {
    const { data } = await apiClient.get<Envelope<TemplateAnalysis>>(
      `/grade-templates/${id}/analysis`,
    );
    return data.data;
  },

  preview: async (
    id: string,
    params: { sheet?: string; offset?: number; limit?: number },
  ): Promise<TemplatePreviewData> => {
    const { data } = await apiClient.get<Envelope<TemplatePreviewData>>(
      `/grade-templates/${id}/preview`,
      { params },
    );
    return data.data;
  },

  mapping: async (
    id: string,
    params: { sheet?: string; headerRow?: number },
  ): Promise<MappingInfo> => {
    const { data } = await apiClient.get<Envelope<MappingInfo>>(
      `/grade-templates/${id}/mapping`,
      { params },
    );
    return data.data;
  },

  saveMapping: async (
    id: string,
    sheetName: string,
    mapping: SheetMapping | null,
  ): Promise<TemplateAnalysis> => {
    const { data } = await apiClient.put<Envelope<TemplateAnalysis>>(
      `/grade-templates/${id}/mapping`,
      { sheetName, mapping },
    );
    return data.data;
  },

  progress: async (id: string): Promise<TemplateProgress> => {
    const { data } = await apiClient.get<Envelope<TemplateProgress>>(
      `/grade-templates/${id}/progress`,
    );
    return data.data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/grade-templates/${id}`);
  },

  downloadMaster: async (id: string, fileName: string): Promise<void> => {
    const res = await apiClient.get(`/grade-templates/${id}/master`, {
      responseType: "blob",
    });
    saveBlob(res.data as Blob, fileName);
  },

  // ── Educator ──
  mine: async (): Promise<MyTemplate[]> => {
    const { data } = await apiClient.get<Envelope<MyTemplate[]>>(
      "/grade-templates/mine",
    );
    return data.data;
  },

  downloadMine: async (id: string, fileName: string): Promise<void> => {
    const res = await apiClient.get(`/grade-templates/mine/${id}/download`, {
      responseType: "blob",
    });
    saveBlob(res.data as Blob, fileName);
  },

  submitMine: async (id: string): Promise<SubmitResult> => {
    const { data } = await apiClient.post<Envelope<SubmitResult>>(
      `/grade-templates/mine/${id}/submit`,
    );
    return data.data;
  },
};