import client from "@/api/client"
import type { AxiosError } from "axios"
import type {
  GradeLock,
  GradeLockSetting,
  GradeLockResponse,
  AutoLockResponse,
  UnlockRequest,
  BulkAssignResult,
  BulkAssignTotals,
  BulkAssignOptions,
} from "@/types/admin/grade-lock.types"

/** Ids per assign-bulk request. Endpoint cap is 1000; 500 keeps each request
 *  inside the endpoint's 30/min throttle and a single interactive transaction. */
const BULK_CHUNK_SIZE = 500

/**
 * Error raised by assignSettingBulk, carrying whatever was applied before the
 * failure so the UI can say "applied to X of Y" instead of a bare error.
 */
export class BulkAssignError extends Error {
  readonly partial: BulkAssignTotals
  readonly cancelled: boolean

  constructor(message: string, partial: BulkAssignTotals) {
    super(message)
    this.name = "BulkAssignError"
    this.partial = partial
    this.cancelled = message === "Assignment cancelled"
  }
}

/** Axios errors carry the server's message; anything else is unexpected. */
function readApiErrorMessage(err: unknown): string {
  const axiosErr = err as AxiosError<{ message?: string }>
  return (
    axiosErr?.response?.data?.message ??
    axiosErr?.message ??
    "Failed to apply template"
  )
}

export interface CreateGradeLockSettingRequest {
  name: string
  description?: string
  lockType: "hard" | "soft" | "flexible"
  lock_deadline?: string
  deadlineDays?: number
  allowOverride: boolean
  is_default?: boolean
}

type ApiResponse<T> = {
  success: boolean
  data: T
}

