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

export interface ConcernItem {
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
  category?: { id: string; label: string; is_active: boolean };
  _count?: { messages: number };
  messages?: ConcernMessageItem[];
}

export interface PaginatedConcerns {
  data: ConcernItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface SubmitConcernRequest {
  categoryId: string;
  subject: string;
  body: string;
}

export interface ReplyConcernRequest {
  body: string;
}

export const studentConcernApi = {
  getCategories: async (): Promise<ConcernCategoryItem[]> => {
    const { data } = await apiClient.get("/concerns/categories");
    return unwrap<ConcernCategoryItem[]>(data);
  },

  submit: async (payload: SubmitConcernRequest): Promise<ConcernItem> => {
    const { data } = await apiClient.post("/concerns", payload);
    return unwrap<ConcernItem>(data);
  },

  listMine: async (page = 1, limit = 20): Promise<PaginatedConcerns> => {
    const { data } = await apiClient.get("/concerns/mine", {
      params: { page, limit },
    });
    return unwrap<PaginatedConcerns>(data);
  },

  getThread: async (concernId: string): Promise<ConcernItem> => {
    const { data } = await apiClient.get(`/concerns/${concernId}`);
    return unwrap<ConcernItem>(data);
  },

  reply: async (concernId: string, payload: ReplyConcernRequest): Promise<ConcernItem> => {
    const { data } = await apiClient.post(`/concerns/${concernId}/reply`, payload);
    return unwrap<ConcernItem>(data);
  },
};