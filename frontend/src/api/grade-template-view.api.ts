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

export const gradeTemplateViewApi = {
  view: async (
    id: string,
    params: { sheet?: string; offset?: number; limit?: number },
  ): Promise<SheetView> => {
    const { data } = await apiClient.get<Envelope<SheetView>>(
      `/grade-templates/${id}/view`,
      { params },
    );
    return data.data;
  },
};