export const gradeLockApi = {
  // ─── Settings ─────────────────────────────

  getSettings: async (): Promise<GradeLockSetting[]> => {
    const res = await client.get<ApiResponse<GradeLockSetting[]>>(
      "/grade-lock/settings"
    )
    return res.data.data ?? []
  },

  getSetting: async (
    schoolYearId: string
  ): Promise<GradeLockSetting | null> => {
    try {
      const res = await client.get<ApiResponse<GradeLockSetting>>(
        "/grade-lock/settings",
        { params: { schoolYearId } }
      )
      return res.data.data ?? null
    } catch (err: any) {
      if (err?.response?.status === 404) return null
      throw err
    }
  },

  createSetting: async (
    data: CreateGradeLockSettingRequest
  ): Promise<GradeLockSetting> => {
    const res = await client.post<ApiResponse<GradeLockSetting>>(
      "/grade-lock/settings",
      data
    )
    return res.data.data
  },

  updateSetting: async (
    id: string,
    data: Partial<CreateGradeLockSettingRequest>
  ): Promise<GradeLockSetting> => {
    const res = await client.put<ApiResponse<GradeLockSetting>>(
      `/grade-lock/settings/${id}`,
      data
    )
    return res.data.data
  },

  // ─── Class Locks ──────────────────────────

getLocks: async (params?: { schoolYearId?: string }): Promise<GradeLock[]> => {
  const res = await client.get<ApiResponse<GradeLock[]>>(
    "/grade-lock/classes",
    {
      params, // ✅ pass object directly
    }
  )

  return res.data.data ?? []
},

  lockClass: async (
    classId: string,
    reason?: string
  ): Promise<GradeLockResponse> => {
    const res = await client.post<ApiResponse<GradeLockResponse>>(
      `/grade-lock/${classId}/lock`,
      { reason }
    )
    return res.data.data
  },

  unlockClass: async (
    classId: string,
    reason: string
  ): Promise<GradeLockResponse> => {
    const res = await client.post<ApiResponse<GradeLockResponse>>(
      `/grade-lock/${classId}/unlock`,
      { reason }
    )
    return res.data.data
  },

  overrideLock: async (
    classId: string,
    reason: string
  ): Promise<GradeLockResponse> => {
    const res = await client.post<ApiResponse<GradeLockResponse>>(
      `/grade-lock/${classId}/override`,
      { reason }
    )
    return res.data.data
  },

  // ─── Auto Lock ────────────────────────────

  autoLock: async (): Promise<AutoLockResponse> => {
    const res = await client.post<ApiResponse<AutoLockResponse>>(
      "/grade-lock/auto-lock"
    )
    return res.data.data
  },

assignSetting: async (
  classId: string,
  settingId: string
): Promise<GradeLock> => {
  const res = await client.post<ApiResponse<GradeLock>>(
    "/grade-lock/assign",
    {
      class_id: classId,
      setting_id: settingId,
    }
  )
  return res.data.data
},

  /**
   * Apply one template to many classes.
   *
   * Chunks SEQUENTIALLY at 500 ids per request (the endpoint accepts up to
   * 1000, but 500 keeps each request comfortably inside the 30/min
   * assign-bulk throttle and inside a single interactive transaction).
   * Chunks are never issued in parallel: the server is the shared bottleneck
   * and a burst would only queue up behind its own writes.
   *
   * Stops on the first error and throws a BulkAssignError carrying the partial
   * totals, so the UI can report "applied to X of Y before failing".
   */
  assignSettingBulk: async (
    classIds: string[],
    settingId: string,
    options: BulkAssignOptions = {}
  ): Promise<BulkAssignTotals> => {
    const { signal, onProgress } = options

    // De-duplicate before chunking: the same class can legitimately appear
    // twice (e.g. joined filters), and double-sending would inflate the counts.
    const unique = [...new Set(classIds)]
    const requested = unique.length
    const chunksTotal = Math.max(1, Math.ceil(requested / BULK_CHUNK_SIZE))

    const totals: BulkAssignTotals = {
      assigned: 0,
      skippedLocked: 0,
      skippedUnchanged: 0,
      skippedInvalid: 0,
      requested,
      chunksDone: 0,
      chunksTotal,
    }

    if (requested === 0) return totals

    let done = 0
    for (let i = 0; i < unique.length; i += BULK_CHUNK_SIZE) {
      // Checked BETWEEN chunks, so an in-flight request always completes.
      if (signal?.aborted) {
        throw new BulkAssignError("Assignment cancelled", totals)
      }

      const chunk = unique.slice(i, i + BULK_CHUNK_SIZE)
      try {
        const res = await client.post<ApiResponse<BulkAssignResult>>(
          "/grade-lock/assign-bulk",
          { class_ids: chunk, setting_id: settingId },
          { signal }
        )
        const data = res.data.data
        totals.assigned += data.assigned
        totals.skippedLocked += data.skippedLocked
        totals.skippedUnchanged += data.skippedUnchanged
        totals.skippedInvalid += data.skippedInvalid
      } catch (err) {
        if (signal?.aborted) {
          throw new BulkAssignError("Assignment cancelled", totals)
        }
        throw new BulkAssignError(readApiErrorMessage(err), totals)
      }

      totals.chunksDone += 1
      done += chunk.length
      onProgress?.(done, requested)
    }

    return totals
  },

  // ─── Unlock Requests ──────────────────────

  getUnlockRequests: async (): Promise<UnlockRequest[]> => {
    const res = await client.get<ApiResponse<UnlockRequest[]>>(
      "/grade-lock/unlock-requests"
    )
    return res.data.data ?? []
  },

  grantUnlock: async (
    classId: string,
    data: { reason: string; newDeadline?: string }
  ): Promise<GradeLockResponse> => {
    const res = await client.post<ApiResponse<GradeLockResponse>>(
      `/grade-lock/${classId}/grant-unlock`,
      data
    )
    return res.data.data
  },

  denyUnlock: async (
    classId: string,
    reason: string
  ): Promise<{ success: boolean }> => {
    const res = await client.post<ApiResponse<{ success: boolean }>>(
      `/grade-lock/${classId}/deny-unlock`,
      { reason }
    )
    return res.data.data
  },
}