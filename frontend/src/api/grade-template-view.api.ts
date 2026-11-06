import apiClient from "@/api/client";

type Envelope<T> = { success: boolean; data: T };

export interface ViewStyle {
  bg?: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  size?: number;
  align?: "left" | "center" | "right";
  valign?: "top" | "middle" | "bottom";
  wrap?: boolean;
  bt?: string;
  br?: string;
  bb?: string;
  bl?: string;
}

export interface ViewCell {
  t: string;
  s: number;
  rs?: number;
  cs?: number;
  skip?: boolean;
}

export interface ViewRow {
  row: number;
  h: number | null;
  hidden: boolean;
  cells: ViewCell[];
}

export interface SheetView {
  sheets: string[];
  sheetInfo: Array<{ name: string; rowCount: number }>;
  sheetName: string;
  offset: number;
  limit: number;
  colCount: number;
  rowCount: number;
  first: number;
  last: number;
  showGrid: boolean;
  cols: Array<{ w: number; hidden: boolean }>;
  rows: ViewRow[];
  styles: ViewStyle[];
}

// Requests for the same view share one call and are reused for a short while.
// Pending promises are cached too, so duplicate renders (React strict mode,
// remounts when switching tabs) never fire a second request.
const CACHE_TTL_MS = 120_000;
const CACHE_MAX = 30;
const cache = new Map<string, { at: number; promise: Promise<unknown> }>();

function cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return hit.promise as Promise<T>;
  }
  const promise = fetcher();
  cache.set(key, { at: Date.now(), promise });
  promise.catch(() => {
    if (cache.get(key)?.promise === promise) cache.delete(key);
  });
  while (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value as string | undefined;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
  return promise;
}

export const gradeTemplateViewApi = {
  /** `version` is bumped by the caller to force a fresh fetch. */
  view: (
    id: string,
    params: { sheet?: string; offset?: number; limit?: number },
    version = 0,
  ): Promise<SheetView> =>
    cached(
      `${id}|${params.sheet ?? ""}|${params.offset ?? 0}|${params.limit ?? 0}|${version}`,
      async () => {
        const { data } = await apiClient.get<Envelope<SheetView>>(
          `/grade-templates/${id}/view`,
          { params },
        );
        return data.data;
      },
    ),

  /** Every sheet in a single request. */
  viewAll: (id: string, version = 0): Promise<SheetView[]> =>
    cached(`${id}|all|${version}`, async () => {
      const { data } = await apiClient.get<Envelope<{ views: SheetView[] }>>(
        `/grade-templates/${id}/view-all`,
      );
      return data.data.views;
    }),
};