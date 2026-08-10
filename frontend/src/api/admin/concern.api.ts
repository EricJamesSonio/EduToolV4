import apiClient from "@/api/client";

function unwrap<T>(data: T | { data: T }): T {
  return data !== null && typeof data === "object" && "data" in (data as object)
    ? (data as { data: T }).data
    : (data as T);
}

export interface ConcernCategoryItem {
  id: string;
  org_id: string;
  label: string;
  is_default: boolean;
  is_active: boolean;
}

export interface ConcernMessageItem {
  id: string;
  concern_id: string;
  sender_account_id: string;
  sender_role: string;
  sender_name: string;
  body: string;
  created_at: string;
}

export interface ConcernDetailItem {
  id: string;
  org_id: string;
  category_id: string;
  sender_account_id: string;
  sender_role: string;
  subject: string;
  status: "open" | "resolved" | string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  resolved_by?: string | null;
  resolved_at?: string | null;
  category?: { id: string; label: string; is_default: boolean; is_active: boolean };
  _count?: { messages: number };
  messages?: ConcernMessageItem[];
}

/**
 * Row shape returned by GET /concerns/staff (paged). The list only includes the
 * single most-recent message (lastMessage), not the full thread.
 */
export interface StaffConcernRow {
  id: string;
  org_id: string;
  category_id: string;
  sender_account_id: string;
  sender_role: string;
  subject: string;
  status: "open" | "resolved" | string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  category?: { id: string; label: string; is_default: boolean; is_active: boolean };
  _count?: { messages: number };
  messages?: Array<{ id: string; sender_name: string; body: string; created_at: string }>;
}

export interface PaginatedStaffConcerns {
  data: StaffConcernRow[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface ListStaffFilters {
  status?: string;
  categoryId?: string;
  senderRole?: string;
  page?: number;
  limit?: number;
}

export interface ReplyConcernRequest {
  body: string;
}

export interface CreateCategoryRequest {
  label: string;
}

export interface UpdateCategoryRequest {
  label?: string;
  is_active?: boolean;
}

export const adminConcernApi = {
  // ── Concerns ─────────────────────────────────────────
  listAll: async (filters: ListStaffFilters = {}): Promise<PaginatedStaffConcerns> => {
    const { data } = await apiClient.get("/concerns/staff", {
      params: {
        status: filters.status || undefined,
        categoryId: filters.categoryId || undefined,
        senderRole: filters.senderRole || undefined,
        page: filters.page ?? 1,
        limit: filters.limit ?? 20,
      },
    });
    return unwrap<PaginatedStaffConcerns>(data);
  },

  getThread: async (concernId: string): Promise<ConcernDetailItem> => {
    const { data } = await apiClient.get(`/concerns/staff/${concernId}`);
    return unwrap<ConcernDetailItem>(data);
  },

  reply: async (concernId: string, payload: ReplyConcernRequest): Promise<ConcernDetailItem> => {
    const { data } = await apiClient.post(`/concerns/staff/${concernId}/reply`, payload);
    return unwrap<ConcernDetailItem>(data);
  },

  resolve: async (concernId: string): Promise<ConcernDetailItem> => {
    const { data } = await apiClient.patch(`/concerns/staff/${concernId}/resolve`);
    return unwrap<ConcernDetailItem>(data);
  },

  reopen: async (concernId: string): Promise<ConcernDetailItem> => {
    const { data } = await apiClient.patch(`/concerns/staff/${concernId}/reopen`);
    return unwrap<ConcernDetailItem>(data);
  },

  // ── Categories (admin manager) ───────────────────────
  getCategories: async (): Promise<ConcernCategoryItem[]> => {
    const { data } = await apiClient.get("/concerns/categories/all");
    return unwrap<ConcernCategoryItem[]>(data);
  },

  createCategory: async (payload: CreateCategoryRequest): Promise<ConcernCategoryItem> => {
    const { data } = await apiClient.post("/concerns/categories", payload);
    return unwrap<ConcernCategoryItem>(data);
  },

  updateCategory: async (
    categoryId: string,
    payload: UpdateCategoryRequest,
  ): Promise<ConcernCategoryItem> => {
    const { data } = await apiClient.patch(`/concerns/categories/${categoryId}`, payload);
    return unwrap<ConcernCategoryItem>(data);
  },
};