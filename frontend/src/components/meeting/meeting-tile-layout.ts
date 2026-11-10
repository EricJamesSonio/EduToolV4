export interface MeetingTileRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function getMeetingTileRects(
  count: number,
  maxCols?: number,
): MeetingTileRect[] {
  if (count <= 0) return [];

  const cols = maxCols ?? (count <= 2 ? 1 : count <= 8 ? 2 : 3);
  const rows = Math.ceil(count / cols);
  const firstRowCount = count - cols * (rows - 1);
  const rowHeight = 100 / rows;
  const rects: MeetingTileRect[] = [];

  for (let r = 0; r < rows; r += 1) {
    const inRow = r === 0 ? firstRowCount : cols;
    const width = 100 / inRow;
    for (let c = 0; c < inRow; c += 1) {
      rects.push({ x: c * width, y: r * rowHeight, w: width, h: rowHeight });
    }
  }

  return rects;
}

export function getDesktopStageCols(count: number): number {
  if (count <= 1) return 1;
  if (count <= 4) return 2;
  if (count <= 9) return 3;
  return 4;
}